import { useState, Suspense, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import DatacubeCanvas, { LAYERS } from "./DatacubeScene";

const DatacubeSection = () => {
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);
  const [activeLayer, setActiveLayer] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sticky scroll: the container is tall enough for pinning
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Map scroll progress within this section to layer index
  const layerProgress = useTransform(scrollYProgress, [0.1, 0.9], [0, LAYERS.length - 1]);

  useMotionValueEvent(layerProgress, "change", (v) => {
    setActiveLayer(Math.round(Math.max(0, Math.min(LAYERS.length - 1, v))));
  });

  // Derive a local scroll progress for the datacube assembly
  const assemblyProgress = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const [localProgress, setLocalProgress] = useState(0);
  useMotionValueEvent(assemblyProgress, "change", (v) => {
    setLocalProgress(Math.max(0, Math.min(1, v)));
  });

  return (
    <div
      ref={containerRef}
      style={{ height: `${(LAYERS.length + 2) * 100}vh` }}
      className="relative"
    >
      <div className="sticky top-0 h-screen flex items-center">
        <div className="container mx-auto px-6">
          <motion.div className="mb-8">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2 font-mono">
              Section A
            </p>
            <h2 className="text-4xl md:text-5xl font-heading font-bold">
              The <span className="text-primary">Datacube</span>
            </h2>
            <p className="text-muted-foreground font-mono text-sm mt-4 max-w-xl">
              Multidimensional Earth Observation data stacks. Each layer represents
              a distinct spectral band or derived product processed through
              distributed computing pipelines.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* 3D Datacube */}
            <div className="h-[450px] rounded-lg border border-border bg-card/50 overflow-hidden border-glow">
              <Suspense
                fallback={
                  <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-sm">
                    Loading 3D scene...
                  </div>
                }
              >
                <DatacubeCanvas
                  scrollProgress={localProgress}
                  hoveredLayer={hoveredLayer ?? activeLayer}
                  onHoverLayer={setHoveredLayer}
                />
              </Suspense>
            </div>

            {/* Layer Legend */}
            <div className="space-y-3">
              {LAYERS.map((layer, i) => (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredLayer(i)}
                  onMouseLeave={() => setHoveredLayer(null)}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 cursor-pointer font-mono text-sm ${
                    (hoveredLayer ?? activeLayer) === i
                      ? "border-primary bg-primary/5 border-glow"
                      : "border-border bg-card/30 hover:border-muted-foreground/30"
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: layer.color }}
                  />
                  <span className="text-foreground font-medium">{layer.label}</span>
                  <span className="text-muted-foreground text-xs ml-auto">
                    Layer {String(i).padStart(2, "0")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatacubeSection;
