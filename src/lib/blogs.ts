/**
 * src/lib/blogs.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Blog scheduling module — strict TypeScript, no `any`, no `as` casts.
 *
 * Publish-time priority (highest → lowest):
 *   1. publishAt  — full ISO string, e.g. "2026-10-05T09:30:00+05:30"
 *   2. publishDate + publishTime  — "YYYY-MM-DD" + "HH:MM" (IST assumed)
 *   3. created_at — ISO string (may be UTC "Z" — see ⚠️ note below)
 *   4. publishedDate — "29 Sep, 2026" (date-only → 00:00 IST)
 *   5. No usable date → treat as already live
 *
 * ⚠️  Timezone trap: `created_at` values ending in "Z" are UTC.
 *     A post saved at 09:00 UTC is 14:30 IST, not 09:00 IST.
 *     The parser honours the "Z" offset correctly.
 *
 * ⚠️  Static-export warning: with `output: "export"` Next.js cannot hide
 *     future content at runtime (the HTML is pre-rendered at build time).
 *     Use `useLiveBlogs` + a scheduled CI rebuild (cron) to keep content
 *     private until its publish time.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import rawBlogs from "@/data/blogs.json";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Optional scheduling / status fields that may exist on any blog entry. */
export interface BlogTimeFields {
  /** Highest-priority: full ISO datetime string with offset. */
  publishAt?: string;
  /** YYYY-MM-DD date component (pair with publishTime). */
  publishDate?: string;
  /** HH:MM time component, default "00:00" (IST). */
  publishTime?: string;
  /** UTC or offset ISO string from creation (e.g. "2026-09-22T18:00:00Z"). */
  created_at?: string;
  /** Human-readable date-only, e.g. "29 Sep, 2026". */
  publishedDate?: string;
  /** "draft" | "scheduled" | "published" — absence means published. */
  status?: "draft" | "scheduled" | "published";
}

/** Full blog entry = raw JSON shape merged with explicit scheduling fields. */
export type BlogEntry = (typeof rawBlogs)[number] & BlogTimeFields;

// ─── Internal enriched record (parsed once at module load) ────────────────────

interface EnrichedBlog {
  blog: BlogEntry;
  /** Resolved publish timestamp in ms. Infinity means no date → always live. */
  publishMs: number;
}

// ─── Date parsers ─────────────────────────────────────────────────────────────

const IST_OFFSET = "+05:30";

/**
 * Parse a string into a UTC millisecond timestamp.
 * Returns NaN if the string cannot be recognised.
 */
function parseToMs(raw: string): number {
  const trimmed = raw.trim();

  // Full ISO with offset: "2026-10-05T09:30:00+05:30" or "…Z"
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) {
    return Date.parse(trimmed);
  }

  // Date-only YYYY-MM-DD → 00:00 IST
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return Date.parse(`${trimmed}T00:00:00${IST_OFFSET}`);
  }

  // Human date "29 Sep, 2026" or "15 January 2026"
  const humanMatch = trimmed.match(
    /^(\d{1,2})\s+([A-Za-z]+)[,\s]+(\d{4})$/
  );
  if (humanMatch) {
    const [, day, month, year] = humanMatch;
    const iso = `${year}-${monthIndex(month)}-${day!.padStart(2, "0")}`;
    return Date.parse(`${iso}T00:00:00${IST_OFFSET}`);
  }

  return NaN;
}

/** Convert a month name to a zero-padded 2-digit month number string. */
function monthIndex(month: string): string {
  const idx = new Date(`${month} 1 2000`).getMonth() + 1;
  return String(idx).padStart(2, "0");
}

/** Build publishDate+publishTime into a ms timestamp (IST). */
function parseDateTimePair(date: string, time: string): number {
  return Date.parse(`${date}T${time}:00${IST_OFFSET}`);
}

// ─── Core resolver ────────────────────────────────────────────────────────────

/**
 * Resolve the canonical publish timestamp for a blog.
 * Priority: publishAt > publishDate+publishTime > created_at > publishedDate
 * Returns Infinity when no date is found (treat as already live).
 */
function resolvePublishMs(blog: BlogEntry): number {
  // 1. publishAt
  if (blog.publishAt) {
    const ms = parseToMs(blog.publishAt);
    if (!isNaN(ms)) return ms;
  }

  // 2. publishDate + publishTime
  if (blog.publishDate) {
    const time = blog.publishTime ?? "00:00";
    const ms = parseDateTimePair(blog.publishDate, time);
    if (!isNaN(ms)) return ms;
  }

  // 3. created_at (UTC "Z" or offset ISO)
  if (blog.created_at) {
    const ms = parseToMs(blog.created_at);
    if (!isNaN(ms)) return ms;
  }

  // 4. publishedDate (human string)
  if (blog.publishedDate) {
    const ms = parseToMs(blog.publishedDate);
    if (!isNaN(ms)) return ms;
  }

  // 5. No date → always live
  return Infinity;
}

// ─── Module-load parse (runs once) ───────────────────────────────────────────

const enriched: EnrichedBlog[] = (rawBlogs as BlogEntry[]).map((blog) => ({
  blog,
  publishMs: resolvePublishMs(blog),
}));

// ─── Visibility predicate ─────────────────────────────────────────────────────

function isLive(e: EnrichedBlog, now: number): boolean {
  // Draft is always hidden
  if (e.blog.status === "draft") return false;
  // No usable date → always live
  if (e.publishMs === Infinity) return true;
  return now >= e.publishMs;
}

// ─── Sort comparator (newest first, id tiebreaker) ───────────────────────────

function compareEnriched(a: EnrichedBlog, b: EnrichedBlog): number {
  // Infinity items (no date) go last
  const aMs = a.publishMs === Infinity ? 0 : a.publishMs;
  const bMs = b.publishMs === Infinity ? 0 : b.publishMs;
  if (bMs !== aMs) return bMs - aMs;
  return b.blog.id - a.blog.id;
}

const sortedEnriched = [...enriched].sort(compareEnriched);

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * All blogs (including draft / future), sorted newest-first.
 * Use in admin views or static-export builds where client filters visibility.
 */
export function getAllBlogs(): BlogEntry[] {
  return sortedEnriched.map((e) => e.blog);
}

/**
 * Blogs visible at `now` (defaults to current time), sorted newest-first.
 * Safe for server-rendered routes with `revalidate`.
 */
export function getVisibleBlogs(now: Date = new Date()): BlogEntry[] {
  const nowMs = now.getTime();
  return sortedEnriched.filter((e) => isLive(e, nowMs)).map((e) => e.blog);
}

/**
 * True if `blog` is publicly visible right now.
 * Safe to use as an Array.filter callback: `blogs.filter(isVisibleNow)`.
 */
export function isVisibleNow(blog: BlogEntry): boolean {
  return isVisibleAt(blog, new Date());
}

/**
 * True if `blog` is publicly visible at an explicit `now` timestamp.
 * Use this when you need to pass a specific date (e.g. in tests or SSR).
 */
export function isVisibleAt(blog: BlogEntry, now: Date): boolean {
  const e = enriched.find((x) => x.blog.id === blog.id);
  if (!e) return false;
  return isLive(e, now.getTime());
}

/**
 * Returns the blog with the given slug if it is visible at `now`,
 * or `null` if it is a draft, in the future, or does not exist.
 */
export function getBlogBySlug(
  slug: string,
  now: Date = new Date()
): BlogEntry | null {
  const e = enriched.find((x) => x.blog.slug === slug);
  if (!e) return null;
  return isLive(e, now.getTime()) ? e.blog : null;
}

/**
 * Milliseconds until `blog` goes live. Returns:
 *   - 0  if already live (or no date)
 *   - positive number if still in the future
 */
export function msUntilLive(blog: BlogEntry, now: Date = new Date()): number {
  const e = enriched.find((x) => x.blog.id === blog.id);
  if (!e || e.publishMs === Infinity) return 0;
  return Math.max(0, e.publishMs - now.getTime());
}

/**
 * The earliest future publish timestamp in ms from `now`.
 * Returns `null` if there are no upcoming blogs.
 * Used internally by `useLiveBlogs`.
 */
export function nextPublishMs(now: Date = new Date()): number | null {
  const nowMs = now.getTime();
  let earliest: number | null = null;
  for (const e of enriched) {
    if (e.blog.status === "draft") continue;
    if (e.publishMs === Infinity) continue;
    if (e.publishMs > nowMs) {
      if (earliest === null || e.publishMs < earliest) {
        earliest = e.publishMs;
      }
    }
  }
  return earliest;
}
