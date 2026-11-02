import { useEffect, useRef, useState } from "react";
import building from "@/assets/building.jpg";

const W = 380;
const H = 570;
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
        dx: (spread * 30 + (rand(i) - 0.5) * 30) * dist,
        dy: side * (12 + rand(i + 1) * 28) * dist,
        dz: (rand(i + 2) - 0.3) * 120 * dist,
        rx: side * -(6 + rand(i + 3) * 18) * dist,
        ry: (rand(i + 4) - 0.5) * 40 * dist,
        rz: (rand(i + 5) - 0.5) * 24 * dist,
      });
    }
  }
  return frags;
}

const TOP = makeFrags(0, MID_FROM, 3, -1, 1);
const BOTTOM = makeFrags(MID_TO, H, 3, 1, 100);

function Piece({ f, k, nx, ny }: { f: Frag; k: number; nx: number; ny: number }) {
  // direction of the cursor skews the debris; k = intensity 0..1
  const tx = (f.dx + nx * 25) * k;
  const ty = (f.dy + ny * 10) * k;
  const tz = f.dz * k;
  return (
    <div
      className="layer-move absolute overflow-hidden"
      style={{
        left: f.x,
        top: f.y,
        width: f.w + 0.5,
        height: f.h + 0.5,
        transform: `translate3d(${tx}px, ${ty}px, ${tz}px) rotateX(${f.rx * k}deg) rotateY(${f.ry * k + nx * 8 * k}deg) rotateZ(${f.rz * k}deg)`,
        transformOrigin: "center",
      }}
    >
      <img src={building} alt="" width={W} height={H} draggable={false}
        className="absolute block max-w-none select-none"
        style={{ left: -f.x, top: -f.y, width: W, height: H }} />
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
      setS({ k: Math.min(1, Math.hypot(nx, ny)), nx, ny });
    };
    const onLeave = () => desktop.matches && setS({ k: 0, nx: 0, ny: 0 });
    const onScroll = () => {
      if (desktop.matches) return;
      const el = ref.current;
      if (!el) return;
      const p = Math.max(0, Math.min(1, window.scrollY / (el.getBoundingClientRect().height + 200)));
      setS({ k: p, nx: 0, ny: 0 });
    };
    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div ref={ref} className="relative mx-auto w-[380px] max-w-full" style={{ height: H, perspective: 900 }}>
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {TOP.map((f, i) => <Piece key={`t${i}`} f={f} {...s} />)}
        {BOTTOM.map((f, i) => <Piece key={`b${i}`} f={f} {...s} />)}

        {/* Stable controlled floor */}
        <div className="absolute left-0 z-10 overflow-hidden" style={{ top: MID_FROM, width: W, height: MID_TO - MID_FROM }}>
          <img src={building} alt="Жилой дом под строительным контролем" width={W} height={H} draggable={false}
            className="absolute left-0 block max-w-none select-none" style={{ top: -MID_FROM, width: W, height: H }} />
          <div className="absolute inset-0 flex items-center gap-3 px-5">
            {["СТРОИТЕЛЬНЫЙ КОНТРОЛЬ", "ТЕХНИЧЕСКИЙ АУДИТ"].map((l) => (
              <div key={l} className="flex h-20 flex-1 items-center justify-center border-2 border-foreground bg-background/80 p-2 text-center text-xs font-bold leading-tight tracking-wide backdrop-blur-sm">
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
