import { useEffect, useRef } from "react";
import {
  BUILDING_CRACKS,
  CRACK_HOVER_BOOST,
  CRACK_HOVER_BOOST_SECONDS,
  CRACK_START_Y,
  crackBoostedTipY,
} from "@/lib/building-cracks";

export function BuildingCracks() {
  const rectsRef = useRef<(SVGRectElement | null)[]>([]);

  useEffect(() => {
    const svg = rectsRef.current[0]?.ownerSVGElement;
    const host = svg?.parentElement;
    if (!svg || !host) return;

    const start = performance.now();
    let boost = 1;
    let boostFrom = 1;
    let boostTo = 1;
    let boostStart = 0;
    let hovering = false;
    let raf = 0;

    const onEnter = () => {
      hovering = true;
      boostFrom = boost;
      boostTo = boost * CRACK_HOVER_BOOST;
      boostStart = performance.now();
    };
    const onLeave = () => {
      hovering = false;
    };

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      if (hovering) {
        const t = Math.min(1, (now - boostStart) / (CRACK_HOVER_BOOST_SECONDS * 1000));
        boost = boostFrom + (boostTo - boostFrom) * t;
      }
      BUILDING_CRACKS.forEach(({ index }, i) => {
        const rect = rectsRef.current[i];
        if (!rect) return;
        const tip = crackBoostedTipY(index, elapsed, boost);
        rect.setAttribute("y", String(tip));
        rect.setAttribute("height", String(CRACK_START_Y - tip));
      });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    host.addEventListener("mouseenter", onEnter);
    host.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("mouseenter", onEnter);
      host.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <svg aria-hidden="true" className="building-cracks pointer-events-none absolute inset-0" width="760" height="623" viewBox="0 0 760 623">
      <defs>
        {BUILDING_CRACKS.map(({ index }) => (
          <clipPath key={index} id={`building-crack-reveal-${index}`}>
            <rect
              ref={(el) => {
                rectsRef.current[index] = el;
              }}
              x="0"
              y={CRACK_START_Y}
              width="760"
              height="0"
            />
          </clipPath>
        ))}
      </defs>
      {BUILDING_CRACKS.map(({ index, path }) => (
        <path key={index} data-crack={index} d={path} clipPath={`url(#building-crack-reveal-${index})`} />
      ))}
    </svg>
  );
}
