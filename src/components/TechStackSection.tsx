import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import PixelCard from "./PixelCard";
import { PythonIcon, GdalIcon } from "./TechIcons";
import { asset } from "@/lib/utils";

const TECH = [
  { name: "Apache Spark", desc: "Distributed processing engine for large-scale data", logo: asset("tech-logos/spark.png") },
  { name: "Dask", desc: "Parallel computing with task scheduling", logo: asset("tech-logos/dask.png") },
  { name: "Python", desc: "Core language for scientific computing", Icon: PythonIcon, color: "text-sage" },
  { name: "Xarray", desc: "N-dimensional labeled arrays and datasets", logo: asset("tech-logos/xarray.png") },
  { name: "GDAL/OGR", desc: "Geospatial data abstraction library", Icon: GdalIcon, color: "text-data-green" },
  { name: "PostgreSQL", desc: "Spatial database with PostGIS extension", logo: asset("tech-logos/postgresql.png") },
];

const TechStackSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { margin: "-100px" });

  return (
    <section ref={sectionRef} className="relative py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: "spring", bounce: 0, duration: 0.6 }}
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
              transition={{ type: "spring", bounce: 0, duration: 0.4, delay: i * 0.1 }}
            >
              <PixelCard variant="pink" className="rounded-lg border border-border bg-card/30 min-h-[140px] cursor-default">
                <div className="absolute inset-0 p-6 flex flex-col">
                  <div className="h-8 mb-3 flex items-center">
                    {tech.logo ? (
                      <img src={tech.logo} alt="" className="h-full w-auto object-contain" />
                    ) : (
                      <tech.Icon className={`w-7 h-7 ${tech.color}`} />
                    )}
                  </div>
                  <h3 className="font-heading font-semibold text-foreground text-lg mb-2">
                    {tech.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                    {tech.desc}
                  </p>
                </div>
              </PixelCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechStackSection;
