import { useCallback, useEffect, useRef, useState } from "react";

interface Options {
  /** number of discrete segments progress (0..1) is divided into */
  segments: number;
  /** ms for one full automatic 0..1 cycle */
  cycleMs?: number;
  /** ms of inactivity after a pin before auto-play resumes (0 = never auto-resume) */
  holdMs?: number;
  /** pause the whole driver (e.g. section not in view yet) */
  active?: boolean;
  /**
   * How far into a segment `pin` lands, as a fraction of one segment (0..1).
   * 0.45 (default) settles mid-segment — right for consumers with a discrete
   * "hold" plateau (e.g. the pipeline's floor(progress*N) stepping). A small
   * value like 0.08 lands right on the segment instead — right for a
   * continuous focus curve (e.g. the datacube's rolling lift), where landing
   * mid-segment would blend two neighbours evenly instead of focusing one.
   */
  settleOffset?: number;
}

/**
 * Drives a 0..1 progress value that auto-advances over time, and can be
 * "pinned" to a given segment (on hover/click) — landing mid-segment so
 * consumers relying on scroll-style easing (e.g. a hold plateau) settle
 * cleanly rather than mid-transition. Resumes auto-play after `holdMs`.
 */
export function useAutoProgress({
  segments,
  cycleMs = 15000,
  holdMs = 6000,
  active = true,
  settleOffset = 0.45,
}: Options) {
  const [progress, setProgress] = useState(0);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const rafRef = useRef<number>();
  const lastRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    lastRef.current = 0;
    const tick = (ts: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (!lastRef.current) lastRef.current = ts;
      const dt = ts - lastRef.current;
      lastRef.current = ts;
      if (pausedRef.current) return;
      setProgress((p) => (p + dt / cycleMs) % 1);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cycleMs, active]);

  const pin = useCallback(
    (index: number) => {
      pausedRef.current = true;
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      const seg = 1 / segments;
      setProgress(Math.min(0.999, index * seg + seg * settleOffset));
      if (holdMs > 0) {
        resumeTimerRef.current = setTimeout(() => {
          pausedRef.current = false;
        }, holdMs);
      }
    },
    [segments, holdMs, settleOffset]
  );

  useEffect(() => () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }, []);

  return { progress, pin };
}
