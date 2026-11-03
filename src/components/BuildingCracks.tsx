import { useEffect, useRef } from "react";
import { BUILDING_CRACKS, CRACK_START_ORDER, CRACK_START_Y, crackCycleSeconds, crackTipY } from "@/lib/building-cracks";

export function BuildingCracks() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const clipsRef = useRef<(SVGRectElement | null)[]>([]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const resetClips = () => {
      clipsRef.current.forEach((rect) => {
        rect?.setAttribute("y", String(CRACK_START_Y));
        rect?.setAttribute("height", "0");
      });
    };
    resetClips();
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
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    // Restart the 30-second cycle from the beginning whenever the building
    // re-enters the viewport, so the animation is always fresh when visible.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          startedAt = performance.now();
          resetClips();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(svg);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [CRACK_START_ORDER]);

  return (
    <svg ref={svgRef} aria-hidden="true" className="building-cracks pointer-events-none absolute inset-0" width="760" height="623" viewBox="0 0 760 623">
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
      </defs>
      {BUILDING_CRACKS.map(({ index, path }) => (
        <path key={index} data-crack={index} d={path} clipPath={`url(#crack-clip-${index})`} />
      ))}
    </svg>
  );
}
