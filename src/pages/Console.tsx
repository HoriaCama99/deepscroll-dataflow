import PixelSphere from "@/components/PixelSphere";
import AsciiOverlay from "@/components/AsciiOverlay";
import ArchitectureScroll from "@/components/ArchitectureScroll";
import TechStackSection from "@/components/TechStackSection";
import ClientSection from "@/components/ClientSection";
import ContactSection from "@/components/ContactSection";
import FooterSection from "@/components/FooterSection";
import SectionNav from "@/components/SectionNav";
import VariantSwitcher from "@/components/VariantSwitcher";
import { useScrollProgress } from "@/hooks/useScrollProgress";

const TELEMETRY = [
  { label: "SPARK", dot: "bg-data-green", meta: "partitions 128" },
  { label: "DASK", dot: "bg-data-amber", meta: "workers 24" },
  { label: "XARRAY", dot: "bg-primary", meta: "chunks 4096" },
];

const Console = () => {
  const scrollProgress = useScrollProgress();

  return (
    <div className="min-h-screen bg-background font-mono">
      <SectionNav />
      <VariantSwitcher />

      <div className="relative" style={{ zIndex: 1 }}>
        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <PixelSphere />
          </div>
          <div className="absolute inset-0 z-[1] hud-grid pointer-events-none" />
          <div className="absolute inset-0 z-[1] hud-scanlines pointer-events-none opacity-50" />
          <AsciiOverlay />

          <div
            className="absolute inset-x-0 bottom-0 z-[1] pointer-events-none"
            style={{
              height: "55vh",
              background:
                "linear-gradient(to bottom, transparent 0%, transparent 25%, rgba(253, 252, 240, 0.25) 50%, rgba(253, 252, 240, 0.65) 75%, #FDFCF0 92%, #FDFCF0 100%)",
            }}
            aria-hidden
          />

          <div className="absolute top-0 inset-x-0 z-[2] flex items-center justify-between px-6 md:px-12 h-11 border-b border-border/60 text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
            <span>EO-DataSci // Terminal</span>
            <span className="hidden sm:inline">47.3769&deg; N&nbsp;&nbsp;8.5417&deg; E</span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-data-green animate-pulse" /> Sys Nominal
            </span>
          </div>

          <div className="relative z-[3] max-w-3xl mx-auto px-6 text-center">
            <div className="relative py-10 px-4 md:px-16">
              <span className="hud-corner tl" />
              <span className="hud-corner tr" />
              <span className="hud-corner bl" />
              <span className="hud-corner br" />

              <p className="text-xs tracking-[0.3em] uppercase text-sage mb-4 font-mono">
                // Earth Observation &middot; Big Data Science
                <span className="inline-block w-[6px] h-[12px] bg-sage ml-1 align-[-2px] animate-hud-blink" />
              </p>
              <h1 className="text-5xl md:text-7xl font-heading font-bold leading-[1.02] tracking-tight mb-6">
                Spatial Forecasting
                <br />
                <span className="text-primary inline-flex items-center gap-3">
                  <span className="text-3xl md:text-4xl font-normal opacity-50">&lang;</span>
                  at Scale
                  <span className="text-3xl md:text-4xl font-normal opacity-50">&rang;</span>
                </span>
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto mb-10 font-mono text-sm leading-relaxed">
                Senior EO Data Scientist &mdash; parallel processing pipelines, multidimensional
                datacube analytics, and geospatial intelligence for ESA / Copernicus programmes.
              </p>

              <div className="flex items-center justify-center gap-3 flex-wrap">
                {TELEMETRY.map((t) => (
                  <div key={t.label} className="relative border border-border bg-card/60 backdrop-blur-sm px-4 py-2.5 text-left min-w-[130px]">
                    <span className="absolute -top-px -left-px w-2 h-2 border-t-2 border-l-2 border-sage/70" />
                    <span className="absolute -bottom-px -right-px w-2 h-2 border-b-2 border-r-2 border-sage/70" />
                    <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider mb-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${t.dot} animate-pulse`} />
                      {t.label}
                    </div>
                    <div className="text-[9px] text-muted-foreground tracking-wide">{t.meta}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[3] text-center reduced-motion-hide">
            <div className="text-[10px] font-mono tracking-[0.24em] text-muted-foreground mb-2">
              Scroll // Sector 01
            </div>
            <div className="relative w-px h-12 mx-auto bg-gradient-to-b from-sage to-transparent overflow-hidden">
              <span className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-sage animate-hud-drop" />
            </div>
          </div>
        </section>

        {/* ── ARCHITECTURE (datacube + ETL pipeline, scroll-pinned) ────────── */}
        <div id="datacube">
          <ArchitectureScroll />
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

export default Console;
