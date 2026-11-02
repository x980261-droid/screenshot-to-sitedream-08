import building from "@/assets/building.jpg";
import { useEffect, useRef, useState } from "react";

type Offset = { x: number; r: number; y: number };
const ZERO: Offset = { x: 0, r: 0, y: 0 };
const MAX_T = 25;
const MAX_R = 3;

const W = 380;
const H = 570;
function Slice({ from, to }: { from: number; to: number }) {
  return (
    <div className="relative overflow-hidden" style={{ height: to - from }}>
      <img src={building} alt="" width={W} height={H} draggable={false}
        className="absolute left-0 block max-w-none select-none" style={{ top: -from, width: W, height: H }} />
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
    <div ref={ref} className="relative mx-auto flex w-[380px] max-w-full flex-col overflow-visible">
      <div className="layer-move origin-bottom" style={t(top)}>
        <Slice from={0} to={245} />
      </div>
      <div className="relative z-10">
        <Slice from={245} to={353} />
        <div className="absolute inset-0 flex items-center gap-3 px-5">
          {["СТРОИТЕЛЬНЫЙ КОНТРОЛЬ", "ТЕХНИЧЕСКИЙ АУДИТ"].map((l) => (
            <div key={l} className="flex h-20 flex-1 items-center justify-center border-2 border-foreground bg-background/80 p-2 text-center text-xs font-bold leading-tight tracking-wide backdrop-blur-sm">
              {l}
            </div>
          ))}
        </div>
      </div>
      <div className="layer-move origin-top" style={t(bottom)}>
        <Slice from={353} to={H} />
      </div>
    </div>
  );
}
