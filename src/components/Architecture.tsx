import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import DatacubeCanvas, { LAYERS } from "./DatacubeScene";
import EoPipelinePanel from "./EoPipelinePanel";
import { useAutoProgress } from "@/hooks/useAutoProgress";

const PIPELINE_STEPS = 7;

interface ArchitectureProps {
  variant: "console" | "cube";
}

const Architecture = ({ variant }: ArchitectureProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { margin: "-10% 0px -10% 0px" });

  const cube = useAutoProgress({ segments: LAYERS.length, cycleMs: 15000, holdMs: 6000, active: isInView, settleOffset: 0.08 });
  const pipeline = useAutoProgress({ segments: PIPELINE_STEPS, cycleMs: 12000, holdMs: 5000, active: isInView });

  // Round (not floor) to match DatacubeCanvas's own nearest-layer snapping.
  const activeLayer = Math.max(0, Math.min(LAYERS.length - 1, Math.round(cube.progress * LAYERS.length)));

  const isConsole = variant === "console";

  return (
    <section
      ref={sectionRef}
      id="architecture"
      className={`relative py-24 md:py-32 ${isConsole ? "font-mono" : ""}`}
    >
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: "spring", bounce: 0, duration: 0.6 }}
          className="mb-14 flex items-end justify-between flex-wrap gap-4"
        >
          <div>
            <p
              className={`text-xs tracking-[0.3em] uppercase mb-2 font-mono ${
                isConsole ? "text-sage flex items-center gap-2" : "text-muted-foreground"
              }`}
            >
              {isConsole ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-data-green animate-pulse" />
                  Architecture &mdash; ETL Pipeline
                </>
              ) : (
                "02 — Architecture"
              )}
            </p>
            <h2 className="text-4xl md:text-5xl font-heading font-bold">
              {isConsole ? (
                <>
                  System <span className="text-primary">Architecture</span>
                </>
              ) : (
                <>
                  From capture to <span className="text-primary">Zarr store</span>
                </>
              )}
            </h2>
          </div>
          {isConsole && (
            <div className="flex items-center gap-2 border border-border px-3 py-1.5 text-[10px] tracking-[0.14em] text-muted-foreground font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-data-green animate-pulse" />
              STREAMING
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
          {/* Pipeline diagram */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: "spring", bounce: 0, duration: 0.5, delay: 0.1 }}
            className={
              isConsole
                ? "relative border border-border bg-card/40 p-5 min-h-[380px]"
                : "relative rounded-2xl border border-border bg-card/40 p-6 min-h-[380px] shadow-[0_20px_50px_-30px_rgba(0,0,0,0.25)]"
            }
          >
            {isConsole && (
              <>
                <span className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-sage/60" />
                <span className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-sage/60" />
                <span className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-sage/60" />
                <span className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-sage/60" />
              </>
            )}
            <EoPipelinePanel progress={pipeline.progress} onStepClick={(i) => pipeline.pin(i)} />
          </motion.div>

          {/* Datacube + layer tabs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: "spring", bounce: 0, duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            <div
              className={
                isConsole
                  ? "relative border border-border bg-card/40 h-[300px]"
                  : "relative rounded-2xl border border-border bg-card/40 h-[300px] shadow-[0_20px_50px_-30px_rgba(0,0,0,0.25)]"
              }
            >
              <DatacubeCanvas
                scrollProgress={cube.progress}
                hoveredLayer={activeLayer}
                onHoverLayer={() => {}}
                interactive
              />
            </div>

            <div className="flex flex-col gap-2">
              {LAYERS.map((layer, i) => (
                <button
                  key={layer.label}
                  onMouseEnter={() => cube.pin(i)}
                  onClick={() => cube.pin(i)}
                  className={`flex items-center gap-3 px-4 py-3 text-left border font-mono text-sm transition-all duration-200 ${
                    isConsole ? "" : "rounded-lg"
                  } ${
                    i === activeLayer
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card/30 hover:border-muted-foreground/30"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: layer.color }} />
                  <span className="text-foreground font-medium">{layer.label}</span>
                  <span className="text-muted-foreground text-xs">{layer.sub}</span>
                  <span className="text-muted-foreground text-[10px] ml-auto">
                    L{String(i + 1).padStart(2, "0")}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Architecture;
