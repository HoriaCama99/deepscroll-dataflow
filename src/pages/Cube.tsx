import { motion } from "framer-motion";
import ParticleGlobe from "@/components/ParticleGlobe";
import TopographicLines from "@/components/TopographicLines";
import Architecture from "@/components/Architecture";
import TechStackSection from "@/components/TechStackSection";
import ClientSection from "@/components/ClientSection";
import ContactSection from "@/components/ContactSection";
import FooterSection from "@/components/FooterSection";
import SectionNav from "@/components/SectionNav";
import VariantSwitcher from "@/components/VariantSwitcher";
import { useScrollProgress } from "@/hooks/useScrollProgress";

const CREDS = ["ESA", "Copernicus", "EUMETSAT"];

const Cube = () => {
  const scrollProgress = useScrollProgress();

  return (
    <div className="min-h-screen bg-background">
      <SectionNav />
      <VariantSwitcher />

      <div className="relative" style={{ zIndex: 1 }}>
        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section id="hero" className="relative min-h-screen flex flex-col">
          <nav className="flex items-center justify-between px-6 md:px-14 pt-10">
            <div className="font-heading font-semibold text-sm tracking-wide">
              H.C<span className="text-primary">/</span>EO-Data
            </div>
            <div className="hidden sm:flex gap-8 text-[11px] tracking-[0.14em] uppercase text-muted-foreground font-mono">
              <a href="#datacube" className="hover:text-foreground transition-colors">Work</a>
              <a href="#tech" className="hover:text-foreground transition-colors">Stack</a>
              <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </nav>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center px-6 md:px-14 py-16">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.6 }}
            >
              <p className="text-[11.5px] tracking-[0.28em] uppercase text-primary mb-7 flex items-center gap-3 font-mono">
                <span className="w-7 h-px bg-primary" />
                Earth Observation &middot; Data Engineering
              </p>
              <h1 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.04] tracking-tight mb-7 [overflow-wrap:break-word]">
                Multidimensional
                <br />
                Earth data.
                <br />
                <span className="text-primary">At scale.</span>
              </h1>
              <p className="text-muted-foreground text-[15px] leading-relaxed max-w-md mb-10 font-mono">
                Senior EO Data Scientist building parallel processing pipelines and chunked-array
                datacubes &mdash; from raw Sentinel captures to analysis-ready Zarr stores &mdash; for ESA
                and Copernicus programmes.
              </p>
              <div className="flex gap-3 mb-10">
                {CREDS.map((c) => (
                  <div key={c} className="border border-border px-3.5 py-2 text-[10.5px] tracking-wide text-muted-foreground font-mono">
                    {c}
                  </div>
                ))}
              </div>
              <a
                href="#datacube"
                className="inline-flex items-center gap-2.5 text-[12.5px] font-semibold tracking-wide text-foreground border-b border-foreground pb-1 w-fit font-mono"
              >
                View the pipeline
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path d="M12 4v16M6 14l6 6 6-6" />
                </svg>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", bounce: 0, duration: 0.7, delay: 0.15 }}
              className="relative aspect-square max-h-[520px] mx-auto w-full"
            >
              <div className="absolute inset-6 rounded-full bg-primary/10 blur-2xl animate-cube-glow" />
              <div className="relative w-full h-full rounded-[2rem] border border-border overflow-hidden shadow-[0_30px_70px_-35px_rgba(0,0,0,0.35)]">
                <ParticleGlobe />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── ARCHITECTURE (datacube + ETL pipeline) ──────────────────────── */}
        <div className="relative">
          <TopographicLines scrollProgress={scrollProgress} />
          <div id="datacube" className="relative z-[1]">
            <Architecture variant="cube" />
          </div>
        </div>

        <div id="tech">
          <TechStackSection />
        </div>
        <div id="clients">
          <ClientSection />
        </div>
        <div id="contact">
          <ContactSection />
        </div>
        <FooterSection scrollProgress={scrollProgress} />
      </div>
    </div>
  );
};

export default Cube;
