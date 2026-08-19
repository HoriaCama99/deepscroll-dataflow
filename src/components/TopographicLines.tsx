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
    const hues = [
      { h: 150, s: 20, l: 45 }, // sage
      { h: 210, s: 25, l: 60 }, // dusty-blue
      { h: 15, s: 40, l: 55 },  // terracotta
    ];

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

      const alpha = 0.05 + Math.abs(Math.sin(scrollProgress * 2 + i * 0.3)) * 0.07;
      const hue = hues[i % hues.length];
      ctx.strokeStyle = `hsla(${hue.h}, ${hue.s}%, ${hue.l}%, ${alpha})`;
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
