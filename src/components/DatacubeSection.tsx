import { useState, Suspense, useRef, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import DatacubeCanvas, { LAYERS } from "./DatacubeScene";
import EoPipelinePanel from "./EoPipelinePanel";

// ─── Scroll phases (total = 700vh) ──────────────────────────────────────────
//  0   – 140vh : Pipeline fullscreen, steps reveal
//  140 – 175vh : Slide from full-width → right column (numeric pixels, smooth)
//  175 – 210vh : Collapse height → 48px tab
//  210 – 700vh : Datacube + layer tabs active
const TOTAL_VH     = 700;
const PIPE_END     = 140 / TOTAL_VH;
const SLIDE_END    = 175 / TOTAL_VH;
const COLLAPSE_END = 210 / TOTAL_VH;
const LAYERS_END   = 0.97;

const GAP   = 48;  // gap-12 = 3rem = 48px
const TAB_H = 48;

const DatacubeSection = () => {
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);
  const [activeLayer, setActiveLayer]   = useState(0);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [isDone, setIsDone]             = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef    = useRef<HTMLDivElement>(null);
  const headerRef    = useRef<HTMLDivElement>(null);

  // Measured layout values — all numeric pixels so Framer can interpolate them
  const [layout, setLayout] = useState({
    containerW: 1200, // sticky inner width
    headerBottom: 188, // px from sticky top to bottom of header block
    colH: 450,         // column content height
  });

  // ── Measure on mount + resize ────────────────────────────────────────────
  useEffect(() => {
    const measure = () => {
      const sticky = stickyRef.current;
      const header = headerRef.current;
      if (!sticky || !header) return;
      const w = sticky.clientWidth;
      const hh = header.offsetHeight;
      const headerBottom = 32 + hh + 16; // top-8 (32px) + height + 16px gap
      // available height for columns = viewport - headerBottom - 16px bottom pad
      const colH = Math.min(500, window.innerHeight - headerBottom - 32);
      setLayout({ containerW: w, headerBottom, colH });
    };
    measure();
    const obs = new ResizeObserver(measure);
    if (stickyRef.current) obs.observe(stickyRef.current);
    if (headerRef.current) obs.observe(headerRef.current);
    return () => obs.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // ── Pipeline steps ───────────────────────────────────────────────────────
  const pipelineMotion = useTransform(scrollYProgress, [0, PIPE_END], [0, 1]);
  useMotionValueEvent(pipelineMotion, "change", (v) => {
    setPipelineProgress(Math.max(0, Math.min(1, v)));
  });

  // ── Done flag ────────────────────────────────────────────────────────────
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setIsDone(v >= COLLAPSE_END);
  });

  // ── Layer cycling (normalized 0-1 for Datacube animation) ────────────────
  const cyclingMotion = useTransform(
    scrollYProgress,
    [COLLAPSE_END + 0.06, LAYERS_END],
    [0, 1]
  );
  const [cyclingProgress, setCyclingProgress] = useState(0);
  useMotionValueEvent(cyclingMotion, "change", (v) => {
    setCyclingProgress(Math.max(0, Math.min(1, v)));
  });

  // ── Active Layer Index (for right-side tabs) ─────────────────────────────
  const layerMotion = useTransform(
    scrollYProgress,
    [COLLAPSE_END + 0.06, LAYERS_END],
    [0, LAYERS.length - 1]
  );
  useMotionValueEvent(layerMotion, "change", (v) => {
    setActiveLayer(Math.round(Math.max(0, Math.min(LAYERS.length - 1, v))));
  });

  // ── Section title fade ───────────────────────────────────────────────────
  const textOpacity = useTransform(scrollYProgress, [0, 0.05], [0, 1]);
  const textY       = useTransform(scrollYProgress, [0, 0.05], [32, 0]);

  // Scroll hijack removed — native scroll is preserved (Apple §3: never lock out input)

  // ── ALL panel geometry as numeric motion values ──────────────────────────
  // Derived from layout so they update when the container is measured.
  const { containerW, headerBottom, colH } = layout;

  // Right column: starts at containerW/2 + GAP/2, width = containerW/2 - GAP/2
  const rightColLeft  = containerW / 2 + GAP / 2;
  const rightColWidth = containerW / 2 - GAP / 2;

  // Full-screen panel fills the entire container width
  const fullWidth  = containerW;
  const fullHeight = window.innerHeight - headerBottom - 16;

  // panel LEFT: 0 → rightColLeft  (during slide phase)
  const panelLeft = useTransform(
    scrollYProgress,
    [PIPE_END, SLIDE_END],
    [0, rightColLeft]
  );

  // panel WIDTH: fullWidth → rightColWidth  (during slide phase)
  const panelWidth = useTransform(
    scrollYProgress,
    [PIPE_END, SLIDE_END],
    [fullWidth, rightColWidth]
  );

  // panel HEIGHT: fullHeight → colH → TAB_H
  const panelHeight = useTransform(
    scrollYProgress,
    [0,          SLIDE_END, COLLAPSE_END],
    [fullHeight, colH,      TAB_H]
  );

  // pipeline content opacity: fades out during collapse
  const contentOpacity = useTransform(
    scrollYProgress,
    [SLIDE_END, COLLAPSE_END],
    [1, 0]
  );

  // arrow rotation: 180° (open) → 0° (closed)
  const arrowRotate = useTransform(
    scrollYProgress,
    [SLIDE_END, COLLAPSE_END],
    [180, 0]
  );

  return (
    <div
      ref={containerRef}
      style={{ height: `${TOTAL_VH}vh` }}
      className="relative"
    >
      <div
        ref={stickyRef}
        className="sticky top-0 overflow-hidden container mx-auto px-6"
        style={{ height: "100vh" }}
      >
        {/* ── Section header ───────────────────────────────────────────────── */}
        <motion.div
          ref={headerRef}
          className="absolute left-6 right-6"
          style={{ top: 32, opacity: textOpacity, y: textY, zIndex: 30 }}
        >
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

        {/* ── Left: Datacube — fades in after collapse ─────────────────────── */}
        <motion.div
          className="absolute rounded-lg border border-border bg-card/50 overflow-hidden border-glow"
          style={{
            top: headerBottom,
            left: 0,
            width: rightColLeft - GAP / 2,  // = containerW/2 - GAP/2
            height: colH,
            zIndex: 10,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isDone ? 1 : 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        >
          <Suspense
            fallback={
              <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-sm">
                Loading 3D scene...
              </div>
            }
          >
            <DatacubeCanvas
              scrollProgress={cyclingProgress}
              hoveredLayer={hoveredLayer ?? activeLayer}
              onHoverLayer={setHoveredLayer}
              interactive={isDone}
            />
          </Suspense>
        </motion.div>

        {/* ── Right: layer tabs — appear after collapse ────────────────────── */}
        <div
          className="absolute flex flex-col gap-3"
          style={{
            top: headerBottom + TAB_H + 8,
            left: rightColLeft,
            width: rightColWidth,
            maxHeight: colH - TAB_H - 8,
            overflowY: "auto",
            zIndex: 10,
          }}
        >
          <AnimatePresence>
            {isDone &&
              LAYERS.map((layer, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", bounce: 0, duration: 0.35, delay: i * 0.07 }}
                  onMouseEnter={() => setHoveredLayer(i)}
                  onMouseLeave={() => setHoveredLayer(null)}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 cursor-pointer font-mono text-sm shrink-0 ${
                    (hoveredLayer ?? activeLayer) === i
                      ? "border-primary bg-primary/5 border-glow"
                      : "border-border bg-card/30 hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: layer.color }} />
                  <span className="text-foreground font-medium">{layer.label}</span>
                  <span className="text-muted-foreground text-xs ml-auto">
                    Layer {String(i + 1).padStart(2, "0")}
                  </span>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

        {/* ══ THE ONE PIPELINE PANEL — numeric geometry, fully interpolatable ═ */}
        <motion.div
          className="absolute rounded-lg border overflow-hidden font-mono"
          style={{
            top: headerBottom,
            left: panelLeft,
            width: panelWidth,
            height: panelHeight,
            borderColor: "rgba(168,181,162,0.5)",
            background: "rgba(253,252,240,0.92)",
            backdropFilter: "blur(2px)",
            zIndex: 20,
          }}
        >
          {/* Tab header row */}
          <div
            className="flex items-center gap-3 px-4 border-b shrink-0"
            style={{
              height: TAB_H,
              minHeight: TAB_H,
              borderColor: "rgba(168,181,162,0.3)",
              background: "rgba(253,252,240,0.7)",
            }}
          >
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: "#A8B5A2" }} />
            <span className="font-medium tracking-wide text-sm" style={{ color: "#A8B5A2" }}>
              System Architecture
            </span>
            <span className="text-muted-foreground text-xs ml-auto font-mono">Layer 00</span>
            <motion.span
              className="text-xs ml-2 inline-block"
              style={{ color: "#A8B5A2", rotate: arrowRotate }}
            >
              ▲
            </motion.span>
          </div>

          {/* Pipeline content */}
          <motion.div
            className="px-2 pb-2"
            style={{
              height: `calc(100% - ${TAB_H}px)`,
              overflow: "hidden",
              opacity: contentOpacity,
            }}
          >
            <EoPipelinePanel progress={pipelineProgress} />
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
};

export default DatacubeSection;
