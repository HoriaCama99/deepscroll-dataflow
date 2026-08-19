import { useState, useEffect, useRef, useCallback } from "react";
import { NoiseBackground } from "@/components/ui/noise-background";

const MID_PALETTE = [
  "rgb(168, 181, 162)",
  "rgb(217, 142, 115)",
  "rgb(253, 252, 240)",
];

interface PortfolioMidSectionWrapperProps {
  children: React.ReactNode;
}

export function PortfolioMidSectionWrapper({ children }: PortfolioMidSectionWrapperProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0.5);

  const updateProgress = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const totalHeight = rect.height;
    if (totalHeight <= 0) return;
    const visibleTop = -rect.top;
    const visibleBottom = vh - rect.top;
    const progress = visibleTop / totalHeight;
    setScrollProgress(Math.max(0, Math.min(1, progress)));
  }, []);

  useEffect(() => {
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    const obs = new ResizeObserver(updateProgress);
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      obs.disconnect();
    };
  }, [updateProgress]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen"
      aria-label="Mid section: Datacube, Projects, Clients"
    >
      <NoiseBackground
        gradientColors={MID_PALETTE}
        noiseIntensity={0.35}
        speed={0.06}
        backdropBlur={false}
        animating={true}
        scrollProgress={scrollProgress}
        containerClassName="w-full min-h-full"
        className="pointer-events-auto"
      >
        <div className="relative z-10 mx-auto max-w-7xl w-full">
          {children}
        </div>
      </NoiseBackground>
    </section>
  );
}
