import { useState, Suspense } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import DatacubeCanvas, { LAYERS } from "./DatacubeScene";

interface DatacubeSectionProps {
  scrollProgress: number;
}

const DatacubeSection = ({ scrollProgress }: DatacubeSectionProps) => {
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center py-20"
    >
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2 font-mono">
            Section A
          </p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold">
            The <span className="text-primary text-glow">Datacube</span>
          </h2>
          <p className="text-muted-foreground font-mono text-sm mt-4 max-w-xl">
            Multidimensional Earth Observation data stacks. Each layer represents
            a distinct spectral band or derived product processed through
            distributed computing pipelines.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* 3D Datacube */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-[450px] rounded-lg border border-border bg-card/50 overflow-hidden border-glow"
          >
            <Suspense
              fallback={
                <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-sm">
                  Loading 3D scene...
                </div>
              }
            >
              <DatacubeCanvas
                scrollProgress={scrollProgress}
                hoveredLayer={hoveredLayer}
                onHoverLayer={setHoveredLayer}
              />
            </Suspense>
          </motion.div>

          {/* Layer Legend */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-3"
          >
            {LAYERS.map((layer, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredLayer(i)}
                onMouseLeave={() => setHoveredLayer(null)}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 cursor-pointer font-mono text-sm ${
                  hoveredLayer === i
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
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DatacubeSection;
