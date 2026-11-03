import { BUILDING_CRACKS, CRACK_DURATION_SECONDS, CRACK_START_Y, CRACK_TOP_Y, crackStartSeconds } from "@/lib/building-cracks";

export function BuildingCracks() {
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
        <path key={index} data-crack={index} d={path} clipPath={`url(#building-crack-reveal-${index})`} />
      ))}
    </svg>
  );
}
