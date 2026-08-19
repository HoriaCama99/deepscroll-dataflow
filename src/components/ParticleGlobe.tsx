import { useRef, useEffect } from "react";

const COUNT = 25000;
const TRIGGER_R = 90;
const PIXEL_CHARS = ["*", "+"] as const;
const SPIN_SPEED = 0.19;
const TILT = 0.2;
const SPRING_K = 0.055;
const DAMPING = 0.7;
const MASK_W = 1024;
const MASK_H = 512;

const MASK_DATA_URL =
  "data:image/png;base64,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";

interface Particle {
  nx: number;
  ny: number;
  nz: number;
  dr: number;
  vr: number;
  maxReach: number;
  char: "*" | "+";
}

function loadMask(): Promise<ImageData["data"] | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const mc = document.createElement("canvas");
      mc.width = MASK_W;
      mc.height = MASK_H;
      const mx = mc.getContext("2d");
      if (!mx) return resolve(null);
      mx.drawImage(img, 0, 0, MASK_W, MASK_H);
      const data = mx.getImageData(0, 0, MASK_W, MASK_H).data;
      resolve(data);
    };
    img.onerror = () => resolve(null);
    img.src = MASK_DATA_URL;
  });
}

function uvToMaskIdx(px: number, py: number): number {
  const x = Math.max(0, Math.min(MASK_W - 1, px | 0));
  const y = Math.max(0, Math.min(MASK_H - 1, py | 0));
  return (y * MASK_W + x) * 4;
}

function isLandAt(maskData: Uint8ClampedArray, px: number, py: number): boolean {
  return maskData[uvToMaskIdx(px, py)] > 128;
}

function isLand(nx: number, ny: number, nz: number, maskData: Uint8ClampedArray): boolean {
  const lat = Math.asin(Math.max(-1, Math.min(1, ny)));
  const lon = Math.atan2(nz, nx);
  const u = ((lon / Math.PI + 1) / 2) * (MASK_W - 1);
  const v = (1 - (lat / (Math.PI / 2) + 1) / 2) * (MASK_H - 1);
  const px = Math.round(u) | 0;
  const py = Math.round(v) | 0;
  return isLandAt(maskData, px, py);
}

function isOnContour(nx: number, ny: number, nz: number, maskData: Uint8ClampedArray): boolean {
  if (!isLand(nx, ny, nz, maskData)) return false;
  const lat = Math.asin(Math.max(-1, Math.min(1, ny)));
  const lon = Math.atan2(nz, nx);
  const u = ((lon / Math.PI + 1) / 2) * (MASK_W - 1);
  const v = (1 - (lat / (Math.PI / 2) + 1) / 2) * (MASK_H - 1);
  const px = Math.round(u) | 0;
  const py = Math.round(v) | 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (!isLandAt(maskData, px + dx, py + dy)) return true;
    }
  }
  return false;
}

function fibSphere(n: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  const g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const t = g * i;
    out.push([Math.cos(t) * r, y, Math.sin(t) * r]);
  }
  return out;
}

function rotY(x: number, y: number, z: number, a: number): [number, number, number] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c + z * s, y, -x * s + z * c];
}
function rotX(x: number, y: number, z: number, a: number): [number, number, number] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c];
}
function project(x: number, y: number, z: number, W: number, H: number): [number, number, number] {
  const s = 900 / (900 + z);
  return [W / 2 + x * s, H / 2 + y * s, z];
}

const SAGE_RGB = { r: 92, g: 138, b: 115 };
const TERRACOTTA_RGB = { r: 186, g: 117, b: 94 };

export default function ParticleGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const maskDataRef = useRef<ImageData["data"] | null>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const lastRef = useRef(0);
  const autoAngleRef = useRef(0);

  const buildParticles = (maskData: Uint8ClampedArray | null) => {
    const pts = fibSphere(COUNT);
    if (!maskData) {
      const band = pts.filter(([, ny]) => Math.abs(ny) < 0.12);
      particlesRef.current = band.map(([nx, ny, nz], i) => ({
        nx,
        ny,
        nz,
        dr: 0,
        vr: 0,
        maxReach: 0.08 + Math.pow(Math.random(), 1.8) * 0.72,
        char: PIXEL_CHARS[i % 2],
      }));
      return;
    }
    const contour = pts.filter(([nx, ny, nz]) => isOnContour(nx, ny, nz, maskData));
    const source = contour.length > 0 ? contour : pts.filter(([nx, ny, nz]) => isLand(nx, ny, nz, maskData));
    particlesRef.current = source.map(([nx, ny, nz], i) => ({
      nx,
      ny,
      nz,
      dr: 0,
      vr: 0,
      maxReach: 0.08 + Math.pow(Math.random(), 1.8) * 0.72,
      char: PIXEL_CHARS[i % 2],
    }));
  };

  useEffect(() => {
    loadMask().then((data) => {
      maskDataRef.current = data;
      buildParticles(data);
      const canvas = canvasRef.current;
      if (!canvas?.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const W = Math.max(1, Math.floor(rect.width) || window.innerWidth);
      const H = Math.max(1, Math.floor(rect.height) || window.innerHeight);
      canvas.width = W;
      canvas.height = H;
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      const W = Math.max(1, Math.floor(parent?.clientWidth ?? window.innerWidth));
      const H = Math.max(1, Math.floor(parent?.clientHeight ?? window.innerHeight));
      canvas.width = W;
      canvas.height = H;
      buildParticles(maskDataRef.current);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      mouseRef.current.x = (e.clientX - rect.left) * scaleX;
      mouseRef.current.y = (e.clientY - rect.top) * scaleY;
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf: number;
    const frame = (ts: number) => {
      if (!prefersReducedMotion) raf = requestAnimationFrame(frame);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      if (W <= 0 || H <= 0) return;

      ctx.fillStyle = "#FDFCF0";
      ctx.fillRect(0, 0, W, H);

      const particles = particlesRef.current;
      if (particles.length === 0) return;

      const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
      lastRef.current = ts;
      autoAngleRef.current += SPIN_SPEED * dt;
      const R = Math.min(W, H) * 0.3;
      const mouse = mouseRef.current;

      const bg = ctx.createRadialGradient(W / 2, H / 2, R * 0.05, W / 2, H / 2, R * 1.7);
      bg.addColorStop(0, "rgba(92,138,115,0.06)");
      bg.addColorStop(0.55, "rgba(186,117,94,0.04)");
      bg.addColorStop(1, "transparent");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const drawList: { sx: number; sy: number; sz: number; depth: number; lift: number; dr: number; char: "*" | "+" }[] = [];
      const bob = Math.sin(ts * 0.00035) * Math.min(18, R * 0.05);

      for (const p of particles) {
        let [hx, hy, hz] = rotY(p.nx * R, p.ny * R, p.nz * R, autoAngleRef.current);
        [hx, hy, hz] = rotX(hx, hy, hz, TILT);
        hy += bob;
        const [hsx, hsy] = project(hx, hy, hz, W, H);
        const mdx = hsx - mouse.x;
        const mdy = hsy - mouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        const maxDr = R * p.maxReach;

        if (mdist < TRIGGER_R) {
          const proximity = 1 - mdist / TRIGGER_R;
          const diff = maxDr * proximity - p.dr;
          p.vr += diff * 0.18;
          p.vr *= 0.78;
        } else {
          p.vr += -p.dr * SPRING_K * 4.5;
          p.vr *= DAMPING;
        }
        p.dr += p.vr * dt * 60;
        if (p.dr < 0) {
          p.dr = 0;
          p.vr = 0;
        }
        if (p.dr > maxDr) {
          p.dr = maxDr;
          p.vr *= -0.1;
        }

        const wx = hx + (hx / R) * p.dr;
        const wy = hy + (hy / R) * p.dr;
        const wz = hz + (hz / R) * p.dr;
        const [sx, sy, sz] = project(wx, wy, wz, W, H);
        const lift = p.dr / (maxDr || 1);
        const depth = Math.max(0, Math.min(1, (sz + R) / (2 * R)));
        drawList.push({ sx, sy, sz, depth, lift, dr: p.dr, char: p.char });
      }

      drawList.sort((a, b) => a.sz - b.sz);

      ctx.font = '7px "Courier New", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const d of drawList) {
        const { sx, sy, depth, lift, dr, char } = d;
        const cr = Math.round(SAGE_RGB.r + (TERRACOTTA_RGB.r - SAGE_RGB.r) * depth + lift * 40);
        const cg = Math.round(SAGE_RGB.g + (TERRACOTTA_RGB.g - SAGE_RGB.g) * depth - lift * 20);
        const cb = Math.round(SAGE_RGB.b + (TERRACOTTA_RGB.b - SAGE_RGB.b) * depth - lift * 10);
        const alpha = dr > 0.5 ? Math.min(1, 0.5 + depth * 0.3 + lift * 0.45) : 0.2 + depth * 0.6;
        if (dr > 1) {
          ctx.save();
          ctx.shadowColor = `rgba(${cr},${cg},${cb},0.8)`;
          ctx.shadowBlur = 2 + lift * 6;
        }
        ctx.fillStyle = `rgba(${Math.min(255, Math.max(0, cr))},${Math.min(255, Math.max(0, cg))},${Math.min(255, Math.max(0, cb))},${alpha})`;
        ctx.fillText(char, sx, sy);
        if (dr > 1) ctx.restore();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block absolute inset-0 w-full h-full"
      style={{ background: "#FDFCF0", width: "100%", height: "100%" }}
      width={800}
      height={600}
      aria-hidden
    />
  );
}
