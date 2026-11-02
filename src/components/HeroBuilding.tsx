import { useEffect, useRef, useState } from "react";
import building from "@/assets/building.jpg";

const W = 380;
const H = 570;
const IMG_H = 623; // displayed image height: building (H) + lawn strip below
const MID_FROM = 245;
const MID_TO = 353;
const COLS = 3;

type Frag = { x: number; y: number; w: number; h: number; dx: number; dy: number; dz: number; rx: number; ry: number; rz: number };

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

const TOP = makeFrags(0, MID_FROM, 3, -1, 1);


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
  { kind: "window", x: 60, y: 380, fall: 160, drift: -80, rot: -110, at: 0.4 },
  { kind: "pipe", x: 250, y: 400, fall: 140, drift: 110, rot: 80, at: 0.2 },
  { kind: "duct", x: 140, y: 360, fall: 180, drift: 40, rot: -150, at: 0.5 },
  { kind: "rebar", x: 180, y: 345, fall: 200, drift: -40, rot: 210, at: 0.1 },
  { kind: "rebar", x: 90, y: 30, fall: 420, drift: 40, rot: 160, at: 0.2 },
  { kind: "rebar", x: 210, y: 60, fall: 380, drift: -60, rot: -120, at: 0.35 },
  { kind: "pipe", x: 120, y: 150, fall: 400, drift: 70, rot: 60, at: 0.15 },
  { kind: "pipe", x: 330, y: 240, fall: 320, drift: -80, rot: -90, at: 0.4 },
  { kind: "pipe", x: 350, y: 350, fall: 240, drift: -100, rot: -60, at: 0.55 },
  { kind: "radiator", x: 60, y: 200, fall: 420, drift: -50, rot: 140, at: 0.25 },
  { kind: "radiator", x: 180, y: 230, fall: 380, drift: 90, rot: -170, at: 0.3 },
  { kind: "radiator", x: 300, y: 170, fall: 430, drift: -30, rot: 210, at: 0.2 },
  { kind: "radiator", x: 250, y: 330, fall: 260, drift: -70, rot: -120, at: 0.45 },
  { kind: "rebar", x: 40, y: 320, fall: 280, drift: 60, rot: 90, at: 0.5 },
  { kind: "duct", x: 90, y: 410, fall: 200, drift: 60, rot: 100, at: 0.6 },
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
      const t = setTimeout(() => setPhase("fading"), 3000);
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
        left: d.x,
        top: d.y,
        opacity: phase === "fading" ? 0 : 1,
        transform: down
          ? `translate3d(${d.drift}px, ${IMG_H - 30 - d.y}px, 40px) rotate(${d.rot}deg) scale(1)`
          : "translate3d(0,0,0) rotate(0deg) scale(0)",
        transformOrigin: "center",
        transition: down ? "transform 3s cubic-bezier(0.55,0,1,0.45), opacity 0.7s" : "none",
      }}
    >
      {Svg[d.kind]}
    </div>
  );
}

function Piece({ f, k, nx, ny }: { f: Frag; k: number; nx: number; ny: number }) {
  // direction of the cursor skews the debris; k = intensity 0..1
  const tx = f.dx * k;
  const ty = f.dy * k * k;
  const tz = f.dz * k;
  return (
    <div
      className="layer-move absolute overflow-hidden"
      style={{
        left: f.x,
        top: f.y,
        width: f.w + 0.5,
        height: f.h + 0.5,
        transform: `translate3d(${tx}px, ${ty}px, ${tz}px) rotateX(${f.rx * k}deg)  rotateZ(${f.rz * k}deg)`,
        transformOrigin: "center",
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
    <div ref={ref} className="relative mx-auto w-[380px] max-w-full" style={{ height: IMG_H, perspective: 900 }}>
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        <div className="absolute inset-0">
          {TOP.map((f, i) => <Piece key={`t${i}`} f={f} {...s} />)}
        </div>

        {DEBRIS.map((d, i) => <DebrisItem key={`d${i}`} d={d} k={s.k} />)}

        {/* Stable controlled floor */}
        <div className="absolute left-0 z-10 overflow-hidden" style={{ top: MID_FROM, width: W, height: MID_TO - MID_FROM }}>
          <img src={building} alt="Жилой дом под строительным контролем" width={W} height={IMG_H} draggable={false}
            className="absolute left-0 block max-w-none select-none" style={{ top: -MID_FROM, width: W, height: IMG_H }} />
          <div className="absolute inset-0 flex items-center gap-3 px-5">
            {["СТРОИТЕЛЬНЫЙ КОНТРОЛЬ", "ТЕХНИЧЕСКИЙ АУДИТ"].map((l) => (
              <div key={l} className="flex h-20 flex-1 items-center justify-center border-2 border-foreground bg-background/80 p-2 text-center text-xs font-bold leading-tight tracking-wide backdrop-blur-sm">
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* Stable floors 2-3 and shop ground floor */}
        <div className="absolute left-0 z-10 overflow-hidden" style={{ top: MID_TO, width: W, height: H - MID_TO }}>
          <img src={building} alt="" width={W} height={IMG_H} draggable={false}
            className="absolute left-0 block max-w-none select-none" style={{ top: -MID_TO, width: W, height: IMG_H }} />
        </div>

        {/* Stable lawn */}
        <div className="absolute left-0 z-10 overflow-hidden" style={{ top: H, width: W, height: IMG_H - H }}>
          <img src={building} alt="" width={W} height={IMG_H} draggable={false}
            className="absolute left-0 block max-w-none select-none" style={{ top: -H, width: W, height: IMG_H }} />
        </div>
      </div>
    </div>
  );
}
