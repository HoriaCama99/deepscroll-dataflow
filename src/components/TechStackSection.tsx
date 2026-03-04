import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

const TECH = [
  { name: "Apache Spark", abbr: "SPK", desc: "Distributed processing engine for large-scale data" },
  { name: "Dask", abbr: "DSK", desc: "Parallel computing with task scheduling" },
  { name: "Python", abbr: "PY", desc: "Core language for scientific computing" },
  { name: "Xarray", abbr: "XR", desc: "N-dimensional labeled arrays and datasets" },
  { name: "GDAL/OGR", abbr: "GDL", desc: "Geospatial data abstraction library" },
  { name: "PostgreSQL", abbr: "PG", desc: "Spatial database with PostGIS extension" },
];

const TechStackSection = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { margin: "-100px" });

  return (
    <section ref={sectionRef} className="relative py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2 font-mono">
            Infrastructure
          </p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold">
            Tech <span className="text-primary">Stack</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {TECH.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`relative p-6 rounded-lg border transition-all duration-500 cursor-default ${
                hoveredIdx === i
                  ? "border-primary bg-primary/5 border-glow"
                  : "border-border bg-card/30"
              }`}
            >
              {hoveredIdx === i && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                  {[...Array(4)].map((_, j) => (
                    <motion.div
                      key={j}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: [0, 0.4, 0] }}
                      transition={{ duration: 1.2, delay: j * 0.15, repeat: Infinity }}
                      className="absolute h-px bg-primary"
                      style={{
                        top: `${20 + j * 20}%`,
                        left: j % 2 === 0 ? 0 : "auto",
                        right: j % 2 === 1 ? 0 : "auto",
                        width: "100%",
                        transformOrigin: j % 2 === 0 ? "left" : "right",
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="font-mono text-xs text-muted-foreground mb-3">
                [{tech.abbr}]
              </div>
              <h3 className="font-heading font-semibold text-foreground text-lg mb-2">
                {tech.name}
              </h3>
              <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                {tech.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechStackSection;
