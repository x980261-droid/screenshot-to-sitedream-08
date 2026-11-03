import { useEffect, useRef } from "react";
import building from "@/assets/building-wide.jpg";
import { BALCONY_CRACKS, BUILDING_CRACKS, CRACK_START_Y, UPPER_FLOORS, balconyCrackTipY, crackCycleSeconds, crackTipY, floorOffsetY } from "@/lib/building-cracks";

export function BuildingCracks() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const clipsRef = useRef<(SVGRectElement | null)[]>([]);
  const floorsRef = useRef<(SVGGElement | null)[]>([]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;
    let startedAt = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = crackCycleSeconds((now - startedAt) / 1000);
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
      UPPER_FLOORS.forEach(({ floor }) => {
        floorsRef.current[floor]?.setAttribute("transform", `translate(0 ${floorOffsetY(floor, elapsed)})`);
      });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    // Restart the 30-second cycle from the beginning whenever the building
    // re-enters the viewport, so the animation is always fresh when visible.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          startedAt = performance.now();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(svg);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
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
        {UPPER_FLOORS.map(({ floor, topY, bottomY }) => (
          <clipPath key={floor} id={`floor-clip-${floor}`}>
            <rect x="0" y={topY} width="760" height={bottomY - topY} />
          </clipPath>
        ))}
        {BUILDING_CRACKS.map(({ index, path }) => (
          <path key={index} id={`crack-shape-${index}`} data-crack={index} d={path} clipPath={`url(#crack-clip-${index})`} />
        ))}
        {BALCONY_CRACKS.map((crack) => (
          <path key={crack.index} id={`crack-shape-${crack.index}`} data-crack={crack.index} data-balcony-crack={crack.floor} className="balcony-crack" d={crack.path} clipPath={`url(#crack-clip-${crack.index})`} />
        ))}
      </defs>
      {/* Let the original facade show through between moving slices instead of black bands. */}
      {UPPER_FLOORS.map(({ floor }) => (
        <g key={floor} data-moving-floor={floor} ref={(el) => { floorsRef.current[floor] = el; }}>
          <g clipPath={`url(#floor-clip-${floor})`}>
            <image href={building} x="0" y="0" width="760" height="623" preserveAspectRatio="none" />
            {BUILDING_CRACKS.map(({ index }) => <use key={index} href={`#crack-shape-${index}`} />)}
            {BALCONY_CRACKS.map(({ index }) => <use key={index} href={`#crack-shape-${index}`} />)}
          </g>
        </g>
      ))}
    </svg>
  );
}
