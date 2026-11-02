import { useEffect, useRef, useState, type CSSProperties } from "react";
import building from "@/assets/building-wide.jpg";
import { CRACK_LOWER, CRACK_UPPER, FALL_DURATION_MS, FIXED_FLOORS_FROM, SEAMS, SPARK_BURST_DURATION_MS, SPARK_SEQUENCE, VERTICAL_AMP, crackClipPath, facadeDeformation, sparkDelayMs, verticalCrack, withJaggedLeft } from "./building-motion";

const W = 760; // two building sections side by side (two entrances)
const H = 570;
const IMG_H = 623; // displayed image height: building (H) + lawn strip below
const MID_FROM = 245;
const MID_TO = 353;
const SHOP_FROM = FIXED_FLOORS_FROM; // floors 1-2 stay fixed
const COLS = 4;
const SX = W / 380; // debris x-coords were tuned for the single-section building

type Frag = { x: number; y: number; w: number; h: number; dx: number; dy: number; dz: number; rx: number; ry: number; rz: number; clip?: string };

// Deterministic pseudo-random so SSR and client match
function rand(seed: number) {
  const s = Math.sin(seed * 9301 + 49297) * 233280;
  return s - Math.floor(s);
}

function makeFrags(from: number, to: number, rows: number, side: -1 | 1, seed: number): Frag[] {
  const frags: Frag[] = [];
  const rh = (to - from) / rows;
  const cw = W / COLS;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = seed + r * COLS + c;
      // farther from the stable middle = stronger break
      const dist = side === -1 ? (rows - r) / rows : (r + 1) / rows;
      const spread = (c - (COLS - 1) / 2) / ((COLS - 1) / 2); // -1..1
      frags.push({
        x: c * cw,
        y: from + r * rh,
        w: cw,
        h: rh,
        dx: (rand(i) - 0.5) * 16 * dist,
        dy: (side === -1 ? 60 + r * 25 : 30 + r * 40) + rand(i + 1) * 60 * dist,
        dz: 0,
        rx: rand(i + 3) * 10 * dist,
        ry: 0,
        rz: (rand(i + 5) - 0.5) * 22 * dist,
      });
    }
  }
  return frags;
}

// Jagged "broken concrete" fracture lines (see building-motion.ts).
// Every floor boundary in the collapsing mass gets its own jagged crack.
// Edges overlap instead of abutting: the row above reaches down over the crack
// unclipped, the row below clips along the crack and paints over it — no gaps at rest.
const STATIC_FROM = Math.min(...CRACK_LOWER.map((p) => p.y)) - 4;
const STATIC_CLIP = crackClipPath({ x: 0, y: STATIC_FROM, w: W, h: H - STATIC_FROM }, CRACK_LOWER, undefined);
const CRACK_BOTTOM_MAX = Math.max(...CRACK_LOWER.map((p) => p.y));
const CRACK_UPPER_MAX = Math.max(...CRACK_UPPER.map((p) => p.y));
const seamMax = (r: number) => {
  const seam = SEAMS.at(r);
  return seam ? Math.max(...seam.map((p) => p.y)) : CRACK_UPPER_MAX;
};
const topFrags = makeFrags(0, MID_TO, 6, -1, 1);
const TOP: Frag[] = [];
for (let r = 0; r < 6; r++) {
  for (let c = 0; c < COLS; c++) {
    const f = topFrags.at(r * COLS + c);
    if (!f) continue;
    const ext = { ...f, h: seamMax(r) - f.y };
    const seam = r > 0 ? SEAMS.at(r - 1) : undefined;
    TOP.push(seam ? { ...ext, clip: crackClipPath(ext, seam, undefined) } : ext);
  }
}
const BOTTOM = makeFrags(MID_TO, SHOP_FROM, 1, 1, 100)
  .map((f) => ({ ...f, h: CRACK_BOTTOM_MAX - f.y }))
  .map((f) => ({ ...f, clip: crackClipPath(f, CRACK_UPPER, undefined) }));

// Jagged vertical breaks between columns: each piece overlaps its left neighbour
// and clips its own left edge along a zigzag, so there are no gaps at rest.
function jagColumns(frags: Frag[]): Frag[] {
  return frags.map((f, i) => {
    const c = Math.round(f.x / (W / COLS));
    const right = c < COLS - 1 ? VERTICAL_AMP + 1 : 0;
    if (c === 0) return { ...f, w: f.w + right };
    const box = { ...f, x: f.x - VERTICAL_AMP - 1, w: f.w + VERTICAL_AMP + 1 + right };
    const top = f.y - 10;
    const line = verticalCrack(f.x, top, f.y + f.h + 10, i + 11);
    const clip = withJaggedLeft(box, f.clip, line);
    return { ...box, clip };
  });
}
const TOP_J = jagColumns(TOP);
const BOTTOM_J = jagColumns(BOTTOM);

// Neon sign overlay box (component px): image band x108-348,y976-1021 erased,
// text re-rendered as SVG scaled 760/1536 (x) and 623/1264 (y) from image coords.
const SIGN = { x: 56.5, y: 483.5, w: 108, h: 19 };
// Centre band (x541-708, y997-1016) reads ЭКСПЕРТИЗА КВАРТИР; the right band
// (x1258-1446) reads АУДИТ ЖИЛЫХ ОБЪЕКТОВ. Both re-rendered as wave overlays.
const SIGN2 = { x: 622.6, y: 491.4, w: 92.8, h: 9.5 };
const SIGN3 = { x: 267.7, y: 491.4, w: 82.6, h: 9.5 };
// Former THE DAILY BEAN band (image x826-1026, y984-1023), now two lines.
const SIGN4 = { x: 408.7, y: 485.5, w: 98.9, h: 19 };

// Interactive shop-floor buttons rendered on the erased sign bands.
type SignSpec = { key: string; box: { x: number; y: number; w: number; h: number }; lines: string[]; fs: number };
const SIGNS: SignSpec[] = [
  { key: "verify", box: SIGN, lines: ["ВЕРИФИКАЦИЯ", "СТРОИТЕЛЬНОЙ ДОКУМЕНТАЦИИ"], fs: 7.5 },
  { key: "audit", box: SIGN2, lines: ["АУДИТ ЖИЛЫХ ОБЪЕКТОВ"], fs: 7 },
  { key: "expert", box: SIGN3, lines: ["ЭКСПЕРТИЗА КВАРТИР"], fs: 7 },
  { key: "inspect", box: SIGN4, lines: ["ИНСПЕКЦИЯ ВСТРОЕННЫХ", "КОММЕРЧЕСКИХ ПОМЕЩЕНИЙ"], fs: 7.5 },
];

function SignButton({ s }: { s: SignSpec }) {
  return (
    <a
      href="#services"
      className="sign-btn"
      style={{ left: s.box.x + s.box.w / 2, top: s.box.y + s.box.h / 2 }}
    >
      {s.lines.map((line) => <span key={line} style={{ fontSize: s.fs }}>{line}</span>)}
    </a>
  );
}


const Svg = {
  rebar: (
    <svg viewBox="0 0 60 14" className="h-[14px] w-[60px] text-primary"><g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M2 4 L58 2" /><path d="M2 11 L56 12" /></g><g stroke="currentColor" strokeWidth="1"><path d="M10 2v10M22 2v10M34 2v10M46 2v10" /></g></svg>
  ),
  window: (
    <svg viewBox="0 0 34 44" className="h-11 w-[34px]"><rect x="1.5" y="1.5" width="31" height="41" fill="var(--muted)" stroke="var(--foreground)" strokeWidth="3" /><path d="M17 2v40M2 22h30" stroke="var(--foreground)" strokeWidth="2" /><path d="M6 8l8 10M22 26l6 10" stroke="var(--slate)" strokeWidth="1" /></svg>
  ),
  pipe: (
    <svg viewBox="0 0 90 14" className="h-[14px] w-[90px]"><rect x="0" y="3" width="90" height="8" rx="4" fill="var(--slate)" /><rect x="20" y="1" width="6" height="12" fill="var(--muted-foreground)" /><rect x="64" y="1" width="6" height="12" fill="var(--muted-foreground)" /></svg>
  ),
  ac: (
    <svg viewBox="0 0 48 32" className="h-8 w-12"><rect x="1" y="1" width="46" height="30" rx="2" fill="var(--foreground)" /><circle cx="17" cy="16" r="10" fill="var(--muted)" /><path d="M17 6v20M7 16h20M10 9l14 14M24 9 10 23" stroke="var(--slate)" strokeWidth="1.5" /><path d="M32 6h11M32 11h11M32 16h11M32 21h11M32 26h11" stroke="var(--slate)" strokeWidth="1.5" /></svg>
  ),
  duct: (
    <svg viewBox="0 0 70 26" className="h-[26px] w-[70px]"><rect x="1" y="1" width="68" height="24" fill="var(--muted-foreground)" stroke="var(--slate)" strokeWidth="2" /><path d="M14 1v24M28 1v24M42 1v24M56 1v24" stroke="var(--slate)" strokeWidth="1.5" /></svg>
  ),
  radiator: (
    <svg viewBox="0 0 48 30" className="h-8 w-12"><rect x="1" y="4" width="46" height="22" rx="2" fill="var(--foreground)" /><g fill="var(--muted)"><rect x="4" y="6" width="5" height="18" rx="2" /><rect x="12" y="6" width="5" height="18" rx="2" /><rect x="20" y="6" width="5" height="18" rx="2" /><rect x="28" y="6" width="5" height="18" rx="2" /><rect x="36" y="6" width="5" height="18" rx="2" /></g><path d="M8 1v3M24 1v3M40 1v3" stroke="var(--slate)" strokeWidth="2" /></svg>
  ),
};

type Debris = { kind: keyof typeof Svg; x: number; y: number; fall: number; drift: number; rot: number; at: number };
const DEBRIS: Debris[] = [
  { kind: "rebar", x: 20, y: 40, fall: 380, drift: -70, rot: -140, at: 0.15 },
  { kind: "duct", x: 280, y: 20, fall: 420, drift: 90, rot: 120, at: 0.25 },
  { kind: "ac", x: 300, y: 120, fall: 360, drift: 60, rot: 200, at: 0.1 },
  { kind: "window", x: 150, y: 80, fall: 400, drift: -30, rot: 95, at: 0.35 },
  { kind: "pipe", x: 10, y: 180, fall: 340, drift: -90, rot: -60, at: 0.2 },
  { kind: "ac", x: 10, y: 90, fall: 390, drift: -50, rot: -230, at: 0.45 },
  { kind: "rebar", x: 300, y: 225, fall: 300, drift: 100, rot: 170, at: 0.3 },
  { kind: "rebar", x: 90, y: 30, fall: 420, drift: 40, rot: 160, at: 0.2 },
  { kind: "rebar", x: 210, y: 60, fall: 380, drift: -60, rot: -120, at: 0.35 },
  { kind: "pipe", x: 120, y: 150, fall: 400, drift: 70, rot: 60, at: 0.15 },
  { kind: "pipe", x: 330, y: 240, fall: 320, drift: -80, rot: -90, at: 0.4 },
  { kind: "radiator", x: 60, y: 200, fall: 420, drift: -50, rot: 140, at: 0.25 },
  { kind: "radiator", x: 180, y: 230, fall: 380, drift: 90, rot: -170, at: 0.3 },
  { kind: "radiator", x: 300, y: 170, fall: 430, drift: -30, rot: 210, at: 0.2 },
];

function DebrisItem({ d, k }: { d: Debris; k: number }) {
  // one-shot: once broken off, the piece falls for 3s, lands, fades and is removed for good
  const [phase, setPhase] = useState<"idle" | "start" | "falling" | "fading" | "gone">("idle");
  const triggered = k > d.at;

  useEffect(() => {
    if (!triggered || phase !== "idle") return;
    setPhase("start");
  }, [triggered, phase]);

  useEffect(() => {
    if (phase === "start") {
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setPhase("falling")));
      return () => cancelAnimationFrame(r);
    }
    if (phase === "falling") {
      const t = setTimeout(() => setPhase("fading"), FALL_DURATION_MS);
      return () => clearTimeout(t);
    }
    if (phase === "fading") {
      const t = setTimeout(() => setPhase("gone"), 700);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase]);

  if (phase === "idle" || phase === "gone") return null;
  const down = phase === "falling" || phase === "fading";
  return (
    <div
      className="absolute z-20"
      style={{
        left: d.x * SX,
        top: d.y,
        opacity: phase === "fading" ? 0 : 1,
        transform: down
          ? `translate3d(${d.drift * SX}px, ${IMG_H - 30 - d.y}px, 40px) rotate(${d.rot}deg) scale(1)`
          : "translate3d(0,0,0) rotate(0deg) scale(0)",
        transformOrigin: "center",
        transition: down ? "transform 3s cubic-bezier(0.55,0,1,0.45), opacity 0.7s" : "none",
      }}
    >
      {Svg[d.kind]}
    </div>
  );
}

// One finite spray from a point; a spent crossing never sparks again.
function Spark({ p, i, k }: { p: { x: number; y: number }; i: number; k: number }) {
  const [phase, setPhase] = useState<"idle" | "active" | "spent">("idle");
  const triggered = k > 0.1;
  useEffect(() => {
    if (!triggered || phase !== "idle") return;
    const timer = setTimeout(() => setPhase("active"), sparkDelayMs(i));
    return () => clearTimeout(timer);
  }, [triggered, phase, i]);
  useEffect(() => {
    if (phase !== "active") return;
    const timer = setTimeout(() => setPhase("spent"), SPARK_BURST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [phase]);
  if (phase !== "active") return null;
  return (
    <div
      className="spark-weld"
      style={{ left: p.x, top: p.y }}
    >
      <span className="spark-star" aria-hidden="true" />
      {Array.from({ length: 64 }, (_, j) => {
        const ang = j % 5 === 0
          ? rand(j + 30) * Math.PI * 2
          : Math.PI * (0.2 + rand(j + 30) * 0.6);
        const dist = 8 + rand(j + 60) * 20;
        return (
          <span
            key={j}
            className="spark-mote"
            style={{
              "--dx": `${(Math.cos(ang) * dist).toFixed(1)}px`,
              "--dy": `${(Math.sin(ang) * dist + 2).toFixed(1)}px`,
              "--angle": `${(ang * 180 / Math.PI).toFixed(1)}deg`,
              "--trail": `${(3 + rand(j + 120) * 4).toFixed(1)}px`,
              animationDelay: `${(j * 0.024).toFixed(3)}s`,
              animationDuration: `${0.6 + rand(j + 90) * 0.2}s`,
            } as CSSProperties}
          />
        );
      })}
    </div>
  );
}

function Piece({ f, k }: { f: Frag; k: number }) {
  const damage = facadeDeformation(k, f.dy, f.rz);
  const tx = f.dx * k * 0.5;
  return (
    <div
      className={`layer-move absolute overflow-hidden${k > 0.08 ? " facade-drift" : ""}`}
      style={{
        left: f.x,
        top: f.y,
        width: f.w + 0.5,
        height: f.h + 0.5,
        clipPath: f.clip,
        transform: `translate3d(${tx}px, ${damage.drop}px, 0) rotateX(${f.rx * k * 0.2}deg) rotateZ(${damage.rotation}deg)`,
        opacity: damage.opacity,
        transition: `transform ${FALL_DURATION_MS}ms cubic-bezier(0.55,0,1,0.45)`,
        transformOrigin: "center",
        animationDelay: `${-(f.x + f.y) / 100}s`,
        animationDuration: `${6 + (f.y % 4)}s`,
      }}
    >
      <img src={building} alt="" width={W} height={IMG_H} draggable={false}
        className="absolute block max-w-none select-none"
        style={{ left: -f.x, top: -f.y, width: W, height: IMG_H }} />
    </div>
  );
}

export function HeroBuilding() {
  const ref = useRef<HTMLDivElement>(null);
  const [s, setS] = useState({ k: 0, nx: 0, ny: 0 });
  const [sc, setSc] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setSc(Math.max(el.clientWidth / W, el.clientHeight / IMG_H));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const desktop = window.matchMedia("(hover: hover) and (min-width: 1024px)");
    const onMove = (e: MouseEvent) => {
      if (!desktop.matches) return;
      const nx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1));
      const ny = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1));
      // collapse is one-way: intensity only grows, never returns to 0
      setS((prev) => ({ k: Math.max(prev.k, Math.min(1, Math.hypot(nx, ny))), nx, ny }));
    };
    const onScroll = () => {
      if (desktop.matches) return;
      const el = ref.current;
      if (!el) return;
      const p = Math.max(0, Math.min(1, window.scrollY / (el.getBoundingClientRect().height + 200)));
      setS((prev) => ({ k: Math.max(prev.k, p), nx: 0, ny: 0 }));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <div className="absolute" style={{ left: "50%", bottom: 0, width: W, height: IMG_H, transform: `translateX(-50%) scale(${sc})`, transformOrigin: "bottom center" }}>
      <div className="relative" style={{ width: W, height: IMG_H, perspective: 900 }}>
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        <div className="absolute inset-0">
          {TOP_J.map((f, i) => <Piece key={`t${i}`} f={f} {...s} />)}
          {BOTTOM_J.map((f, i) => <Piece key={`b${i}`} f={f} {...s} />)}
        </div>

        {DEBRIS.map((d, i) => <DebrisItem key={`d${i}`} d={d} k={s.k} />)}

        {/* Stable floors 1-2: first residential floor and shop ground floor, jagged broken-concrete top edge */}
        <div className="absolute left-0 z-10 overflow-hidden" style={{ top: STATIC_FROM, width: W, height: H - STATIC_FROM, clipPath: STATIC_CLIP }}>
          <img src={building} alt="" width={W} height={IMG_H} draggable={false}
            className="absolute left-0 block max-w-none select-none" style={{ top: -STATIC_FROM, width: W, height: IMG_H }} />
        </div>

        {/* Stable lawn */}
        <div className="absolute left-0 z-10 overflow-hidden" style={{ top: H, width: W, height: IMG_H - H }}>
          <img src={building} alt="" width={W} height={IMG_H} draggable={false}
            className="absolute left-0 block max-w-none select-none" style={{ top: -H, width: W, height: IMG_H }} />
        </div>

        {/* Sign under the shade: light wave sweeps white -> yellow -> black every 10s. */}
        <svg className="pointer-events-none absolute z-10 select-none" style={{ left: SIGN.x, top: SIGN.y, overflow: "visible" }}
          width={SIGN.w} height={SIGN.h} viewBox={`0 0 ${SIGN.w} ${SIGN.h}`}>
          <defs>
            <linearGradient id="signWaveA" gradientUnits="userSpaceOnUse" x1="-108" y1="0" x2="216" y2="0">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.167" stopColor="#ffe600" />
              <stop offset="0.333" stopColor="#6ec1ff" />
              <stop offset="0.5" stopColor="#ffffff" />
              <stop offset="0.667" stopColor="#ffe600" />
              <stop offset="0.833" stopColor="#6ec1ff" />
              <stop offset="1" stopColor="#ffffff" />
              <animateTransform attributeName="gradientTransform" type="translate" values="0 0; -108 0" dur="10s" repeatCount="indefinite" calcMode="linear" />
            </linearGradient>
          </defs>
          <text className="sign-neon" fill="url(#signWaveA)" x="54.9" y="8.8" textAnchor="middle" textLength="64" lengthAdjust="spacingAndGlyphs">ВЕРИФИКАЦИЯ</text>
          <text className="sign-neon" fill="url(#signWaveA)" x="54.1" y="17.2" textAnchor="middle" textLength="107" lengthAdjust="spacingAndGlyphs">СТРОИТЕЛЬНОЙ ДОКУМЕНТАЦИИ</text>
        </svg>

        <svg className="pointer-events-none absolute z-10 select-none" style={{ left: SIGN3.x, top: SIGN3.y, overflow: "visible" }}
          width={SIGN3.w} height={SIGN3.h} viewBox={`0 0 ${SIGN3.w} ${SIGN3.h}`}>
          <defs>
            <linearGradient id="signWaveE" gradientUnits="userSpaceOnUse" x1="-108" y1="0" x2="216" y2="0">
              <stop offset="0" stopColor="#2036c8" />
              <stop offset="0.167" stopColor="#39d98a" />
              <stop offset="0.333" stopColor="#ff5050" />
              <stop offset="0.5" stopColor="#2036c8" />
              <stop offset="0.667" stopColor="#39d98a" />
              <stop offset="0.833" stopColor="#ff5050" />
              <stop offset="1" stopColor="#2036c8" />
              <animateTransform attributeName="gradientTransform" type="translate" values="0 0; -108 0" dur="10s" repeatCount="indefinite" calcMode="linear" />
            </linearGradient>
          </defs>
          <text className="sign-neon" fill="url(#signWaveE)" x={SIGN3.w / 2} y="7" textAnchor="middle" textLength="78" lengthAdjust="spacingAndGlyphs" style={{ fontSize: 6.2 }}>ЭКСПЕРТИЗА КВАРТИР</text>
        </svg>

        <svg className="pointer-events-none absolute z-10 select-none" style={{ left: SIGN2.x, top: SIGN2.y, overflow: "visible" }}
          width={SIGN2.w} height={SIGN2.h} viewBox={`0 0 ${SIGN2.w} ${SIGN2.h}`}>
          <defs>
            <linearGradient id="signWaveC" gradientUnits="userSpaceOnUse" x1="-108" y1="0" x2="216" y2="0">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.167" stopColor="#ffe600" />
              <stop offset="0.333" stopColor="#6ec1ff" />
              <stop offset="0.5" stopColor="#ffffff" />
              <stop offset="0.667" stopColor="#ffe600" />
              <stop offset="0.833" stopColor="#6ec1ff" />
              <stop offset="1" stopColor="#ffffff" />
              <animateTransform attributeName="gradientTransform" type="translate" values="0 0; -108 0" dur="10s" repeatCount="indefinite" calcMode="linear" />
            </linearGradient>
          </defs>
          <text className="sign-neon" fill="url(#signWaveC)" x={SIGN2.w / 2} y="7" textAnchor="middle" textLength="88" lengthAdjust="spacingAndGlyphs" style={{ fontSize: 6.2 }}>АУДИТ ЖИЛЫХ ОБЪЕКТОВ</text>
        </svg>

        <svg className="pointer-events-none absolute z-10 select-none" style={{ left: SIGN4.x, top: SIGN4.y, overflow: "visible" }}
          width={SIGN4.w} height={SIGN4.h} viewBox={`0 0 ${SIGN4.w} ${SIGN4.h}`}>
          <defs>
            <linearGradient id="signWaveG" gradientUnits="userSpaceOnUse" x1="-108" y1="0" x2="216" y2="0">
              <stop offset="0" stopColor="#3d8bff" />
              <stop offset="0.167" stopColor="#ff5050" />
              <stop offset="0.333" stopColor="#39d98a" />
              <stop offset="0.5" stopColor="#3d8bff" />
              <stop offset="0.667" stopColor="#ff5050" />
              <stop offset="0.833" stopColor="#39d98a" />
              <stop offset="1" stopColor="#3d8bff" />
              <animateTransform attributeName="gradientTransform" type="translate" values="0 0; -108 0" dur="10s" repeatCount="indefinite" calcMode="linear" />
            </linearGradient>
          </defs>
          <text className="sign-neon" fill="url(#signWaveG)" x={SIGN4.w / 2} y="8.8" textAnchor="middle" textLength="94" lengthAdjust="spacingAndGlyphs">ИНСПЕКЦИЯ ВСТРОЕННЫХ</text>
          <text className="sign-neon" fill="url(#signWaveG)" x={SIGN4.w / 2} y="17.2" textAnchor="middle" textLength="94" lengthAdjust="spacingAndGlyphs">КОММЕРЧЕСКИХ ПОМЕЩЕНИЙ</text>
        </svg>


      </div>
      </div>
      </div>
      {/* Text-legibility shade sits under the sparks so the flash keeps its full brightness */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      <div className="pointer-events-none absolute" style={{ left: "50%", bottom: 0, width: W, height: IMG_H, transform: `translateX(-50%) scale(${sc})`, transformOrigin: "bottom center" }}>
        {/* Extra sign copy above the shade adds ~20% brightness, same wave. */}
        <svg className="pointer-events-none absolute select-none" style={{ left: SIGN.x, top: SIGN.y, overflow: "visible", opacity: 0.2 }}
          width={SIGN.w} height={SIGN.h} viewBox={`0 0 ${SIGN.w} ${SIGN.h}`}>
          <defs>
            <linearGradient id="signWaveB" gradientUnits="userSpaceOnUse" x1="-108" y1="0" x2="216" y2="0">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.167" stopColor="#ffe600" />
              <stop offset="0.333" stopColor="#6ec1ff" />
              <stop offset="0.5" stopColor="#ffffff" />
              <stop offset="0.667" stopColor="#ffe600" />
              <stop offset="0.833" stopColor="#6ec1ff" />
              <stop offset="1" stopColor="#ffffff" />
              <animateTransform attributeName="gradientTransform" type="translate" values="0 0; -108 0" dur="10s" repeatCount="indefinite" calcMode="linear" />
            </linearGradient>
          </defs>
          <text className="sign-neon" fill="url(#signWaveB)" x="54.9" y="8.8" textAnchor="middle" textLength="64" lengthAdjust="spacingAndGlyphs">ВЕРИФИКАЦИЯ</text>
          <text className="sign-neon" fill="url(#signWaveB)" x="54.1" y="17.2" textAnchor="middle" textLength="107" lengthAdjust="spacingAndGlyphs">СТРОИТЕЛЬНОЙ ДОКУМЕНТАЦИИ</text>
        </svg>
        <svg className="pointer-events-none absolute select-none" style={{ left: SIGN3.x, top: SIGN3.y, overflow: "visible", opacity: 0.2 }}
          width={SIGN3.w} height={SIGN3.h} viewBox={`0 0 ${SIGN3.w} ${SIGN3.h}`}>
          <defs>
            <linearGradient id="signWaveF" gradientUnits="userSpaceOnUse" x1="-108" y1="0" x2="216" y2="0">
              <stop offset="0" stopColor="#2036c8" />
              <stop offset="0.167" stopColor="#39d98a" />
              <stop offset="0.333" stopColor="#ff5050" />
              <stop offset="0.5" stopColor="#2036c8" />
              <stop offset="0.667" stopColor="#39d98a" />
              <stop offset="0.833" stopColor="#ff5050" />
              <stop offset="1" stopColor="#2036c8" />
              <animateTransform attributeName="gradientTransform" type="translate" values="0 0; -108 0" dur="10s" repeatCount="indefinite" calcMode="linear" />
            </linearGradient>
          </defs>
          <text className="sign-neon" fill="url(#signWaveF)" x={SIGN3.w / 2} y="7" textAnchor="middle" textLength="78" lengthAdjust="spacingAndGlyphs" style={{ fontSize: 6.2 }}>ЭКСПЕРТИЗА КВАРТИР</text>
        </svg>
        <svg className="pointer-events-none absolute select-none" style={{ left: SIGN2.x, top: SIGN2.y, overflow: "visible", opacity: 0.2 }}
          width={SIGN2.w} height={SIGN2.h} viewBox={`0 0 ${SIGN2.w} ${SIGN2.h}`}>
          <defs>
            <linearGradient id="signWaveD" gradientUnits="userSpaceOnUse" x1="-108" y1="0" x2="216" y2="0">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.167" stopColor="#ffe600" />
              <stop offset="0.333" stopColor="#6ec1ff" />
              <stop offset="0.5" stopColor="#ffffff" />
              <stop offset="0.667" stopColor="#ffe600" />
              <stop offset="0.833" stopColor="#6ec1ff" />
              <stop offset="1" stopColor="#ffffff" />
              <animateTransform attributeName="gradientTransform" type="translate" values="0 0; -108 0" dur="10s" repeatCount="indefinite" calcMode="linear" />
            </linearGradient>
          </defs>
          <text className="sign-neon" fill="url(#signWaveD)" x={SIGN2.w / 2} y="7" textAnchor="middle" textLength="88" lengthAdjust="spacingAndGlyphs" style={{ fontSize: 6.2 }}>АУДИТ ЖИЛЫХ ОБЪЕКТОВ</text>
        </svg>
        <svg className="pointer-events-none absolute select-none" style={{ left: SIGN4.x, top: SIGN4.y, overflow: "visible", opacity: 0.2 }}
          width={SIGN4.w} height={SIGN4.h} viewBox={`0 0 ${SIGN4.w} ${SIGN4.h}`}>
          <defs>
            <linearGradient id="signWaveH" gradientUnits="userSpaceOnUse" x1="-108" y1="0" x2="216" y2="0">
              <stop offset="0" stopColor="#3d8bff" />
              <stop offset="0.167" stopColor="#ff5050" />
              <stop offset="0.333" stopColor="#39d98a" />
              <stop offset="0.5" stopColor="#3d8bff" />
              <stop offset="0.667" stopColor="#ff5050" />
              <stop offset="0.833" stopColor="#39d98a" />
              <stop offset="1" stopColor="#3d8bff" />
              <animateTransform attributeName="gradientTransform" type="translate" values="0 0; -108 0" dur="10s" repeatCount="indefinite" calcMode="linear" />
            </linearGradient>
          </defs>
          <text className="sign-neon" fill="url(#signWaveH)" x={SIGN4.w / 2} y="8.8" textAnchor="middle" textLength="94" lengthAdjust="spacingAndGlyphs">ИНСПЕКЦИЯ ВСТРОЕННЫХ</text>
          <text className="sign-neon" fill="url(#signWaveH)" x={SIGN4.w / 2} y="17.2" textAnchor="middle" textLength="94" lengthAdjust="spacingAndGlyphs">КОММЕРЧЕСКИХ ПОМЕЩЕНИЙ</text>
        </svg>
        {SPARK_SEQUENCE.map((p, i) => <Spark key={`s${i}`} p={p} i={i} k={s.k} />)}
      </div>
    </div>
  );
}
