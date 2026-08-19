import { useEffect, useRef, useCallback } from "react";

const CHARS = "01.:+*#@%&=~<>{}[]|/\\^";
const GRID_SIZE = 18;
const SCATTER_RADIUS = 80;

const AsciiOverlay = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<{ x: number; y: number; ox: number; oy: number; char: string }[]>([]);
  const rafRef = useRef<number>(0);

  const init = useCallback((canvas: HTMLCanvasElement) => {
    const cols = Math.ceil(canvas.width / GRID_SIZE);
    const rows = Math.ceil(canvas.height / GRID_SIZE);
    const particles: typeof particlesRef.current = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() > 0.35) continue;
        const x = c * GRID_SIZE + GRID_SIZE / 2;
        const y = r * GRID_SIZE + GRID_SIZE / 2;
        particles.push({
          x, y, ox: x, oy: y,
          char: CHARS[Math.floor(Math.random() * CHARS.length)],
        });
      }
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init(canvas);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${GRID_SIZE * 0.65}px 'JetBrains Mono', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const p of particlesRef.current) {
        const dx = p.ox - mx;
        const dy = p.oy - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < SCATTER_RADIUS) {
          const force = (1 - dist / SCATTER_RADIUS) * 30;
          const angle = Math.atan2(dy, dx);
          p.x += (p.ox + Math.cos(angle) * force - p.x) * 0.15;
          p.y += (p.oy + Math.sin(angle) * force - p.y) * 0.15;
        } else {
          p.x += (p.ox - p.x) * 0.08;
          p.y += (p.oy - p.y) * 0.08;
        }

        const alpha = dist < SCATTER_RADIUS ? 0.15 + (1 - dist / SCATTER_RADIUS) * 0.4 : 0.08;
        ctx.fillStyle = `hsla(150, 20%, 45%, ${alpha})`;
        ctx.fillText(p.char, p.x, p.y);
      }

      if (!prefersReducedMotion) rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
};

export default AsciiOverlay;
