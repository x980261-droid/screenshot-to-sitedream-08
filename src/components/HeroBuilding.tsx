import { useEffect, useRef, useState } from "react";

type Offset = { x: number; r: number; y: number };
const ZERO: Offset = { x: 0, r: 0, y: 0 };
const MAX_T = 25;
const MAX_R = 3;

function Floors({ count, windows = 4 }: { count: number; windows?: number }) {
  return (
    <div className="flex h-full flex-col justify-evenly gap-2 px-6 py-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex justify-between gap-2">
          {Array.from({ length: windows }).map((_, j) => (
            <div key={j} className="h-6 flex-1 border border-slate/50 bg-muted" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function HeroBuilding() {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState<Offset>(ZERO);
  const [bottom, setBottom] = useState<Offset>(ZERO);

  useEffect(() => {
    const desktop = window.matchMedia("(hover: hover) and (min-width: 1024px)");

    const onMove = (e: MouseEvent) => {
      if (!desktop.matches) return;
      const nx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1));
      const ny = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1));
      setTop({ x: nx * MAX_T, y: -Math.abs(ny) * 6, r: nx * MAX_R });
      setBottom({ x: -nx * MAX_T, y: Math.abs(ny) * 6, r: -nx * MAX_R });
    };
    const onLeave = () => {
      if (!desktop.matches) return;
      setTop(ZERO);
      setBottom(ZERO);
    };
    const onScroll = () => {
      if (desktop.matches) return;
      const el = ref.current;
      if (!el) return;
      const p = Math.max(0, Math.min(1, window.scrollY / (el.getBoundingClientRect().height + 200)));
      setTop({ x: -p * MAX_T, y: 0, r: -p * 1.5 });
      setBottom({ x: p * MAX_T, y: 0, r: p * 1.5 });
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

  const t = (o: Offset) => ({ transform: `translate(${o.x}px, ${o.y}px) rotate(${o.r}deg)` });

  return (
    <div ref={ref} className="relative mx-auto flex h-[580px] w-full max-w-[380px] flex-col">
      {/* Top layer */}
      <div className="layer-move relative flex-[1.3] origin-bottom" style={t(top)}>
        <div className="mx-auto h-4 w-1/3 border border-b-0 border-slate/60 bg-card" />
        <div className="h-[calc(100%-1rem)] border border-slate/60 bg-card">
          <Floors count={4} />
        </div>
      </div>

      {/* Middle — controlled floor, never moves */}
      <div className="relative z-10 flex flex-1 items-center gap-3 border-2 border-safe bg-background px-4 shadow-safe">
        <span className="absolute -top-3 left-3 bg-background px-2 font-mono text-[10px] tracking-widest text-safe">
          ● ЭТАЖ ПОД КОНТРОЛЕМ
        </span>
        <div className="flex h-24 flex-1 items-center justify-center border-2 border-foreground p-2 text-center text-xs font-bold leading-tight tracking-wide">
          СТРОИТЕЛЬНЫЙ КОНТРОЛЬ
        </div>
        <div className="flex h-24 flex-1 items-center justify-center border-2 border-foreground p-2 text-center text-xs font-bold leading-tight tracking-wide">
          ТЕХНИЧЕСКИЙ АУДИТ
        </div>
      </div>

      {/* Bottom layer */}
      <div className="layer-move relative flex-[1.1] origin-top" style={t(bottom)}>
        <div className="h-1/2 border border-slate/60 bg-card">
          <Floors count={2} />
        </div>
        <div className="h-1/2 border border-t-0 border-slate/60 bg-muted bg-blueprint">
          <div className="flex h-full items-end justify-between px-4 pb-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-3/4 w-3 border border-slate/60 bg-secondary" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
