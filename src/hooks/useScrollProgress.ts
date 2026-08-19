import { useCallback, useEffect, useState } from "react";

/** 0..1 progress of the current page's scroll position through the full document height */
export function useScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);

  const update = useCallback(() => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const totalScroll = Math.max(1, docHeight - vh);
    setScrollProgress(Math.max(0, Math.min(1, scrollY / totalScroll)));
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  return scrollProgress;
}
