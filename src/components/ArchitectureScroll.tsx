import { useEffect, useRef, useState } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";
import DatacubeCanvas, { LAYERS } from "./DatacubeScene";
import EoPipelinePanel from "./EoPipelinePanel";
import TopographicLines from "./TopographicLines";
import Architecture from "./Architecture";

const PIPELINE_STEPS = 7;
const SCROLL_VH = 220;
const PHASE_SPLIT = 0.55; // fraction of the pinned scroll given to the pipeline phase

/**
 * Pinned, scroll-jacked version of the architecture section (Console variant only).
 * The section sticks for SCROLL_VH of scroll: the first PHASE_SPLIT reveals the ETL
 * pipeline step by step, the remainder rolls the datacube through its layers.
 * Falls back to the plain hover/click Architecture (no pinning) under reduced motion.
 */
const ArchitectureScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setProgress(Math.max(0, Math.min(1, v)));
  });

  if (reducedMotion) {
    return <Architecture variant="console" />;
  }

  const inPipelinePhase = progress < PHASE_SPLIT;
  const pipelineLocal = Math.min(1, progress / PHASE_SPLIT);
  const cubeLocal = Math.max(0, Math.min(1, (progress - PHASE_SPLIT) / (1 - PHASE_SPLIT)));
  // Round (not floor) to match DatacubeCanvas's own nearest-layer snapping —
  // otherwise the tab highlight and the layer actually shown drift apart.
  const activeLayer = Math.max(0, Math.min(LAYERS.length - 1, Math.round(cubeLocal * LAYERS.length)));

  const scrollToOverall = (target: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const containerTop = window.scrollY + rect.top;
    const scrollable = el.offsetHeight - window.innerHeight;
    const targetY = containerTop + Math.max(0, Math.min(1, target)) * scrollable;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  // Crossfade window straddling the phase boundary
  const FADE = 0.035;

  const jumpToPipelineStep = (i: number) =>
    scrollToOverall(((i + 0.5) / PIPELINE_STEPS) * PHASE_SPLIT);
  // Land close to (not between) the target layer's own focus point so it comes
  // up fully lifted rather than blended 50/50 with its neighbour — but never
  // inside the crossfade window, or the pipeline ghosts through underneath.
  const jumpToLayer = (i: number) => {
    const raw = PHASE_SPLIT + ((i + 0.08) / LAYERS.length) * (1 - PHASE_SPLIT);
    const clearOfFade = PHASE_SPLIT + FADE + 0.02;
    scrollToOverall(Math.max(raw, clearOfFade));
  };
  const pipelineOpacity =
    progress < PHASE_SPLIT - FADE
      ? 1
      : progress > PHASE_SPLIT + FADE
      ? 0
      : 1 - (progress - (PHASE_SPLIT - FADE)) / (FADE * 2);
  const cubeOpacity = 1 - pipelineOpacity;

  return (
    <div ref={containerRef} style={{ height: `${SCROLL_VH}vh` }} className="relative">
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden px-6">
        <TopographicLines scrollProgress={progress} />

        <div className="relative z-[1] w-full max-w-4xl mx-auto">
          <div className="mb-6 md:mb-8 flex items-end justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-sage mb-2 font-mono flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-data-green animate-pulse" />
                {inPipelinePhase ? "Architecture — ETL Pipeline" : "Architecture — Datacube Layers"}
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold">
                System <span className="text-primary">Architecture</span>
              </h2>
            </div>
            <div className="flex items-center gap-1.5" aria-hidden>
              <span
                className={`h-1 rounded-full transition-all duration-300 ${
                  inPipelinePhase ? "w-8 bg-primary" : "w-4 bg-border"
                }`}
              />
              <span
                className={`h-1 rounded-full transition-all duration-300 ${
                  !inPipelinePhase ? "w-8 bg-primary" : "w-4 bg-border"
                }`}
              />
            </div>
          </div>

          <div className="relative h-[360px] sm:h-[400px] md:h-[440px]">
            <div
              className="absolute inset-0 border border-border bg-card/50 p-4 md:p-5"
              style={{ opacity: pipelineOpacity, pointerEvents: inPipelinePhase ? "auto" : "none" }}
            >
              <span className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-sage/60" />
              <span className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-sage/60" />
              <span className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-sage/60" />
              <span className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-sage/60" />
              <EoPipelinePanel progress={pipelineLocal} onStepClick={jumpToPipelineStep} />
            </div>

            <div
              className="absolute inset-0 flex flex-col md:flex-row gap-3 md:gap-4"
              style={{ opacity: cubeOpacity, pointerEvents: inPipelinePhase ? "none" : "auto" }}
            >
              <div className="flex-1 border border-border bg-card/50 min-h-[180px]">
                <DatacubeCanvas
                  scrollProgress={cubeLocal}
                  hoveredLayer={activeLayer}
                  onHoverLayer={() => {}}
                  interactive
                />
              </div>
              <div className="flex md:flex-col gap-2 md:w-56 overflow-x-auto md:overflow-x-visible overflow-y-auto shrink-0">
                {LAYERS.map((layer, i) => (
                  <button
                    key={layer.label}
                    onClick={() => jumpToLayer(i)}
                    className={`flex items-center gap-2.5 px-3 md:px-4 py-2.5 md:py-3 text-left border font-mono text-xs md:text-sm whitespace-nowrap transition-all duration-200 shrink-0 ${
                      i === activeLayer
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card/30 hover:border-muted-foreground/30"
                    }`}
                  >
                    <span
                      className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: layer.color }}
                    />
                    <span className="text-foreground font-medium">{layer.label}</span>
                    <span className="text-muted-foreground text-[10px] md:text-xs hidden lg:inline">
                      {layer.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            className="mt-5 md:mt-6 flex items-center justify-center gap-2 text-[10px] font-mono tracking-[0.2em] text-muted-foreground reduced-motion-hide transition-opacity duration-300"
            style={{ opacity: progress > 0.96 ? 0 : 1 }}
          >
            <span className="w-1 h-1 rounded-full bg-muted-foreground animate-pulse" />
            {progress < 0.02 ? "Scroll to begin" : "Keep scrolling"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureScroll;
