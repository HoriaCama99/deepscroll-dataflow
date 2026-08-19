import { Mesh, Program, Renderer, Triangle, Vec2, Vec3 } from 'ogl';
import { useEffect, useRef } from 'react';
import './Orb.css';

interface OrbProps {
  hue?: number;
  hoverIntensity?: number;
  rotateOnHover?: boolean;
  forceHoverState?: boolean;
  backgroundColor?: string;
}

export default function Orb({
  hue = 0,
  hoverIntensity = 0.2,
  rotateOnHover = true,
  forceHoverState = false,
  backgroundColor = '#000000',
}: OrbProps) {
  const ctnDom = useRef<HTMLDivElement>(null);

  const vert = /* glsl */ `
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const frag = /* glsl */ `
    precision highp float;

    uniform float iTime;
    uniform vec3 iResolution;
    uniform float hue;
    uniform float hover;
    uniform float rot;
    uniform float hoverIntensity;
    uniform vec3 backgroundColor;
    uniform vec2 uMouse;

    varying vec2 vUv;

    vec3 rgb2yiq(vec3 c) {
      return vec3(
        dot(c, vec3(0.299,  0.587,  0.114)),
        dot(c, vec3(0.596, -0.274, -0.322)),
        dot(c, vec3(0.211, -0.523,  0.312))
      );
    }
    vec3 yiq2rgb(vec3 c) {
      return vec3(
        c.x + 0.956*c.y + 0.621*c.z,
        c.x - 0.272*c.y - 0.647*c.z,
        c.x - 1.106*c.y + 1.703*c.z
      );
    }
    vec3 adjustHue(vec3 color, float hueDeg) {
      float rad = hueDeg * 3.14159265 / 180.0;
      vec3 yiq = rgb2yiq(color);
      float ci = yiq.y * cos(rad) - yiq.z * sin(rad);
      float qi = yiq.y * sin(rad) + yiq.z * cos(rad);
      return yiq2rgb(vec3(yiq.x, ci, qi));
    }

    vec3 hash33(vec3 p3) {
      p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
      p3 += dot(p3, p3.yxz + 19.19);
      return -1.0 + 2.0 * fract(vec3(
        p3.x + p3.y, p3.x + p3.z, p3.y + p3.z
      ) * p3.zyx);
    }
    float snoise3(vec3 p) {
      const float K1 = 0.333333333;
      const float K2 = 0.166666667;
      vec3 i  = floor(p + (p.x + p.y + p.z) * K1);
      vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
      vec3 e  = step(vec3(0.0), d0 - d0.yzx);
      vec3 i1 = e * (1.0 - e.zxy);
      vec3 i2 = 1.0 - e.zxy * (1.0 - e);
      vec3 d1 = d0 - (i1 - K2);
      vec3 d2 = d0 - (i2 - K1);
      vec3 d3 = d0 - 0.5;
      vec4 h  = max(0.6 - vec4(dot(d0,d0), dot(d1,d1), dot(d2,d2), dot(d3,d3)), 0.0);
      vec4 n  = h*h*h*h * vec4(
        dot(d0, hash33(i)),
        dot(d1, hash33(i + i1)),
        dot(d2, hash33(i + i2)),
        dot(d3, hash33(i + 1.0))
      );
      return dot(vec4(31.316), n);
    }

    vec4 extractAlpha(vec3 colorIn) {
      float a = max(max(colorIn.r, colorIn.g), colorIn.b);
      return vec4(colorIn.rgb / (a + 1e-5), a);
    }

    vec2 toSquareUV(vec2 fragCoord) {
      vec2 p = fragCoord / iResolution.xy;
      if (iResolution.x > iResolution.y) {
        p.x *= iResolution.x / iResolution.y;
        p.x += (iResolution.y - iResolution.x) / iResolution.y / 2.0;
      } else {
        p.y *= iResolution.y / iResolution.x;
        p.y += (iResolution.x - iResolution.y) / iResolution.x / 2.0;
      }
      return p;
    }
    float sdCircleSB(vec2 st, vec2 center) {
      return length(st - center) * 2.0;
    }
    float fillSoft(float sdf, float size, float edge) {
      return 1.0 - smoothstep(size - edge, size + edge, sdf);
    }

    const vec3 baseColor1 = vec3(0.611765, 0.262745, 0.996078);
    const vec3 baseColor2 = vec3(0.298039, 0.760784, 0.913725);
    const vec3 baseColor3 = vec3(0.062745, 0.078431, 0.600000);
    const float innerRadius = 0.6;
    const float noiseScale  = 0.65;

    float light1(float intensity, float attenuation, float dist) {
      return intensity / (1.0 + dist * attenuation);
    }
    float light2(float intensity, float attenuation, float dist) {
      return intensity / (1.0 + dist * dist * attenuation);
    }

    vec4 draw(vec2 uv) {
      vec3 color1 = adjustHue(baseColor1, hue);
      vec3 color2 = adjustHue(baseColor2, hue);
      vec3 color3 = adjustHue(baseColor3, hue);

      float ang    = atan(uv.y, uv.x);
      float len    = length(uv);
      float invLen = len > 0.0 ? 1.0 / len : 0.0;
      float bgLum  = dot(backgroundColor, vec3(0.299, 0.587, 0.114));

      float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;
      float r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);
      float d0 = distance(uv, (r0 * invLen) * uv);
      float v0 = light1(1.0, 10.0, d0);

      v0 *= smoothstep(r0 * 1.05, r0, len);
      float innerFade = smoothstep(r0 * 0.8, r0 * 0.95, len);
      v0 *= mix(innerFade, 1.0, bgLum * 0.7);
      float cl = cos(ang + iTime * 2.0) * 0.5 + 0.5;

      float a2 = iTime * -1.0;
      vec2  pos = vec2(cos(a2), sin(a2)) * r0;
      float d   = distance(uv, pos);
      float v1  = light2(1.5, 5.0, d) * light1(1.0, 50.0, d0);

      float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
      float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);

      vec3  colBase    = mix(color1, color2, cl);
      float fadeAmount = mix(1.0, 0.1, bgLum);

      vec3 darkCol  = clamp((mix(color3, colBase, v0) + v1) * v2 * v3, 0.0, 1.0);
      vec3 lightCol = clamp(mix(backgroundColor, (colBase + v1) * mix(1.0, v2 * v3, fadeAmount), v0), 0.0, 1.0);

      return extractAlpha(mix(darkCol, lightCol, bgLum));
    }

    void main() {
      vec2 fragCoord = vUv * iResolution.xy;
      vec2 center = iResolution.xy * 0.5;
      float size   = min(iResolution.x, iResolution.y);
      if (size <= 0.0) { gl_FragColor = vec4(0.0); return; }
      vec2 uv     = (fragCoord - center) / size * 2.0;

      float s = sin(rot), c2 = cos(rot);
      uv = vec2(c2 * uv.x - s * uv.y, s * uv.x + c2 * uv.y);

      uv.x += hover * hoverIntensity * 0.04 * sin(uv.y * 10.0 + iTime);
      uv.y += hover * hoverIntensity * 0.04 * sin(uv.x * 10.0 + iTime);

      vec4 orb = draw(uv);

      vec2 stFrag  = toSquareUV(fragCoord);
      vec2 stMouse = toSquareUV(vec2(uMouse.x, iResolution.y - uMouse.y));
      float sdfMouseCircle = fillSoft(sdCircleSB(stFrag, stMouse), 0.28, 0.55);
      float influence = sdfMouseCircle * hover;

      float orbLen = length(uv);
      float borderW  = 0.030 + influence * hoverIntensity * 0.55;
      float edgeSoft = 0.08;
      float edgeRing = smoothstep(1.0 - borderW - edgeSoft, 1.0 - borderW + edgeSoft, orbLen)
        - smoothstep(1.0 + borderW - edgeSoft, 1.0 + borderW + edgeSoft, orbLen);
      edgeRing = clamp(edgeRing, 0.0, 1.0);
      float ringFade = 1.0 - smoothstep(1.0 - borderW, 1.0 + borderW, orbLen);
      edgeRing *= ringFade;

      float clipR = 1.0 - borderW * 0.45;
      float innerMask = 1.0 - smoothstep(clipR - 0.02, clipR + 0.01, orbLen);

      vec3 col = orb.rgb * orb.a * innerMask;
      float alpha = innerMask * orb.a;

      vec3 ringCol = mix(
        adjustHue(baseColor2, hue),
        adjustHue(baseColor1, hue),
        sdfMouseCircle
      ) * (1.4 + hover * sdfMouseCircle * 0.9);
      col   += edgeRing * ringCol;
      alpha  = max(alpha, edgeRing * 0.95);

      gl_FragColor = vec4(col, alpha);
    }
  `;

  useEffect(() => {
    const container = ctnDom.current;
    if (!container) return;

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vert,
      fragment: frag,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new Vec3(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height),
        },
        hue: { value: hue },
        hover: { value: 0 },
        rot: { value: 0 },
        hoverIntensity: { value: hoverIntensity },
        backgroundColor: { value: hexToVec3(backgroundColor) },
        uMouse: { value: new Vec2(0, 0) },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    if (!program.uniformLocations || program.uniformLocations.size === 0) {
      console.warn("Orb: WebGL program did not link. Check console for shader errors.");
      if (container.contains(gl.canvas)) container.removeChild(gl.canvas);
      return;
    }

    function resize() {
      if (!container) return;
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      renderer.setSize(width * dpr, height * dpr);
      gl.canvas.style.width = width + 'px';
      gl.canvas.style.height = height + 'px';
      program.uniforms.iResolution.value.set(
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height
      );
    }
    window.addEventListener('resize', resize);
    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(container);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let targetHover = 0;
    let lastTime = 0;
    let currentRot = 0;
    const rotationSpeed = 0.3;
    const rawMouse = { x: 0, y: 0 };
    const dampMouse = { x: 0, y: 0 };
    if (container.clientWidth > 0 && container.clientHeight > 0) {
      dampMouse.x = rawMouse.x = container.clientWidth * 0.5;
      dampMouse.y = rawMouse.y = container.clientHeight * 0.5;
    }

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      rawMouse.x = e.clientX - rect.left;
      rawMouse.y = e.clientY - rect.top;
      const width = rect.width;
      const height = rect.height;
      const inBounds = rawMouse.x >= 0 && rawMouse.x <= width && rawMouse.y >= 0 && rawMouse.y <= height;
      const size = Math.min(width, height);
      const uvX = ((rawMouse.x - width / 2) / size) * 2.0;
      const uvY = ((rawMouse.y - height / 2) / size) * 2.0;
      const distFromCenter = Math.sqrt(uvX * uvX + uvY * uvY);
      targetHover = inBounds && distFromCenter < 1.35 ? 1 : 0;
    };

    const handlePointerLeave = () => {
      targetHover = 0;
    };

    window.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);

    let rafId: number;
    const update = (t: number) => {
      rafId = requestAnimationFrame(update);
      const dt = (t - lastTime) * 0.001;
      lastTime = t;

      const effectiveHover = forceHoverState ? 1 : targetHover;
      program.uniforms.hover.value += (effectiveHover - program.uniforms.hover.value) * 0.1;

      const k = 1.0 - Math.pow(1.0 - 0.12, 60 * dt);
      dampMouse.x += (rawMouse.x - dampMouse.x) * k;
      dampMouse.y += (rawMouse.y - dampMouse.y) * k;

      const dpr = window.devicePixelRatio || 1;
      program.uniforms.uMouse.value.set(dampMouse.x * dpr, dampMouse.y * dpr);

      if (rotateOnHover && effectiveHover > 0.5) {
        currentRot += dt * rotationSpeed;
      }
      program.uniforms.rot.value = currentRot;

      // Under reduced motion, advance time very slowly for a near-static orb
      program.uniforms.iTime.value = prefersReducedMotion ? t * 0.00005 : t * 0.001;
      program.uniforms.hue.value = hue;
      program.uniforms.hoverIntensity.value = hoverIntensity;
      program.uniforms.backgroundColor.value = hexToVec3(backgroundColor);

      if (program.uniformLocations) renderer.render({ scene: mesh });
    };
    rafId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      if (container.contains(gl.canvas)) container.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hue, hoverIntensity, rotateOnHover, forceHoverState, backgroundColor]);

  return <div ref={ctnDom} className="orb-container" />;
}

function hslToRgb(h: number, s: number, l: number): Vec3 {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return new Vec3(r!, g!, b!);
}

function hexToVec3(color: string): Vec3 {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;
    return new Vec3(r, g, b);
  }

  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return new Vec3(
      parseInt(rgbMatch[1]) / 255,
      parseInt(rgbMatch[2]) / 255,
      parseInt(rgbMatch[3]) / 255
    );
  }

  const hslMatch = color.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/);
  if (hslMatch) {
    const h = parseInt(hslMatch[1]) / 360;
    const s = parseInt(hslMatch[2]) / 100;
    const l = parseInt(hslMatch[3]) / 100;
    return hslToRgb(h, s, l);
  }

  return new Vec3(0, 0, 0);
}
