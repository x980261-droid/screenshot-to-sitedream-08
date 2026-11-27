import { buildingValueAt } from "@/lib/building-value";

export function BuildingValueCounter({ elapsedSeconds }: { elapsedSeconds: number }) {
  const value = buildingValueAt(elapsedSeconds);
  const price = value.price === 0 ? "0 ₽" : `${(value.price / 1_000_000).toFixed(2).replace(/0$/, "").replace(".", ",")} млн ₽`;
  return (
    <div data-building-value className="absolute bottom-1 right-4 z-20 max-w-[calc(100%-2rem)] text-foreground md:right-6">
      <div className="grid min-w-0 gap-x-5 gap-y-2 font-mono tabular-nums lg:grid-cols-[minmax(0,18rem)_auto]">
        <div className="min-w-0">
          <time data-value-date className="whitespace-nowrap text-lg md:text-xl" dateTime={`${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`}>
            {String(value.day).padStart(2, "0")}.{String(value.month).padStart(2, "0")}.{value.year}
          </time>
          <div data-value-status className="mt-1 min-h-10 text-sm md:text-base lg:min-h-12">
            {value.emergency
              ? <span className="font-semibold uppercase text-danger">Здание признано аварийным</span>
              : `Динамика деформаций ${value.deformationPercent}%`}
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-2 self-start">
          <span className="min-w-0 text-sm">Стоимость недвижимости</span>
          <div data-value-price className={`min-w-28 whitespace-nowrap text-right text-lg md:text-xl ${value.emergency ? "text-safe" : "text-foreground"}`}>{price}</div>
        </div>
      </div>
    </div>
  );
}