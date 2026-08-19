import { useRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const CHARSET = " .:-=+*#%@";
const COLS = 100;
const ROWS = 36;
const CELL_W = 9;
const CELL_H = 14;
const Z_OFFSET_INCREMENT = 0.005;
const RIPPLE_RADIUS = 140;
const RIPPLE_STRENGTH = 0.7;
const INFLATE_RADIUS = 100;
const INFLATE_MAX_SCALE = 2.2;
const VELOCITY_THRESHOLD = 12;
const RIPPLE_DISSIPATE_MS = 600;
const BASE_FLOW_SPEED = 0.008;

function hash(x: number, y: number, z: number): number {
  const p = x * 12.9898 + y * 78.233 + z * 45.164;
  return (Math.sin(p) * 43758.5453) % 1;
}

function noise3(x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const w = fz * fz * (3 - 2 * fz);

  const n000 = hash(ix, iy, iz);
  const n100 = hash(ix + 1, iy, iz);
  const n010 = hash(ix, iy + 1, iz);
  const n110 = hash(ix + 1, iy + 1, iz);
  const n001 = hash(ix, iy, iz + 1);
  const n101 = hash(ix + 1, iy, iz + 1);
  const n011 = hash(ix, iy + 1, iz + 1);
  const n111 = hash(ix + 1, iy + 1, iz + 1);

  const x00 = n000 * (1 - u) + n100 * u;
  const x10 = n010 * (1 - u) + n110 * u;
  const x01 = n001 * (1 - u) + n101 * u;
  const x11 = n011 * (1 - u) + n111 * u;
  const y0 = x00 * (1 - v) + x10 * v;
  const y1 = x01 * (1 - v) + x11 * v;
  return y0 * (1 - w) + y1 * w;
}

function fbm2(x: number, y: number, z: number, octaves = 4): number {
  let v = 0;
  let a = 1;
  let f = 1;
  for (let i = 0; i < octaves; i++) {
    v += a * noise3(x * f, y * f, z * f);
    a *= 0.5;
    f *= 2;
  }
  return Math.max(0, Math.min(1, v));
}

function contourElevation(c: number, r: number, t: number, scale: number): number {
  const nx = c * scale;
  const ny = r * scale;
  const noiseVal = fbm2(nx, ny, t);
  const waveX = Math.sin(nx * 0.08 + t * 0.5) * 0.25;
  const waveY = Math.cos(ny * 0.06 + t * 0.3) * 0.25;
  const contour = noiseVal + waveX + waveY;
  return Math.max(0, Math.min(1, contour * 0.9 + 0.05));
}

// Only the recipient address is needed to route the form — no other
// personal data is stored, transmitted to a third party, or hardcoded here.
const CONTACT_EMAIL = "horia.camarasan99@gmail.com";
const MAX_MESSAGE_LENGTH = 1800; // keeps the mailto: URL well under browser/OS length limits

const ContactSection = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const lastMouseRef = useRef({ x: -1000, y: -1000, t: 0 });
  const rippleIntensityRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const zOffsetRef = useRef(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scale = 0.04;
    let lastFrameTime = performance.now();

    let raf: number;
    const draw = (now: number) => {
      const dt = (now - lastFrameTime) / 1000;
      lastFrameTime = now;
      zOffsetRef.current += BASE_FLOW_SPEED;
      const t = zOffsetRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      const timeSinceLastMove = (now - lastMoveTimeRef.current) / 1000;
      if (timeSinceLastMove > 0 && rippleIntensityRef.current > 0) {
        rippleIntensityRef.current = Math.max(0, 1 - timeSinceLastMove / (RIPPLE_DISSIPATE_MS / 1000));
      }

      const cols = Math.ceil(canvas.width / CELL_W) || COLS;
      const rows = Math.ceil(canvas.height / CELL_H) || ROWS;

      ctx.fillStyle = "#FDFCF0";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${CELL_H * 0.8}px 'Courier New', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = "#4A4A4A";

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * CELL_W + CELL_W / 2;
          const y = r * CELL_H + CELL_H / 2;

          const dx = x - mx;
          const dy = y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let n = contourElevation(c, r, t, scale);

          let inflateScale = 1;
          if (rippleIntensityRef.current > 0 && dist < RIPPLE_RADIUS) {
            const normDist = dist / RIPPLE_RADIUS;
            const falloff = 1 - normDist;
            const centreWeight = falloff * falloff;
            const wave = centreWeight * RIPPLE_STRENGTH * rippleIntensityRef.current;
            n = Math.min(1, n + wave);

            if (dist < INFLATE_RADIUS) {
              const inflateNorm = dist / INFLATE_RADIUS;
              const inflateFalloff = 1 - inflateNorm * inflateNorm;
              inflateScale = 1 + (INFLATE_MAX_SCALE - 1) * inflateFalloff * rippleIntensityRef.current;
            }
          }

          const idx = Math.floor(n * (CHARSET.length - 1) + 0.5);
          const charIndex = Math.max(0, Math.min(CHARSET.length - 1, idx));
          const char = CHARSET[charIndex];

          if (inflateScale > 1.01) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(inflateScale, inflateScale);
            ctx.fillText(char, 0, 0);
            ctx.restore();
          } else {
            ctx.fillText(char, x, y);
          }
        }
      }
      ctx.globalAlpha = 1;

      if (!prefersReducedMotion) {
        raf = requestAnimationFrame(draw);
      }
    };
    raf = requestAnimationFrame(draw);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const now = performance.now();
      const last = lastMouseRef.current;
      const dt = (now - last.t) / 1000;
      if (dt > 0 && last.x > -900) {
        const vx = (x - last.x) / dt;
        const vy = (y - last.y) / dt;
        const velocity = Math.sqrt(vx * vx + vy * vy);
        if (velocity > VELOCITY_THRESHOLD) {
          rippleIntensityRef.current = 1;
          lastMoveTimeRef.current = now;
        }
      }
      lastMouseRef.current = { x, y, t: now };
      mouseRef.current = { x, y };
    };
    const onLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    const resize = () => {
      const w = canvas.parentElement?.clientWidth || window.innerWidth;
      const h = canvas.parentElement?.clientHeight || 420;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim().slice(0, 200);
    const email = String(data.get("email") ?? "").trim().slice(0, 200);
    const message = String(data.get("message") ?? "").trim().slice(0, MAX_MESSAGE_LENGTH);

    const subject = `Portfolio contact from ${name || "website visitor"}`;
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Opens the visitor's own email client with the message pre-filled —
    // no server, no third-party form processor, nothing to leak.
    window.location.href = mailtoUrl;
    setSubmitted(true);
  };

  return (
    <section className="relative min-h-[420px] flex items-center justify-center overflow-hidden bg-[#FDFCF0]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full ascii-topography"
        style={{ width: "100%", height: "100%" }}
      />
      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-12">
        <div
          className="rounded-xl border border-border/60 px-6 py-8 shadow-sm backdrop-blur-md"
          style={{
            background: "linear-gradient(180deg, hsl(150 20% 45% / 0.08) 0%, hsl(48 33% 98% / 0.92) 100%)",
          }}
        >
          <h2 className="text-2xl font-heading font-bold text-foreground mb-1">
            Contact
          </h2>
          <p className="text-muted-foreground font-mono text-sm mb-6">
            Get in touch for EO / datacube projects.
          </p>
          {submitted ? (
            <p className="text-sm text-muted-foreground font-mono">
              Opening your email app with the message ready to go — hit send there to reach me.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground font-mono text-xs">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Your name"
                  className="font-mono bg-background/80 border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-mono text-xs">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="font-mono bg-background/80 border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-foreground font-mono text-xs">
                  Message
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Your message..."
                  rows={4}
                  maxLength={MAX_MESSAGE_LENGTH}
                  className="font-mono bg-background/80 border-border resize-none"
                  required
                />
              </div>
              <Button type="submit" className="w-full font-mono" variant="default">
                Send
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
