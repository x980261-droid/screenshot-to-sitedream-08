import { useEffect, useRef } from "react";
import {
  BUILDING_CRACKS,
  CRACK_CENTER_X,
  CRACK_DURATION_SECONDS,
  CRACK_START_Y,
  CRACK_TOP_Y,
  crackStartSeconds,
  crackWidthScale,
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
    let widenStart = 0;
    let hovering = false;
    let pointer: { x: number; y: number } | null = null;
    let raf = 0;

    const setHovering = (inside: boolean) => {
      if (inside === hovering) return;
      const now = performance.now();
      widen = crackWidthScale(widenFrom, hovering, (now - widenStart) / 1000);
      widenFrom = widen;
      widenStart = now;
      hovering = inside;
    };

    const checkPointer = () => {
      if (!pointer) return;
      const rect = svg.getBoundingClientRect();
      const visible = section.getBoundingClientRect();
      const inside =
        pointer.x >= Math.max(0, rect.left, visible.left) &&
        pointer.x <= Math.min(window.innerWidth, rect.right, visible.right) &&
        pointer.y >= Math.max(0, rect.top, visible.top) &&
        pointer.y <= Math.min(window.innerHeight, rect.bottom, visible.bottom);
      setHovering(inside);
    };
    const onMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      checkPointer();
    };
    const onLeave = () => {
      pointer = null;
      setHovering(false);
    };
    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) onLeave();
    };
    const onVisibility = () => {
      if (document.hidden) onLeave();
    };

    const tick = (now: number) => {
      widen = crackWidthScale(widenFrom, hovering, (now - widenStart) / 1000);
      BUILDING_CRACKS.forEach(({ index }, i) => {
        const path = pathsRef.current[i];
        if (!path) return;
        const cx = CRACK_CENTER_X[index] ?? 0;
        path.setAttribute("transform", `translate(${cx} 0) scale(${widen} 1) translate(${-cx} 0)`);
      });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerout", onPointerOut);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onLeave);
    window.addEventListener("scroll", checkPointer, true);
    window.addEventListener("resize", checkPointer);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("scroll", checkPointer, true);
      window.removeEventListener("resize", checkPointer);
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
