import { useEffect, useRef } from "react";

interface FooterSectionProps {
  scrollProgress: number;
}

const FooterSection = ({ scrollProgress }: FooterSectionProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = 200;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener("pointermove", onMove);
    const onLeave = () => { mouseRef.current = { x: -1000, y: -1000 }; };
    canvas.addEventListener("pointerleave", onLeave);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const lineCount = 12;
      const spacing = canvas.height / (lineCount + 1);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = 0; i < lineCount; i++) {
        ctx.beginPath();
        const baseY = (i + 1) * spacing;
        const amplitude = 8 + Math.sin(scrollProgress * 3 + i * 0.5) * 6;
        const frequency = 0.004 + scrollProgress * 0.001;

        for (let x = 0; x < canvas.width; x += 2) {
          let y = baseY +
            Math.sin(x * frequency + scrollProgress * 4 + i * 0.8) * amplitude +
            Math.sin(x * frequency * 2.3 + i * 1.2) * (amplitude * 0.3);

          // Cursor magnetic pull
          const dx = x - mx;
          const dy = baseY - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const pullRadius = 120;
          if (dist < pullRadius) {
            const pull = (1 - dist / pullRadius) * 25;
            y += (my - baseY) > 0 ? pull : -pull;
          }

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        const alpha = 0.15 + i * 0.04;
        // Sage/dusty blue for lines
        const hue = 150 + i * 5;
        ctx.strokeStyle = `hsla(${hue}, 20%, 45%, ${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      if (!prefersReducedMotion) {
        raf = requestAnimationFrame(draw);
      }
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [scrollProgress]);

  return (
    <footer className="relative border-t border-border py-12">
      <div className="absolute inset-x-0 top-0 h-[200px] pointer-events-auto">
        <canvas ref={canvasRef} className="w-full h-full" style={{ cursor: "crosshair" }} />
      </div>
      <div className="container mx-auto px-6 relative" style={{ marginTop: "180px" }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="font-mono text-xs text-muted-foreground">
            <span className="text-foreground font-medium">EO Data Science</span>{" "}
            // Senior Earth Observation Scientist
          </div>
          <div className="flex items-center gap-6 font-mono text-xs text-muted-foreground">
            <span>Copernicus</span>
            <span className="text-border">|</span>
            <span>ESA</span>
            <span className="text-border">|</span>
            <span>European Commission</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
