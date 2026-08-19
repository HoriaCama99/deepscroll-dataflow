import { useEffect, useRef, type KeyboardEvent } from "react";

interface EoPipelinePanelProps {
  /** 0–1 progress through the pipeline (0 = nothing shown, 1 = all 7 steps shown) */
  progress: number;
  /** called when a viewer clicks a node or a step dot to jump directly to that step */
  onStepClick?: (index: number) => void;
}

const STEPS = [
  {
    node: "n0",
    conn: null,
    pkt: null,
    label: "Landing Zone",
    desc: "Raw EO data ingested from satellites into S3 buckets as NetCDF & GeoTIFF.",
  },
  {
    node: "n1",
    conn: "c01",
    pkt: { id: "p01", path: "c01", loop: 2.4 },
    label: "AWS Glue",
    desc: "Automated metadata extraction and schema cataloguing across all ingested scenes.",
  },
  {
    node: "n2",
    conn: "c12",
    pkt: { id: "p12", path: "c12", loop: 2.6 },
    label: "DASK Workers",
    desc: "Distributed parallel processing cluster for atmospheric correction & band maths.",
  },
  {
    node: "n3",
    conn: "c23",
    pkt: { id: "p23", path: "c23", loop: 2.2 },
    label: "Data Lake",
    desc: "Analysis-ready COG & Zarr tiles stored in cloud-optimised formats.",
  },
  {
    node: "n4",
    conn: "c24",
    pkt: { id: "p24", path: "c24", loop: 2.5 },
    label: "Metadata Catalog",
    desc: "STAC-compliant spatial index backed by PostGIS for sub-second scene discovery.",
  },
  {
    node: "n5",
    conn: "c35",
    pkt: { id: "p35", path: "c35", loop: 2.8 },
    label: "SageMaker",
    desc: "ML inference pipelines for NDVI, LST and change-detection model scoring.",
  },
  {
    node: "n6",
    conn: ["c46", "c56"],
    pkt: { id: "p56", path: "c56", loop: 3.0 },
    label: "End Users",
    desc: "Delivered via OGC APIs, REST endpoints and interactive GIS dashboards.",
  },
];

export default function EoPipelinePanel({ progress, onStepClick }: EoPipelinePanelProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const nodeProps = (i: number) =>
    onStepClick
      ? {
          onClick: () => onStepClick(i),
          role: "button" as const,
          tabIndex: 0,
          onKeyDown: (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onStepClick(i);
            }
          },
          style: { cursor: "pointer" },
          "aria-label": `Jump to ${STEPS[i].label}`,
        }
      : {};
  const animsRef = useRef<Record<string, { live: boolean; raf: number | null; tmr: ReturnType<typeof setTimeout> | null }>>({});
  const curRef = useRef(0);  // n0 is pre-shown in markup

  const activeStep = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length));

  function startPkt(cfg: { id: string; path: string; loop: number }) {
    stopPkt(cfg.id);
    const svg = svgRef.current;
    if (!svg) return;
    const dot = svg.querySelector<SVGCircleElement>(`#${cfg.id}`);
    const path = svg.querySelector<SVGPathElement>(`#${cfg.path}`);
    if (!dot || !path) return;
    const len = path.getTotalLength();
    const st = { live: true, raf: null as number | null, tmr: null as ReturnType<typeof setTimeout> | null };
    animsRef.current[cfg.id] = st;
    dot.style.opacity = "1";
    let t0 = performance.now();
    function tick(ts: number) {
      if (!st.live) return;
      const t = Math.min((ts - t0) / 650, 1);
      const p = path!.getPointAtLength(t * len);
      dot!.setAttribute("cx", String(p.x));
      dot!.setAttribute("cy", String(p.y));
      if (t < 1) {
        st.raf = requestAnimationFrame(tick);
      } else {
        dot!.style.opacity = "0";
        st.tmr = setTimeout(() => {
          if (!st.live) return;
          t0 = performance.now();
          dot!.style.opacity = "1";
          st.raf = requestAnimationFrame(tick);
        }, cfg.loop * 1000);
      }
    }
    st.raf = requestAnimationFrame(tick);
  }

  function stopPkt(id: string) {
    const s = animsRef.current[id];
    if (!s) return;
    s.live = false;
    if (s.raf) cancelAnimationFrame(s.raf);
    if (s.tmr) clearTimeout(s.tmr);
    const svg = svgRef.current;
    if (svg) {
      const d = svg.querySelector<SVGCircleElement>(`#${id}`);
      if (d) d.style.opacity = "0";
    }
    delete animsRef.current[id];
  }

  function showStep(i: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const s = STEPS[i];
    const el = svg.querySelector(`#${s.node}`);
    if (el) el.classList.add("on");
    const conns = s.conn ? (Array.isArray(s.conn) ? s.conn : [s.conn]) : [];
    conns.forEach((cid) => {
      const c = svg.querySelector(`#${cid}`);
      if (!c) return;
      c.classList.remove("on");
      void (c as SVGElement).getBoundingClientRect();
      c.classList.add("on");
    });
    if (s.pkt) setTimeout(() => startPkt(s.pkt!), 560);
  }

  function hideStep(i: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const s = STEPS[i];
    const el = svg.querySelector(`#${s.node}`);
    if (el) el.classList.remove("on");
    const conns = s.conn ? (Array.isArray(s.conn) ? s.conn : [s.conn]) : [];
    conns.forEach((cid) => {
      const c = svg.querySelector(`#${cid}`);
      if (c) c.classList.remove("on");
    });
    if (s.pkt) stopPkt(s.pkt.id);
  }

  useEffect(() => {
    const target = activeStep;
    const prev = curRef.current;
    if (target === prev) return;
    if (target > prev) {
      for (let i = prev + 1; i <= target; i++) showStep(i);
    } else {
      for (let i = prev; i > target; i--) hideStep(i);
    }
    curRef.current = target;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep]);


  const activeDesc = activeStep >= 0 ? STEPS[activeStep].desc : "";

  return (
    <div className="flex flex-col h-full font-mono select-none">
      {/* SVG pipeline — fills all available space */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="42 84 616 280"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%", overflow: "visible", display: "block" }}
        >
          <style>{`
            .node { opacity: 0; transform: translateY(6px); transition: opacity .4s ease, transform .4s ease; transform-box: fill-box; transform-origin: center; }
            .node.on { opacity: 1; transform: translateY(0); }
            .conn { fill: none; stroke-dasharray: 400; stroke-dashoffset: 400; }
            .conn.on { animation: pipe-draw .55s cubic-bezier(.4,0,.15,1) forwards; }
            @keyframes pipe-draw { to { stroke-dashoffset: 0; } }
            .pkt { opacity: 0; transition: opacity .2s; }
            @keyframes pkt-blink { 0%,100%{opacity:.3} 50%{opacity:1} }
            @keyframes pkt-shimmer { 0%,100%{opacity:.1} 50%{opacity:.3} }
            .shine { animation: pkt-shimmer 2.6s ease-in-out infinite; }
            @keyframes pkt-orbit { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          `}</style>
          <defs>
            <marker id="aa" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L7,3z" fill="#A8B5A2"/>
            </marker>
            <marker id="ar" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L7,3z" fill="#D98E73"/>
            </marker>
            <filter id="ga" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="2.5" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="gr" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="2.5" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {/* Platform gradients — cream/sage tones */}
            <linearGradient id="pt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F0F0EB"/><stop offset="1" stopColor="#E5E5DF"/>
            </linearGradient>
            <linearGradient id="pl" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#BFBFBA"/><stop offset="1" stopColor="#CFCFC9"/>
            </linearGradient>
            <linearGradient id="pr" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#CFCFC9"/><stop offset="1" stopColor="#BFBFBA"/>
            </linearGradient>
            {/* DASK dark platform */}
            <linearGradient id="dpt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#262625"/><stop offset="1" stopColor="#191919"/>
            </linearGradient>
            <linearGradient id="dpl" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#191919"/><stop offset="1" stopColor="#262625"/>
            </linearGradient>
            <linearGradient id="dpr" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#262625"/><stop offset="1" stopColor="#1a1a18"/>
            </linearGradient>
            {/* Terracotta drum (S3 landing) */}
            <linearGradient id="dtop" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#D4A27F"/><stop offset="1" stopColor="#D98E73"/>
            </linearGradient>
            <linearGradient id="dside" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#D98E73"/><stop offset="1" stopColor="#9e4e38"/>
            </linearGradient>
            <linearGradient id="dsh" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="white" stopOpacity="0"/>
              <stop offset=".5" stopColor="white" stopOpacity=".22"/>
              <stop offset="1" stopColor="white" stopOpacity="0"/>
            </linearGradient>
            {/* Sage drum (Data Lake) */}
            <linearGradient id="dlaketop" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#C0CBBA"/><stop offset="1" stopColor="#A8B5A2"/>
            </linearGradient>
            <linearGradient id="dlakeside" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#A8B5A2"/><stop offset="1" stopColor="#6e8c68"/>
            </linearGradient>
            {/* DASK cubes */}
            <linearGradient id="dct" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#D98E73"/><stop offset="1" stopColor="#b06040"/>
            </linearGradient>
            <linearGradient id="dcl" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#40403E"/><stop offset="1" stopColor="#5a2818"/>
            </linearGradient>
            <linearGradient id="dcr" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#5a2818"/><stop offset="1" stopColor="#3a1010"/>
            </linearGradient>
            {/* Glue cubes */}
            <linearGradient id="ct" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#EBDBBC"/><stop offset="1" stopColor="#D4A27F"/>
            </linearGradient>
            <linearGradient id="cl" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#D98E73"/><stop offset="1" stopColor="#b86448"/>
            </linearGradient>
            <linearGradient id="cr" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#b86448"/><stop offset="1" stopColor="#9e5038"/>
            </linearGradient>
            {/* Catalog blue drum */}
            <linearGradient id="btop" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#7ca5b8"/><stop offset="1" stopColor="#5a8aaa"/>
            </linearGradient>
            <linearGradient id="bside" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4a78a0"/><stop offset="1" stopColor="#1e4878"/>
            </linearGradient>
          </defs>

          {/* ── CONNECTORS ── */}
          <path id="c01" className="conn" d="M 185,210 L 185,190 L 240,158 L 240,178"
            stroke="#A8B5A2" strokeWidth="1.6" strokeLinejoin="round" markerEnd="url(#aa)"/>
          <path id="c12" className="conn" d="M 295,178 L 295,198 L 350,230 L 350,210"
            stroke="#A8B5A2" strokeWidth="1.6" strokeLinejoin="round" markerEnd="url(#aa)"/>
          <path id="c23" className="conn" d="M 405,210 L 405,190 L 460,158 L 460,178"
            stroke="#D98E73" strokeWidth="1.6" strokeLinejoin="round" strokeDasharray="5 3" markerEnd="url(#ar)"/>
          <path id="c24" className="conn" d="M 405,210 L 405,230 L 460,262 L 460,242"
            stroke="#D98E73" strokeWidth="1.6" strokeLinejoin="round" strokeDasharray="5 3" markerEnd="url(#ar)"/>
          <path id="c35" className="conn" d="M 515,178 L 515,198 L 570,230 L 570,210"
            stroke="#A8B5A2" strokeWidth="1.6" strokeLinejoin="round" markerEnd="url(#aa)"/>
          <path id="c46" className="conn" d="M 515,242 L 515,262 L 570,294 L 570,274"
            stroke="#A8B5A2" strokeWidth="1.6" strokeLinejoin="round" markerEnd="url(#aa)"/>
          <path id="c56" className="conn" d="M 570,230 L 570,254"
            stroke="#A8B5A2" strokeWidth="1.6" markerEnd="url(#aa)"/>

          {/* ── n1: AWS Glue ── */}
          <g className="node" id="n1" {...nodeProps(1)}>
            <polygon points="185,178 240,158 295,178 240,198" fill="url(#pt)" stroke="#BFBFBA" strokeWidth=".9"/>
            <polygon points="185,178 240,198 240,212 185,192" fill="url(#pl)" stroke="#BFBFBA" strokeWidth=".9"/>
            <polygon points="295,178 240,198 240,212 295,192" fill="url(#pr)" stroke="#BFBFBA" strokeWidth=".9"/>
            <g transform="translate(218,130)">
              <polygon points="0,8 11,3 22,8 11,13" fill="url(#ct)"/>
              <polygon points="0,8 0,20 11,25 11,13" fill="url(#cl)"/>
              <polygon points="22,8 22,20 11,25 11,13" fill="url(#cr)"/>
            </g>
            <g transform="translate(233,121)">
              <polygon points="0,8 11,3 22,8 11,13" fill="url(#ct)"/>
              <polygon points="0,8 0,20 11,25 11,13" fill="url(#cl)"/>
              <polygon points="22,8 22,20 11,25 11,13" fill="url(#cr)"/>
            </g>
            <g transform="translate(218,146)">
              <polygon points="0,8 11,3 22,8 11,13" fill="url(#ct)"/>
              <polygon points="0,8 0,20 11,25 11,13" fill="url(#cl)"/>
              <polygon points="22,8 22,20 11,25 11,13" fill="url(#cr)"/>
            </g>
            <g transform="translate(233,137)">
              <polygon points="0,8 11,3 22,8 11,13" fill="url(#ct)"/>
              <polygon points="0,8 0,20 11,25 11,13" fill="url(#cl)"/>
              <polygon points="22,8 22,20 11,25 11,13" fill="url(#cr)"/>
            </g>
            <circle cx="233" cy="150" r="2" fill="#7ca5b8"/>
            <circle cx="241" cy="145" r="2" fill="#7ca5b8"/>
            <circle cx="233" cy="162" r="2" fill="#7ca5b8"/>
            <text fontSize="8" fontWeight="700" fill="#40403E" textAnchor="middle" x="240" y="226">AWS Glue</text>
            <text fontSize="6.5" fill="#91918D" textAnchor="middle" x="240" y="238">Metadata extraction</text>
          </g>

          {/* ── n3: Data Lake ── */}
          <g className="node" id="n3" {...nodeProps(3)}>
            <text fontSize="8" fontWeight="700" fill="#40403E" textAnchor="middle" x="460" y="116">Data Lake</text>
            <text fontSize="6.5" fill="#91918D" textAnchor="middle" x="460" y="128">COG · Zarr · GeoTIFF</text>
            <polygon points="405,178 460,158 515,178 460,198" fill="url(#pt)" stroke="#BFBFBA" strokeWidth=".9"/>
            <polygon points="405,178 460,198 460,212 405,192" fill="url(#pl)" stroke="#BFBFBA" strokeWidth=".9"/>
            <polygon points="515,178 460,198 460,212 515,192" fill="url(#pr)" stroke="#BFBFBA" strokeWidth=".9"/>
            <ellipse cx="460" cy="136" rx="26" ry="10" fill="#6e8c68"/>
            <rect x="434" y="136" width="52" height="24" fill="url(#dlakeside)"/>
            <ellipse cx="460" cy="136" rx="26" ry="10" fill="url(#dlaketop)"/>
            <ellipse cx="460" cy="160" rx="26" ry="10" fill="#4a6e48"/>
            <ellipse cx="460" cy="136" rx="26" ry="10" fill="url(#dsh)" className="shine"/>
            <text fontSize="8" fontWeight="700" fill="#FDFCF0" textAnchor="middle" x="460" y="152">s3</text>
            <path d="M451,156 Q460,160 469,156" fill="none" stroke="#EBDBBC" strokeWidth="1.2"/>
          </g>

          {/* ── n0: Landing Zone — always visible as the starting node ── */}
          <g className="node on" id="n0" {...nodeProps(0)}>
            <polygon points="75,210 130,190 185,210 130,230" fill="url(#pt)" stroke="#BFBFBA" strokeWidth=".9"/>
            <polygon points="75,210 130,230 130,244 75,224" fill="url(#pl)" stroke="#BFBFBA" strokeWidth=".9"/>
            <polygon points="185,210 130,230 130,244 185,224" fill="url(#pr)" stroke="#BFBFBA" strokeWidth=".9"/>
            <line x1="97" y1="166" x2="103" y2="186" stroke="#666663" strokeWidth="1"/>
            <line x1="113" y1="166" x2="103" y2="186" stroke="#666663" strokeWidth="1"/>
            <line x1="99" y1="174" x2="111" y2="174" stroke="#666663" strokeWidth=".8"/>
            <path d="M94,166 Q103,160 112,166" fill="none" stroke="#666663" strokeWidth="1"/>
            <ellipse cx="130" cy="168" rx="26" ry="10" fill="#9e4e38"/>
            <rect x="104" y="168" width="52" height="24" fill="url(#dside)"/>
            <ellipse cx="130" cy="168" rx="26" ry="10" fill="url(#dtop)"/>
            <ellipse cx="130" cy="192" rx="26" ry="10" fill="#7a3828"/>
            <ellipse cx="130" cy="168" rx="26" ry="10" fill="url(#dsh)" className="shine"/>
            <path d="M130,176 v10 M124,181 l6,6 l6,-6" fill="none" stroke="#FDFCF0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M121,188 Q130,192 139,188" fill="none" stroke="#EBDBBC" strokeWidth="1.2"/>
            <ellipse cx="130" cy="163" rx="28" ry="10" fill="none" stroke="#BFBFBA" strokeWidth=".7" strokeDasharray="3 2"/>
            <g style={{ transformOrigin: "130px 163px", animation: "pkt-orbit 5s linear infinite" }}>
              <rect x="143" y="158" width="9" height="5" rx="1" fill="#91918D"/>
              <rect x="139" y="160" width="4" height="2" rx=".5" fill="#7ca5b8" opacity=".9"/>
              <rect x="152" y="160" width="4" height="2" rx=".5" fill="#7ca5b8" opacity=".9"/>
            </g>
            <text fontSize="8" fontWeight="700" fill="#40403E" textAnchor="middle" x="130" y="260">Landing Zone</text>
            <text fontSize="6.5" fill="#91918D" textAnchor="middle" x="130" y="272">S3 · NetCDF · GeoTIFF</text>
          </g>

          {/* ── n2: DASK ── */}
          <g className="node" id="n2" {...nodeProps(2)}>
            <polygon points="295,210 350,190 405,210 350,230" fill="url(#dpt)" stroke="#D98E73" strokeWidth="1" strokeDasharray="5 3"/>
            <polygon points="295,210 350,230 350,244 295,224" fill="url(#dpl)" stroke="#40403E" strokeWidth=".9"/>
            <polygon points="405,210 350,230 350,244 405,224" fill="url(#dpr)" stroke="#40403E" strokeWidth=".9"/>
            <g style={{ animation: "pkt-blink 1.2s 0s ease-in-out infinite" }} transform="translate(328,162)">
              <polygon points="0,8 11,3 22,8 11,13" fill="url(#dct)"/>
              <polygon points="0,8 0,20 11,25 11,13" fill="url(#dcl)"/>
              <polygon points="22,8 22,20 11,25 11,13" fill="url(#dcr)"/>
            </g>
            <g style={{ animation: "pkt-blink 1.2s .3s ease-in-out infinite" }} transform="translate(343,153)">
              <polygon points="0,8 11,3 22,8 11,13" fill="url(#dct)"/>
              <polygon points="0,8 0,20 11,25 11,13" fill="url(#dcl)"/>
              <polygon points="22,8 22,20 11,25 11,13" fill="url(#dcr)"/>
            </g>
            <g style={{ animation: "pkt-blink 1.2s .6s ease-in-out infinite" }} transform="translate(328,178)">
              <polygon points="0,8 11,3 22,8 11,13" fill="url(#dct)"/>
              <polygon points="0,8 0,20 11,25 11,13" fill="url(#dcl)"/>
              <polygon points="22,8 22,20 11,25 11,13" fill="url(#dcr)"/>
            </g>
            <g style={{ animation: "pkt-blink 1.2s .9s ease-in-out infinite" }} transform="translate(343,169)">
              <polygon points="0,8 11,3 22,8 11,13" fill="url(#dct)"/>
              <polygon points="0,8 0,20 11,25 11,13" fill="url(#dcl)"/>
              <polygon points="22,8 22,20 11,25 11,13" fill="url(#dcr)"/>
            </g>
            <circle cx="343" cy="182" r="2" fill="#D98E73" filter="url(#gr)"/>
            <circle cx="351" cy="177" r="2" fill="#D98E73" filter="url(#gr)"/>
            <circle cx="343" cy="194" r="2" fill="#D98E73" filter="url(#gr)"/>
            <text fontSize="8" fontWeight="700" fill="#D98E73" textAnchor="middle" x="350" y="260">DASK</text>
            <text fontSize="6.5" fill="#666663" textAnchor="middle" x="350" y="272">Parallel workers</text>
          </g>

          {/* ── n5: SageMaker ── */}
          <g className="node" id="n5" {...nodeProps(5)}>
            <text fontSize="8" fontWeight="700" fill="#40403E" textAnchor="middle" x="570" y="148">SageMaker</text>
            <text fontSize="6.5" fill="#91918D" textAnchor="middle" x="570" y="160">ML · Inference</text>
            <polygon points="515,210 570,190 625,210 570,230" fill="url(#pt)" stroke="#BFBFBA" strokeWidth=".9"/>
            <polygon points="515,210 570,230 570,244 515,224" fill="url(#pl)" stroke="#BFBFBA" strokeWidth=".9"/>
            <polygon points="625,210 570,230 570,244 625,224" fill="url(#pr)" stroke="#BFBFBA" strokeWidth=".9"/>
            <rect x="546" y="165" width="48" height="28" rx="3" fill="#E5E5DF" stroke="#BFBFBA" strokeWidth="1"/>
            <line x1="546" y1="175" x2="594" y2="175" stroke="#BFBFBA" strokeWidth=".8"/>
            <circle cx="560" cy="170" r="4" fill="#666663"/>
            <path d="M553,183 q7,-5 14,0" fill="none" stroke="#666663" strokeWidth="1.2"/>
            <circle cx="577" cy="169" r="3" fill="#91918D" opacity=".7"/>
            <circle cx="584" cy="172" r="2.2" fill="#91918D" opacity=".5"/>
            <path d="M573,182 q5,-4 10,0" fill="none" stroke="#91918D" strokeWidth="1" opacity=".7"/>
            <rect x="562" y="193" width="8" height="3" rx="1" fill="#BFBFBA"/>
            <rect x="554" y="195" width="24" height="2" rx="1" fill="#BFBFBA"/>
          </g>

          {/* ── n4: Metadata Catalog ── */}
          <g className="node" id="n4" {...nodeProps(4)}>
            <polygon points="405,242 460,222 515,242 460,262" fill="url(#pt)" stroke="#BFBFBA" strokeWidth=".9"/>
            <polygon points="405,242 460,262 460,276 405,256" fill="url(#pl)" stroke="#BFBFBA" strokeWidth=".9"/>
            <polygon points="515,242 460,262 460,276 515,256" fill="url(#pr)" stroke="#BFBFBA" strokeWidth=".9"/>
            <ellipse cx="460" cy="224" rx="22" ry="8" fill="#1e4878"/>
            <rect x="438" y="224" width="44" height="20" fill="url(#bside)"/>
            <ellipse cx="460" cy="224" rx="22" ry="8" fill="url(#btop)"/>
            <ellipse cx="460" cy="244" rx="22" ry="8" fill="#143060"/>
            <path d="M438,231 Q460,238 482,231" fill="none" stroke="#FAFAF7" strokeWidth=".8" opacity=".35"/>
            <path d="M438,238 Q460,245 482,238" fill="none" stroke="#FAFAF7" strokeWidth=".8" opacity=".25"/>
            <text fontSize="8" fontWeight="700" fill="#40403E" textAnchor="middle" x="460" y="292">Metadata Catalog</text>
            <text fontSize="6.5" fill="#91918D" textAnchor="middle" x="460" y="304">STAC · PostGIS</text>
          </g>

          {/* ── n6: End Users ── */}
          <g className="node" id="n6" {...nodeProps(6)}>
            <polygon points="515,274 570,254 625,274 570,294" fill="url(#pt)" stroke="#BFBFBA" strokeWidth=".9"/>
            <polygon points="515,274 570,294 570,308 515,288" fill="url(#pl)" stroke="#BFBFBA" strokeWidth=".9"/>
            <polygon points="625,274 570,294 570,308 625,288" fill="url(#pr)" stroke="#BFBFBA" strokeWidth=".9"/>
            <path d="M570,256 l20,9 v18 q0,11 -20,16 q-20,-5 -20,-16 v-18 z"
              fill="#E5E5DF" stroke="#BFBFBA" strokeWidth="1.1"/>
            <path d="M562,279 l8,-8 l8,8" fill="none" stroke="#40403E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="570" y1="271" x2="570" y2="284" stroke="#40403E" strokeWidth="1.8" strokeLinecap="round"/>
            <text fontSize="8" fontWeight="700" fill="#40403E" textAnchor="middle" x="570" y="324">End Users</text>
            <text fontSize="6.5" fill="#91918D" textAnchor="middle" x="570" y="336">GIS · REST · OGC</text>
          </g>

          {/* ── PACKETS ── */}
          <circle id="p01" className="pkt" r="3.5" fill="#D98E73" filter="url(#ga)"/>
          <circle id="p12" className="pkt" r="3.5" fill="#D98E73" filter="url(#ga)"/>
          <circle id="p23" className="pkt" r="3.5" fill="#D98E73" filter="url(#gr)"/>
          <circle id="p24" className="pkt" r="3.5" fill="#D98E73" filter="url(#gr)"/>
          <circle id="p35" className="pkt" r="3.5" fill="#D98E73" filter="url(#ga)"/>
          <circle id="p46" className="pkt" r="3.5" fill="#D98E73" filter="url(#ga)"/>
          <circle id="p56" className="pkt" r="3.5" fill="#D98E73" filter="url(#ga)"/>
        </svg>
      </div>

      {/* Step description + dots row */}
      <div className="flex items-center gap-3 mt-2">
        <div
          className="flex-1 px-2 py-1.5 rounded-md text-xs leading-snug transition-all duration-300"
          style={{
            background: "rgba(168,181,162,0.12)",
            border: "1px solid rgba(168,181,162,0.25)",
            color: "#4A4A4A",
            minHeight: "2.2rem",
          }}
        >
          {activeStep >= 0 ? (
            <>
              <span style={{ color: "#D98E73", fontWeight: 700 }}>
                {STEPS[activeStep].label}
              </span>{" "}
              — {activeDesc}
            </>
          ) : (
            <span style={{ color: "#A8B5A2" }}>Scroll to reveal the pipeline…</span>
          )}
        </div>

        {/* Step dots */}
        <div className="flex gap-1 shrink-0">
          {STEPS.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onStepClick?.(i)}
              aria-label={`Jump to ${s.label}`}
              className="rounded-full transition-all duration-300 p-0 border-0"
              style={{
                width: i === activeStep ? 14 : 5,
                height: 5,
                background: i <= activeStep ? "#D98E73" : "#A8B5A2",
                opacity: i <= activeStep ? 1 : 0.35,
                cursor: onStepClick ? "pointer" : "default",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
