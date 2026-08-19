"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const SAGE = "rgb(168, 181, 162)";
const TERRACOTTA = "rgb(217, 142, 115)";
const SAGE_STRONG = "rgb(130, 155, 118)";
const TERRACOTTA_STRONG = "rgb(200, 110, 85)";
const OLIVE = "rgb(165, 140, 95)";
const CREAM = "rgb(253, 252, 240)";

function multiColorGradient(colors: string[], transparentAt = 0.7): string {
  const innerEnd = transparentAt * 0.85;
  const stops = colors
    .map((c, i) => `${c} ${(i / Math.max(1, colors.length - 1)) * innerEnd * 100}%`)
    .join(", ");
  return `radial-gradient(circle, ${stops}, transparent ${transparentAt * 100}%)`;
}

const PERIMETER_FLARES: Array<{
  left: string;
  top: string;
  colors: string[];
}> = [
  { left: "0%", top: "0%", colors: [SAGE_STRONG, OLIVE, TERRACOTTA] },
  { left: "33%", top: "0%", colors: [OLIVE, TERRACOTTA_STRONG, SAGE] },
  { left: "66%", top: "0%", colors: [TERRACOTTA, SAGE_STRONG, OLIVE] },
  { left: "100%", top: "0%", colors: [TERRACOTTA_STRONG, SAGE, CREAM] },
  { left: "100%", top: "33%", colors: [SAGE, TERRACOTTA, OLIVE] },
  { left: "100%", top: "66%", colors: [OLIVE, SAGE_STRONG, TERRACOTTA_STRONG] },
  { left: "100%", top: "100%", colors: [TERRACOTTA, OLIVE, SAGE_STRONG] },
  { left: "66%", top: "100%", colors: [SAGE_STRONG, TERRACOTTA, OLIVE] },
  { left: "33%", top: "100%", colors: [OLIVE, SAGE, TERRACOTTA_STRONG] },
  { left: "0%", top: "100%", colors: [TERRACOTTA_STRONG, OLIVE, SAGE] },
  { left: "0%", top: "66%", colors: [SAGE, OLIVE, TERRACOTTA] },
  { left: "0%", top: "33%", colors: [OLIVE, TERRACOTTA_STRONG, SAGE_STRONG] },
];

interface NoiseBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  gradientColors?: string[];
  noiseIntensity?: number;
  speed?: number;
  backdropBlur?: boolean;
  animating?: boolean;
  scrollProgress?: number;
}

const FLARE_SIZE = "min(200vw, 120rem)";
const SCROLL_LERP = 0.018;
const NOISE_SVG_COARSE =
  "data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.15' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export function NoiseBackground({
  children,
  className,
  containerClassName,
  gradientColors,
  noiseIntensity = 0.38,
  speed = 0.1,
  backdropBlur = false,
  animating = true,
  scrollProgress = 0.5,
}: NoiseBackgroundProps) {
  const duration = Math.max(1, 25 / speed);
  const flares = PERIMETER_FLARES;

  const smoothProgressRef = React.useRef(scrollProgress);
  const [smoothedProgress, setSmoothedProgress] = React.useState(scrollProgress);
  const [idlePhase, setIdlePhase] = React.useState(0);

  React.useEffect(() => {
    let rafId: number;
    let t0 = 0;
    const tick = (t: number) => {
      rafId = requestAnimationFrame(tick);
      const dt = t0 ? (t - t0) * 0.001 : 0;
      t0 = t;
      const target = scrollProgress;
      const current = smoothProgressRef.current;
      smoothProgressRef.current = current + (target - current) * SCROLL_LERP;
      setSmoothedProgress(smoothProgressRef.current);
      setIdlePhase((p) => p + dt * 0.22);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [scrollProgress]);

  const scrollOffsetY = (smoothedProgress - 0.5) * 18;
  const IDLE_R = 2.5;
  const idleX = (i: number) => IDLE_R * Math.sin(idlePhase + i * 0.6);
  const idleY = (i: number) => IDLE_R * Math.cos(idlePhase + i * 0.4 + 1);

  const vignetteMask =
    "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 0%, transparent 28%, rgba(255,255,255,0.2) 45%, rgba(255,255,255,0.55) 62%, rgba(255,255,255,0.88) 78%, white 92%)";

  return (
    <div
      className={cn("relative w-full min-h-full", containerClassName)}
      style={{ isolation: "isolate" }}
    >
      <div
        className={cn(
          "absolute inset-0 overflow-hidden pointer-events-none",
          backdropBlur && "backdrop-blur-sm"
        )}
        style={{
          zIndex: -1,
          maskImage: vignetteMask,
          WebkitMaskImage: vignetteMask,
          maskSize: "100% 100%",
          maskPosition: "center",
          maskRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-[rgb(253,252,240)]" />
        {flares.map((flare, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl"
            style={{
              width: FLARE_SIZE,
              height: FLARE_SIZE,
              left: flare.left,
              top: flare.top,
              transform: `translate(calc(-50% + ${scrollOffsetY * 0.4 + idleX(i)}%), calc(-50% + ${scrollOffsetY + idleY(i)}%))`,
              background: multiColorGradient(flare.colors),
              opacity: 0.78,
            }}
            animate={
              animating
                ? {
                    opacity: [0.68, 0.9, 0.68],
                    scale: [1, 1.08, 1],
                  }
                : undefined
            }
            transition={{
              duration: duration + (i % 3) * 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: noiseIntensity,
            backgroundImage: `url("${NOISE_SVG_COARSE}")`,
            backgroundSize: "64px 64px",
          }}
        />
      </div>
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
}
