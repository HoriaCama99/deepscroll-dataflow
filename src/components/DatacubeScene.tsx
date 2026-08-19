import { useEffect, useRef, useState } from "react";
import { useMotionValue, useSpring, useMotionValueEvent } from "framer-motion";
import { asset } from "@/lib/utils";

export const LAYERS = [
  { color: "#6b9080", accent: "#4a7060", label: "NDVI",         sub: "Vegetation Index",  image: asset("datacube/reflectance.gif") },
  { color: "#8a8a86", accent: "#5f5f5c", label: "SAR",           sub: "Radar Backscatter", image: asset("datacube/sar.gif") },
  { color: "#b06a4a", accent: "#8a4e34", label: "False-Colour",  sub: "NIR · Red · Green", image: asset("datacube/falsecolor_composite.png") },
  { color: "#c68353", accent: "#9c6640", label: "LST",           sub: "Thermal Heatmap",   image: asset("datacube/lst.gif") },
];

const N        = LAYERS.length;
const HW       = 130;
const HD       = 130;
const SLAB     = 26;   // rest spacing between layer slots
const SLAB_H   = 22;   // slab thickness
const LIFT_MAX = 30;   // how far the focused slab rises above its rest slot
const C30      = Math.cos(Math.PI / 6);
const S30      = Math.sin(Math.PI / 6);

// ── Isometric projection ─────────────────────────────────────────────────────
function iso(x: number, y: number, z: number): [number, number] {
  return [(x - z) * C30, (x + z) * S30 - y];
}

interface Faces {
  top:   [number, number][];
  right: [number, number][];
  left:  [number, number][];
}

function slabFaces(yWorld: number): Faces {
  const yb = yWorld, yt = yWorld + SLAB_H;
  return {
    top:   [iso(-HW, yt, -HD), iso(+HW, yt, -HD), iso(+HW, yt, +HD), iso(-HW, yt, +HD)],
    right: [iso(+HW, yt, -HD), iso(+HW, yt, +HD), iso(+HW, yb, +HD), iso(+HW, yb, -HD)],
    left:  [iso(-HW, yt, +HD), iso(+HW, yt, +HD), iso(+HW, yb, +HD), iso(-HW, yb, +HD)],
  };
}

// Bounding box sized for the worst case (any slab fully lifted) so the cube
// never re-centers as focus moves — it just settles within a fixed frame.
function computeOrigin(W: number, H: number): { cx: number; cy: number } {
  const all: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const f = slabFaces(i * SLAB + LIFT_MAX);
    all.push(...f.top, ...f.right, ...f.left);
  }
  const f0 = slabFaces(0);
  all.push(...f0.top, ...f0.right, ...f0.left);

  const minX = Math.min(...all.map((p) => p[0]));
  const maxX = Math.max(...all.map((p) => p[0]));
  const minY = Math.min(...all.map((p) => p[1]));
  const maxY = Math.max(...all.map((p) => p[1]));

  return { cx: W / 2 - (minX + maxX) / 2, cy: H / 2 - (minY + maxY) / 2 };
}

function smoothstep(t: number) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

// ── Types ────────────────────────────────────────────────────────────────────
interface DatacubeCanvasProps {
  /** 0..1 — which layer is focused, continuously (rolls smoothly between slots) */
  scrollProgress: number;
  hoveredLayer:   number | null;
  onHoverLayer:   (i: number | null) => void;
  interactive?:   boolean;
}

interface SlabEls {
  group:    SVGGElement;
  left:     SVGPolygonElement;
  right:    SVGPolygonElement;
  top:      SVGPolygonElement;
  img:      SVGPolygonElement;
  clipPoly: SVGPolygonElement;
  pattern:  SVGPatternElement;
  edge:     SVGPolylineElement;
}

interface Built {
  cx: number;
  cy: number;
  slabs: SlabEls[];
  label: SVGTextElement;
  fadeGroup: SVGGElement;
  fadeMaskRect: SVGRectElement;
}

// ── Component ────────────────────────────────────────────────────────────────
const DatacubeCanvas = ({ scrollProgress, onHoverLayer, interactive = true }: DatacubeCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);
  const builtRef     = useRef<Built | null>(null);
  const prevDimsRef  = useRef({ w: 0, h: 0 });
  const lastBestIRef = useRef(-1);
  const [dims, setDims] = useState({ w: 400, h: 400 });

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setDims({ w, h });
      if (builtRef.current) {
        builtRef.current.fadeMaskRect.setAttribute("width", String(w));
        builtRef.current.fadeMaskRect.setAttribute("height", String(h));
      }
    });
    obs.observe(el);
    setDims({ w: el.clientWidth, h: el.clientHeight });
    return () => obs.disconnect();
  }, []);

  // Build SVG (every layer gets its own textured, independently-liftable slab)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || dims.w < 10) return;
    const prev = prevDimsRef.current;
    if (builtRef.current && prev.w === dims.w && prev.h === dims.h) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    prevDimsRef.current = { w: dims.w, h: dims.h };

    const NS = "http://www.w3.org/2000/svg";
    const { cx, cy } = computeOrigin(dims.w, dims.h);

    const defs = document.createElementNS(NS, "defs");

    // Bottom fade gradient
    const fadeGrad = document.createElementNS(NS, "linearGradient");
    fadeGrad.setAttribute("id", "dc-fade-grad");
    fadeGrad.setAttribute("x1", "0"); fadeGrad.setAttribute("y1", "0");
    fadeGrad.setAttribute("x2", "0"); fadeGrad.setAttribute("y2", "1");
    fadeGrad.setAttribute("gradientUnits", "objectBoundingBox");
    const fadeStops: [string, string][] = [
      ["0%",   "1"],
      ["55%",  "1"],
      ["75%",  "0.8"],
      ["88%",  "0.35"],
      ["100%", "0"],
    ];
    fadeStops.forEach(([offset, opacity]) => {
      const s = document.createElementNS(NS, "stop");
      s.setAttribute("offset",       offset);
      s.setAttribute("stop-color",   "#fff");
      s.setAttribute("stop-opacity", opacity);
      fadeGrad.appendChild(s);
    });

    const fadeMask = document.createElementNS(NS, "mask");
    fadeMask.setAttribute("id",              "dc-fade-mask");
    fadeMask.setAttribute("maskUnits",        "userSpaceOnUse");
    fadeMask.setAttribute("maskContentUnits", "userSpaceOnUse");
    const fadeMaskRect = document.createElementNS(NS, "rect");
    fadeMaskRect.setAttribute("x",      "0");
    fadeMaskRect.setAttribute("y",      "0");
    fadeMaskRect.setAttribute("width",  String(dims.w));
    fadeMaskRect.setAttribute("height", String(dims.h));
    fadeMaskRect.setAttribute("fill",   "url(#dc-fade-grad)");
    fadeMask.appendChild(fadeMaskRect);

    defs.append(fadeGrad, fadeMask);

    const slabs: SlabEls[] = [];
    for (let i = 0; i < N; i++) {
      const layer = LAYERS[i];

      const clip = document.createElementNS(NS, "clipPath");
      clip.setAttribute("id", `dc-clip-${i}`);
      const clipPoly = document.createElementNS(NS, "polygon");
      clip.appendChild(clipPoly);

      const pattern = document.createElementNS(NS, "pattern");
      pattern.setAttribute("id",           `dc-pat-${i}`);
      pattern.setAttribute("patternUnits", "userSpaceOnUse");
      pattern.setAttribute("width",        "1");
      pattern.setAttribute("height",       "1");
      const img = document.createElementNS(NS, "image");
      img.setAttribute("href",                layer.image);
      img.setAttribute("width",               "1");
      img.setAttribute("height",              "1");
      img.setAttribute("preserveAspectRatio", "xMidYMid slice");
      pattern.appendChild(img);

      defs.append(clip, pattern);

      const group = document.createElementNS(NS, "g");
      const left  = document.createElementNS(NS, "polygon");
      left.setAttribute("fill", layer.accent);
      const right = document.createElementNS(NS, "polygon");
      right.setAttribute("fill", layer.accent);
      const top   = document.createElementNS(NS, "polygon");
      top.setAttribute("fill", layer.color);
      const imgPoly = document.createElementNS(NS, "polygon");
      imgPoly.setAttribute("fill",      `url(#dc-pat-${i})`);
      imgPoly.setAttribute("clip-path", `url(#dc-clip-${i})`);
      const edge = document.createElementNS(NS, "polyline");
      edge.setAttribute("fill",         "none");
      edge.setAttribute("stroke",       "rgba(255,255,255,0.5)");
      edge.setAttribute("stroke-width", "1.2");

      group.append(left, right, top, imgPoly, edge);
      slabs.push({ group, left, right, top, img: imgPoly, clipPoly, pattern, edge });
    }

    const fadeGroup = document.createElementNS(NS, "g");
    fadeGroup.setAttribute("mask", "url(#dc-fade-mask)");
    slabs.forEach((s) => fadeGroup.appendChild(s.group));

    const label = document.createElementNS(NS, "text");
    label.setAttribute("text-anchor",       "middle");
    label.setAttribute("dominant-baseline", "central");
    label.setAttribute("font-size",         "13");
    label.setAttribute("font-family",       "monospace");
    label.setAttribute("font-weight",       "600");
    label.setAttribute("fill",              "rgba(255,255,255,0.92)");
    label.style.pointerEvents = "none";
    fadeGroup.appendChild(label);

    svg.append(defs, fadeGroup);

    builtRef.current = { cx, cy, slabs, label, fadeGroup, fadeMaskRect };
    lastBestIRef.current = -1;
  }, [dims]);

  // Hover → onHoverLayer, wired per-slab once built
  useEffect(() => {
    if (!interactive) return;
    const built = builtRef.current;
    if (!built) return;
    const cleanups: Array<() => void> = [];
    built.slabs.forEach((s, i) => {
      const enter = () => onHoverLayer(i);
      const leave = () => onHoverLayer(null);
      s.group.style.cursor = "pointer";
      s.group.addEventListener("mouseenter", enter);
      s.group.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        s.group.removeEventListener("mouseenter", enter);
        s.group.removeEventListener("mouseleave", leave);
      });
    });
    return () => cleanups.forEach((c) => c());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims, interactive, onHoverLayer]);

  // Snap to the NEAREST layer index rather than tracking scrollProgress
  // continuously — the spring then animates a short, bounded transition
  // between two discrete layers instead of a state that's continuously
  // re-blended with however far exactly the page happens to be scrolled
  // (which is what produced the "messy, multi-layer" look).
  const progressMV = useMotionValue(scrollProgress);
  useEffect(() => {
    const snapped = Math.round(Math.max(0, Math.min(N - 1, scrollProgress * N)));
    progressMV.set(snapped / N);
  }, [scrollProgress, progressMV]);
  const springProgress = useSpring(progressMV, { stiffness: 220, damping: 26, mass: 0.7 });

  const renderAt = (p: number) => {
    const built = builtRef.current;
    if (!built) return;
    const { cx, cy, slabs, label, fadeGroup } = built;
    const sv  = ([x, y]: [number, number]): [number, number] => [x + cx, y + cy];
    const pts = (arr: [number, number][]) => arr.map((q) => sv(q).join(",")).join(" ");

    const focus = Math.max(0, Math.min(N - 1, p * N));

    let bestI = 0, bestT = -1;
    slabs.forEach((s, i) => {
      const d = Math.abs(i - focus);
      const t = smoothstep(1 - Math.min(1, d / 0.85));
      const lift = LIFT_MAX * t;
      const opacity = 0.42 + 0.58 * t;
      const f = slabFaces(i * SLAB + lift);

      s.left.setAttribute("points",  pts(f.left));
      s.right.setAttribute("points", pts(f.right));
      s.top.setAttribute("points",   pts(f.top));
      s.img.setAttribute("points",   pts(f.top));
      s.clipPoly.setAttribute("points", pts(f.top));
      s.edge.setAttribute("points",
        [...f.top, f.top[0]].map((q) => sv(q).join(",")).join(" ")
      );

      s.left.setAttribute("opacity",  String(opacity * 0.9));
      s.right.setAttribute("opacity", String(opacity * 0.9));
      s.top.setAttribute("opacity",   String(opacity * 0.9));
      s.img.setAttribute("opacity",   String(opacity));
      s.edge.setAttribute("opacity",  String(0.15 + 0.5 * t));

      const [tlx, tly]  = sv(f.top[0]);
      const [trx, try_] = sv(f.top[1]);
      const [blx, bly]  = sv(f.top[3]);
      s.pattern.setAttribute(
        "patternTransform",
        `matrix(${trx - tlx} ${try_ - tly} ${blx - tlx} ${bly - tly} ${tlx} ${tly})`
      );

      if (t > bestT) { bestT = t; bestI = i; }
    });

    // Repaint order: lowest-lift first, focused (highest-lift) slab last — on top.
    // Only reorder the DOM when the focused slab actually changes, not every tick.
    if (bestI !== lastBestIRef.current) {
      lastBestIRef.current = bestI;
      slabs
        .map((s, i) => ({ s, d: Math.abs(i - focus) }))
        .sort((a, b) => b.d - a.d)
        .forEach(({ s }) => fadeGroup.appendChild(s.group));
      fadeGroup.appendChild(label);
    }

    const layer = LAYERS[bestI];
    const f = slabFaces(bestI * SLAB + LIFT_MAX * bestT);
    const ctr = f.top.reduce(
      (acc, q) => [acc[0] + q[0] / 4, acc[1] + q[1] / 4] as [number, number],
      [0, 0] as [number, number]
    );
    const [lx, ly] = sv(ctr);
    label.setAttribute("x", String(lx));
    label.setAttribute("y", String(ly));
    label.textContent = layer.label;
    label.setAttribute("opacity", String(0.5 + 0.5 * bestT));
  };

  useMotionValueEvent(springProgress, "change", (v) => renderAt(v));
  useEffect(() => {
    renderAt(springProgress.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <svg
        ref={svgRef}
        width={dims.w}
        height={dims.h}
        style={{ display: "block" }}
      />
    </div>
  );
};

export default DatacubeCanvas;
