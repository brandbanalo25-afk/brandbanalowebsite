/**
 * src/lib/blogUtils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Backwards-compatibility shim — re-exports everything from the new
 * src/lib/blogs.ts scheduling module so existing imports keep working.
 *
 * Prefer importing directly from "@/lib/blogs" in new code.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export type { BlogEntry, BlogTimeFields } from "@/lib/blogs";
export {
  getAllBlogs,
  getVisibleBlogs,
  isVisibleNow,
  isVisibleAt,
  getBlogBySlug,
  msUntilLive,
  nextPublishMs,
} from "@/lib/blogs";