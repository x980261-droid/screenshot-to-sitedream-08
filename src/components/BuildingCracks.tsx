import { useEffect, useRef } from "react";
import { BALCONY_CRACKS, BUILDING_CRACKS, CRACK_START_Y, balconyCrackTipY, crackTipY } from "@/lib/building-cracks";

export function BuildingCracks() {
  const clipsRef = useRef<(SVGRectElement | null)[]>([]);

  useEffect(() => {
    const startedAt = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = (now - startedAt) / 1000;
      BUILDING_CRACKS.forEach(({ index }) => {
        const rect = clipsRef.current[index];
        if (!rect) return;
        const tipY = crackTipY(index, elapsed);
        rect.setAttribute("y", String(tipY));
        rect.setAttribute("height", String(CRACK_START_Y - tipY));
      });
      BALCONY_CRACKS.forEach((crack) => {
        const rect = clipsRef.current[crack.index];
        if (!rect) return;
        const tipY = balconyCrackTipY(crack, elapsed);
        rect.setAttribute("y", String(tipY));
        rect.setAttribute("height", String(crack.startY - tipY));
      });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg aria-hidden="true" className="building-cracks pointer-events-none absolute inset-0" width="760" height="623" viewBox="0 0 760 623">
      <defs>
        {BUILDING_CRACKS.map(({ index }) => (
          <clipPath key={index} id={`crack-clip-${index}`}>
            <rect
              ref={(el) => {
                clipsRef.current[index] = el;
              }}
              x="0"
              y={CRACK_START_Y}
              width="760"
              height="0"
            />
          </clipPath>
        ))}
        {BALCONY_CRACKS.map((crack) => (
          <clipPath key={crack.index} id={`crack-clip-${crack.index}`}>
            <rect
              ref={(el) => {
                clipsRef.current[crack.index] = el;
              }}
              x="0"
              y={crack.startY}
              width="760"
              height="0"
            />
          </clipPath>
        ))}
      </defs>
      {BUILDING_CRACKS.map(({ index, path }) => (
        <path key={index} data-crack={index} d={path} clipPath={`url(#crack-clip-${index})`} />
      ))}
      {BALCONY_CRACKS.map((crack) => (
        <path key={crack.index} data-crack={crack.index} data-balcony-crack={crack.floor} d={crack.path} clipPath={`url(#crack-clip-${crack.index})`} />
      ))}
    </svg>
  );
}
