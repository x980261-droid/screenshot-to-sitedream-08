import { useEffect, useRef, useState } from "react";

type Offset = { x: number; r: number; y: number };
const ZERO: Offset = { x: 0, r: 0, y: 0 };
const MAX_T = 25;
const MAX_R = 3;

const ROW = "grid grid-cols-4 gap-2";
function Floors({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-2 px-6 py-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={ROW}>
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} className="h-6 bg-muted" />
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
    <div ref={ref} className="relative mx-auto flex w-full max-w-[380px] flex-col">
      <div className="layer-move origin-bottom bg-card pt-5" style={t(top)}>
        <Floors count={7} />
      </div>
      <div className="relative z-10 bg-card px-6 py-1">
        <div className={ROW}>
          <div className="col-span-2 flex h-[88px] items-center justify-center border-2 border-foreground p-2 text-center text-xs font-bold leading-tight tracking-wide">
            СТРОИТЕЛЬНЫЙ КОНТРОЛЬ
          </div>
          <div className="col-span-2 flex h-[88px] items-center justify-center border-2 border-foreground p-2 text-center text-xs font-bold leading-tight tracking-wide">
            ТЕХНИЧЕСКИЙ АУДИТ
          </div>
        </div>
      </div>
      <div className="layer-move origin-top bg-card pb-5" style={t(bottom)}>
        <Floors count={7} />
      </div>
    </div>
  );
}
