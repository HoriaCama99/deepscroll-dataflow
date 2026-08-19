import { motion } from "framer-motion";
import Orb from "./Orb";

interface HeroSectionProps {
  scrollProgress: number;
}

const HeroSection = ({ scrollProgress }: HeroSectionProps) => {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Orb background */}
      <div className="absolute inset-0 z-0 shadow-none" style={{ boxShadow: 'none', filter: 'none' }}>
        <Orb
          hoverIntensity={0.41}
          rotateOnHover
          hue={48}
          forceHoverState={false}
          backgroundColor="#FDFCF0"
        />
      </div>
      {/* Bottom fade: Hero background merges smoothly into next section */}
      <div
        className="absolute inset-x-0 bottom-0 z-[1] pointer-events-none"
        style={{
          height: "55vh",
          background: "linear-gradient(to bottom, transparent 0%, transparent 25%, rgba(253, 252, 240, 0.25) 50%, rgba(253, 252, 240, 0.65) 75%, #FDFCF0 92%, #FDFCF0 100%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4 font-mono"
        >
          Earth Observation / Big Data Science
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.6, delay: 0.15 }}
          className="text-5xl md:text-7xl font-heading font-bold leading-tight mb-6"
        >
          Spatial Forecasting
          <br />
          <span className="text-primary">at Scale</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.5, delay: 0.3 }}
          className="text-muted-foreground max-w-2xl mx-auto mb-10 font-mono text-sm leading-relaxed"
        >
          Senior EO Data Scientist specializing in parallel processing pipelines,
          multidimensional datacube analytics, and geospatial intelligence
          for ESA / Copernicus programmes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", bounce: 0, duration: 0.5, delay: 0.5 }}
          className="flex items-center justify-center gap-8 text-xs text-muted-foreground font-mono tracking-wider"
        >
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-data-green animate-pulse-glow" />
            SPARK
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-data-amber animate-pulse-glow" />
            DASK
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            XARRAY
          </span>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4, delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground"
      >
        <span className="text-xs font-mono tracking-widest">SCROLL</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-px h-8 bg-gradient-to-b from-primary to-transparent reduced-motion-hide"
        />
      </motion.div>
    </section>
  );
};

export default HeroSection;
