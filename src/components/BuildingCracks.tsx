import { useEffect, useRef } from "react";
import {
  BUILDING_CRACKS,
  CRACK_CENTER_X,
  CRACK_DURATION_SECONDS,
  CRACK_HOVER_WIDEN,
  CRACK_HOVER_WIDEN_SECONDS,
  CRACK_START_Y,
  CRACK_TOP_Y,
  crackStartSeconds,
} from "@/lib/building-cracks";

export function BuildingCracks() {
  const pathsRef = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    const svg = pathsRef.current[0]?.ownerSVGElement;
    if (!svg) return;
    // The building layer is pointer-events-none (only the signs are clickable),
    // so hover is tracked on the hero section against the building's on-screen rect.
    const section = svg.closest("section") ?? svg.parentElement;
    if (!section) return;

    let widen = 1;
    let widenFrom = 1;
    let widenTo = 1;
    let widenStart = 0;
    let hovering = false;
    let raf = 0;

    const onMove = (event: MouseEvent) => {
      const rect = svg.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= Math.max(0, rect.top) && event.clientY <= rect.bottom;
      if (inside && !hovering) {
        hovering = true;
        widenFrom = widen;
        widenTo = widen * CRACK_HOVER_WIDEN;
        widenStart = performance.now();
      } else if (!inside) {
        hovering = false;
      }
    };
    const onLeave = () => {
      hovering = false;
    };

    const tick = (now: number) => {
      if (hovering) {
        const t = Math.min(1, (now - widenStart) / (CRACK_HOVER_WIDEN_SECONDS * 1000));
        widen = widenFrom + (widenTo - widenFrom) * t;
      }
      BUILDING_CRACKS.forEach(({ index }, i) => {
        const path = pathsRef.current[i];
        if (!path) return;
        const cx = CRACK_CENTER_X[index] ?? 0;
        path.setAttribute("transform", `translate(${cx} 0) scale(${widen} 1) translate(${-cx} 0)`);
      });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    section.addEventListener("mousemove", onMove);
    section.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      section.removeEventListener("mousemove", onMove);
      section.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <svg aria-hidden="true" className="building-cracks pointer-events-none absolute inset-0" width="760" height="623" viewBox="0 0 760 623">
      <defs>
        {BUILDING_CRACKS.map(({ index }) => (
          <clipPath key={index} id={`building-crack-reveal-${index}`}>
            <rect x="0" y={CRACK_START_Y} width="760" height="0">
              <animate attributeName="y" from={CRACK_START_Y} to={CRACK_TOP_Y} begin={`${crackStartSeconds(index)}s`} dur={`${CRACK_DURATION_SECONDS}s`} fill="freeze" />
              <animate attributeName="height" from="0" to={CRACK_START_Y - CRACK_TOP_Y} begin={`${crackStartSeconds(index)}s`} dur={`${CRACK_DURATION_SECONDS}s`} fill="freeze" />
            </rect>
          </clipPath>
        ))}
      </defs>
      {BUILDING_CRACKS.map(({ index, path }) => (
        <path
          key={index}
          data-crack={index}
          d={path}
          clipPath={`url(#building-crack-reveal-${index})`}
          ref={(el) => {
            pathsRef.current[index] = el;
          }}
        />
      ))}
    </svg>
  );
}
