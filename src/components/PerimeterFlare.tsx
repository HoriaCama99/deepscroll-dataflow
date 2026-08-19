import { useEffect, useRef } from "react";

const HUE_STOPS = [
  [168, 181, 162],
  [165, 140, 95],
  [217, 142, 115],
  [235, 215, 175],
  [168, 181, 162],
  [217, 142, 115],
  [168, 181, 162],
];

function orbColor(t: number): [number, number, number] {
  t = ((t % 1) + 1) % 1;
  const n = HUE_STOPS.length - 1;
  const p = t * n;
  const lo = Math.floor(p);
  const f = p - lo;
  const sf = f * f * (3 - 2 * f);
  const a = HUE_STOPS[lo];
  const b = HUE_STOPS[Math.min(lo + 1, n)];
  return [
    (a[0] + (b[0] - a[0]) * sf) | 0,
    (a[1] + (b[1] - a[1]) * sf) | 0,
    (a[2] + (b[2] - a[2]) * sf) | 0,
  ];
}

export default function PerimeterFlare() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const perimPosRef = useRef(0);
  const perimTargetRef = useRef(0);
  const prevScrollRef = useRef(typeof window !== "undefined" ? window.scrollY : 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
    resize();
    window.addEventListener("resize", resize);

    function perimToXY(t: number) {
      t = ((t % 1) + 1) % 1;
      const p = t * 4;
      const W = canvas.width;
      const H = canvas.height;
      if (p < 1) return { x: p * W, y: 0 };
      if (p < 2) return { x: W, y: (p - 1) * H };
      if (p < 3) return { x: (3 - p) * W, y: H };
      return { x: 0, y: (4 - p) * H };
    }

    function drawFlare(
      pos: { x: number; y: number },
      r: number,
      g: number,
      b: number,
      maxAlpha: number,
      radius: number
    ) {
      const W = canvas.width;
      const H = canvas.height;
      const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
      const steps = 16;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const alpha = t >= 0.7 ? 0 : maxAlpha * Math.pow(1 - t / 0.7, 2.4);
        grad.addColorStop(t, `rgba(${r},${g},${b},${alpha.toFixed(4)})`);
      }
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    let rafId: number;
    function loop() {
      rafId = requestAnimationFrame(loop);
      const W = canvas.width;
      const H = canvas.height;

      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - prevScrollRef.current;
      prevScrollRef.current = currentScrollY;

      if (scrollDelta !== 0) {
        perimTargetRef.current += scrollDelta * 0.000018;
      }
      perimTargetRef.current += 0.000055;

      let delta = perimTargetRef.current - perimPosRef.current;
      delta = delta - Math.round(delta);
      perimPosRef.current += delta * 0.022;

      perimPosRef.current = ((perimPosRef.current % 1) + 1) % 1;
      perimTargetRef.current = ((perimTargetRef.current % 1) + 1) % 1;

      ctx.clearRect(0, 0, W, H);
      const baseR = Math.min(W, H) * 0.9;
      const [r, g, b] = orbColor(perimPosRef.current);
      const mainPos = perimToXY(perimPosRef.current);
      drawFlare(mainPos, r, g, b, 0.42, baseR);
    }
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex: -1,
        maskImage: "linear-gradient(to bottom, transparent 0%, black 28%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 28%)",
        maskSize: "100% 100%",
        maskPosition: "top",
        maskRepeat: "no-repeat",
      }}
      aria-hidden
    />
  );
}
