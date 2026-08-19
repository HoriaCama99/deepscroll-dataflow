import { useEffect, useRef } from "react";

const CELL = 8;
const TRIGGER_R = 110;

// two-tone sage: the dense, connected core reads as the deep tone, the
// sparse, separated edge fades toward the light tone — one hue, one story
const SAGE_HUE = 150;
const SAGE_SAT = 24;
const SAGE_L_DENSE = 27;
const SAGE_L_SPARSE = 64;

function hash(x: number, y: number): number {
  const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

const PixelSphere = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const boostRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const parent = canvas.parentElement;
      const w = Math.max(1, Math.floor(parent?.clientWidth ?? window.innerWidth));
      const h = Math.max(1, Math.floor(parent?.clientHeight ?? window.innerHeight));
      canvas.width = w;
      canvas.height = h;
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    window.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    let raf: number;
    let t0 = 0;

    const frame = (ts: number) => {
      if (!prefersReducedMotion) raf = requestAnimationFrame(frame);
      if (!t0) t0 = ts;
      const t = (ts - t0) / 1000;

      const W = canvas.width;
      const H = canvas.height;
      if (W <= 0 || H <= 0) return;

      ctx.clearRect(0, 0, W, H);

      const cx = W * 0.5;
      const cy = H * 0.42;
      const R = Math.min(W, H) * 0.36;

      // light direction slowly sweeps around the top-right quadrant
      const baseAngle = -0.78; // ~ -45deg, pointing up-right
      const angle = baseAngle + Math.sin(t * 0.09) * 0.55;
      const lx = Math.cos(angle);
      const ly = Math.sin(angle);
      const lz = 0.55;

      const cols = Math.ceil((R * 2) / CELL);
      const rows = cols;
      const mouse = mouseRef.current;
      const boosts = boostRef.current;
      const seenKeys = new Set<string>();

      // Hover only "counts" once the cursor is actually over the sphere's own
      // circle — otherwise hovering page text far below/beside it (which still
      // falls inside the old, much larger trigger radius) reads as pixels
      // exploding out of nowhere instead of the sphere reacting to touch.
      const mouseDx = mouse.x - cx;
      const mouseDy = mouse.y - cy;
      const mouseInSphere = mouseDx * mouseDx + mouseDy * mouseDy <= R * R;

      for (let ry = 0; ry <= rows; ry++) {
        for (let rx = 0; rx <= cols; rx++) {
          const px = cx - R + rx * CELL;
          const py = cy - R + ry * CELL;
          const nx = (px - cx) / R;
          const ny = (py - cy) / R;
          const d2 = nx * nx + ny * ny;
          if (d2 > 1) continue;
          const nz = Math.sqrt(Math.max(0, 1 - d2));

          const dot = nx * lx + ny * ly + nz * lz;
          let intensity = Math.max(0, dot);
          intensity = Math.pow(intensity, 1.7); // shading spans most of the sphere, dither-style

          const jitter = hash(rx, ry);
          const cellKey = `${rx},${ry}`;

          // gentle ambient shimmer so the field feels alive even without hover
          const shimmer = 0.82 + 0.18 * Math.sin(t * 1.6 + jitter * 20);

          const dx = px - mouse.x;
          const dy = py - mouse.y;
          const distToMouse = Math.sqrt(dx * dx + dy * dy);

          let boost = boosts.get(cellKey) ?? 0;
          if (mouseInSphere && distToMouse < TRIGGER_R) {
            const proximity = 1 - distToMouse / TRIGGER_R;
            const target = proximity * (0.6 + hash(rx + 91, ry + 17) * 1.1);
            boost += (target - boost) * 0.25;
          } else {
            boost *= 0.85;
          }
          if (boost > 0.01) {
            boosts.set(cellKey, boost);
            seenKeys.add(cellKey);
          } else {
            boosts.delete(cellKey);
          }

          const effective = Math.min(1.4, intensity + boost * 0.9);
          if (effective < 0.05) continue;

          // dither: only draw when intensity clears this cell's fixed threshold,
          // once cleared, size still scales with (partly boosted) intensity
          const threshold = 0.1 + jitter * 0.55;
          if (intensity < threshold && boost < 0.05) continue;

          const level = Math.min(1, effective);
          const MERGE_AT = 0.55;
          // Every drawn pixel is the same size — true pixel-art, not variable
          // blobs. "Connected core" vs "separated edge" now comes purely from
          // DENSITY: near the light, almost every cell clears the threshold
          // and same-size tiles sit edge-to-edge; near the fade, most cells
          // don't qualify at all, so the few that do read as isolated dots.
          const size = CELL - 1;

          // low ceiling + a steep curve so most of the field stays faint —
          // a translucent shade, not a solid mass fighting the headline
          const alpha = Math.min(0.4, 0.02 + Math.pow(level, 1.6) * 0.38) * shimmer + boost * 0.35;
          const lightness = SAGE_L_SPARSE - (SAGE_L_SPARSE - SAGE_L_DENSE) * level;

          ctx.fillStyle = `hsla(${SAGE_HUE}, ${SAGE_SAT}%, ${lightness}%, ${Math.min(0.85, alpha)})`;
          const half = size / 2;
          if (level >= MERGE_AT || hash(rx + 53, ry + 13) < 0.6) {
            ctx.fillRect(px - half, py - half, size, size);
          } else {
            ctx.beginPath();
            ctx.arc(px, py, half, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // decay any boosted cells that fell outside the grid pass this frame
      for (const key of boosts.keys()) {
        if (!seenKeys.has(key)) boosts.delete(key);
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block absolute inset-0 w-full h-full"
      aria-hidden
    />
  );
};

export default PixelSphere;
