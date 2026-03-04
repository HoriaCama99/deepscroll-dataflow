import { useEffect, useRef } from "react";

interface TopographicLinesProps {
  scrollProgress: number;
}

const TopographicLines = ({ scrollProgress }: TopographicLinesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const lineCount = 20;
    const spacing = canvas.height / lineCount;

    for (let i = 0; i < lineCount; i++) {
      ctx.beginPath();
      const baseY = i * spacing + spacing / 2;
      const amplitude = 15 + Math.sin(scrollProgress * 3 + i * 0.5) * 12;
      const frequency = 0.003 + scrollProgress * 0.002;

      for (let x = 0; x < canvas.width; x += 2) {
        const y =
          baseY +
          Math.sin(x * frequency + scrollProgress * 4 + i * 0.8) * amplitude +
          Math.sin(x * frequency * 2.3 + i * 1.2) * (amplitude * 0.4);

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      const alpha = 0.04 + Math.abs(Math.sin(scrollProgress * 2 + i * 0.3)) * 0.06;
      ctx.strokeStyle = `hsla(199, 89%, 48%, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [scrollProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default TopographicLines;
