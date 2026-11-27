type Point = readonly [number, number, number];

function project([x, y, z]: Point) {
  return `${760 + (x - y) * 0.86},${510 + (x + y) * 0.34 - z}`;
}

function line(points: Point[]) {
  return points.map(project).join(" ");
}

function Duct({ origin: [x, y, z], size: [w, d, h] }: { origin: Point; size: Point }) {
  const a: Point = [x, y, z];
  const b: Point = [x + w, y, z];
  const c: Point = [x + w, y + d, z];
  const e: Point = [x, y + d, z];
  const top = ([px, py, pz]: Point): Point => [px, py, pz + h];
  return (
    <g>
      <polyline points={line([a, b, c, e, a])} />
      <polyline points={line([top(a), top(b), top(c), top(e), top(a)])} />
      {[a, b, c, e].map((p, i) => <polyline key={i} points={line([p, top(p)])} />)}
      {Array.from({ length: Math.floor(w / 45) }, (_, i) => (
        <polyline key={i} points={line([[x + i * 45, y, z], [x + i * 45, y, z + h], [x + i * 45, y + d, z + h], [x + i * 45, y + d, z]])} />
      ))}
    </g>
  );
}

export function EngineeringBlueprint() {
  return (
    <svg aria-hidden="true" viewBox="0 0 1520 1000" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full text-engineering-line opacity-25" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
      <g strokeWidth="0.6" opacity="0.6">
        {Array.from({ length: 21 }, (_, i) => {
          const n = -500 + i * 50;
          return <g key={i}><polyline points={line([[n, -500, 0], [n, 500, 0]])} /><polyline points={line([[-500, n, 0], [500, n, 0]])} /></g>;
        })}
      </g>
      {/* Three stacked service levels and structural risers. */}
      {[30, 230, 430].map((z) => (
        <g key={z}>
          <polyline points={line([[-430, -300, z], [430, -300, z], [430, 300, z], [-430, 300, z], [-430, -300, z]])} strokeWidth="0.8" />
          <Duct origin={[-390, -240, z + 45]} size={[730, 48, 34]} />
          <Duct origin={[-180, -192, z + 45]} size={[48, 380, 34]} />
          <Duct origin={[200, -192, z + 45]} size={[48, 380, 34]} />
          <Duct origin={[-340, 190, z + 15]} size={[170, 90, 70]} />
          <Duct origin={[120, 190, z + 15]} size={[130, 90, 70]} />
          {[0, 1, 2].map((j) => (
            <g key={j} strokeWidth="1.6">
              <polyline points={line([[-400, -110 + j * 26, z + 105], [370, -110 + j * 26, z + 105], [370, 240, z + 105], [290, 240, z + 105]])} />
              <polyline points={line([[-400, -102 + j * 26, z + 105], [362, -102 + j * 26, z + 105], [362, 232, z + 105], [290, 232, z + 105]])} />
              {[-280, -40, 170].map((x) => (
                <g key={x}>
                  <polyline points={line([[x, -110 + j * 26, z + 105], [x, 80, z + 105], [x, 80, z + 25]])} />
                  <polyline points={line([[x + 7, -110 + j * 26, z + 105], [x + 7, 87, z + 105], [x + 7, 87, z + 25]])} />
                  <polyline points={line([[x - 9, 30, z + 105], [x + 16, 30, z + 105]])} strokeWidth="3" />
                  <Duct origin={[x - 16, 64, z + 5]} size={[40, 40, 20]} />
                </g>
              ))}
            </g>
          ))}
          {[-300, 0, 300].map((x) => <polyline key={x} points={line([[x, -300, z], [x, -300, z + 180]])} />)}
        </g>
      ))}
      {[-350, 330].map((x) => (
        <g key={x} strokeWidth="2">
          <polyline points={line([[x, 160, 20], [x, 160, 585], [x, -230, 585]])} />
          <polyline points={line([[x + 12, 160, 20], [x + 12, 160, 597], [x + 12, -230, 597]])} />
          {[80, 180, 280, 380, 480].map((z) => <polyline key={z} points={line([[x - 8, 160, z], [x + 20, 160, z]])} strokeWidth="3" />)}
        </g>
      ))}
      <g strokeDasharray="6 6" strokeWidth="0.8">
        <polyline points={line([[-490, -350, 0], [-490, -350, 640]])} />
        <polyline points={line([[-490, -350, 0], [510, -350, 0]])} />
        <polyline points={line([[-490, -350, 0], [-490, 450, 0]])} />
      </g>
    </svg>
  );
}