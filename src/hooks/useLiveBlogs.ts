"use client";

/**
 * src/hooks/useLiveBlogs.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Client hook that returns the currently-visible blogs and automatically
 * reveals a newly-scheduled post the moment its publish time arrives —
 * no page refresh needed.
 *
 * Strategy:
 *   • Start with the blogs that are live right now.
 *   • Find the next upcoming publish timestamp.
 *   • Set a single setTimeout for that moment (capped at ~24.8 days so the
 *     JS engine doesn't overflow a 32-bit timer).
 *   • On trigger: recompute visible blogs and schedule the next timer.
 *   • Clean up on unmount.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from "react";
import { getVisibleBlogs, nextPublishMs } from "@/lib/blogs";
import type { BlogEntry } from "@/lib/blogs";

/** Max ms a JS setTimeout can reliably handle (~24.8 days). */
const MAX_TIMEOUT_MS = 2_147_000_000;

export function useLiveBlogs(): BlogEntry[] {
  const [blogs, setBlogs] = useState<BlogEntry[]>(() => getVisibleBlogs());

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | null = null;

    function scheduleNext(): void {
      const now = new Date();
      const nextMs = nextPublishMs(now);

      if (nextMs === null) return; // no future posts

      const delay = Math.min(nextMs - now.getTime(), MAX_TIMEOUT_MS);

      timerId = setTimeout(() => {
        // Reveal newly-live blogs
        setBlogs(getVisibleBlogs());
        // Schedule the one after that
        scheduleNext();
      }, delay);
    }

    scheduleNext();

    return () => {
      if (timerId !== null) clearTimeout(timerId);
    };
  }, []); // runs once on mount

  return blogs;
}
