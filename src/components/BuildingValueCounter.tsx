import { buildingValueAt, lifeAgeLabel } from "@/lib/building-value";

export function BuildingValueCounter({ elapsedSeconds }: { elapsedSeconds: number }) {
  const value = buildingValueAt(elapsedSeconds);
  const price = value.price === 0 ? "0 ₽" : `${(value.price / 1_000_000).toFixed(2).replace(/0$/, "").replace(".", ",")} млн ₽`;
  return (
    <div data-building-value className="absolute bottom-24 right-4 z-20 max-w-[calc(100%-2rem)] text-foreground md:bottom-6 md:right-6">
      <div className="flex flex-wrap justify-end gap-x-5 gap-y-1 font-mono tabular-nums">
        <div>
          <time data-value-date className="whitespace-nowrap text-lg md:text-xl" dateTime={`${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`}>
            {String(value.day).padStart(2, "0")}.{String(value.month).padStart(2, "0")}.{value.year}
          </time>
        </div>
        <div className="flex flex-wrap items-baseline justify-end gap-x-2 gap-y-1">
          <span className="text-sm">Стоимость недвижимости</span>
          <div data-value-price className={`whitespace-nowrap text-lg md:text-xl ${value.emergency ? "text-safe" : "text-foreground"}`}>{price}</div>
        </div>
        <div className="flex flex-wrap items-baseline justify-end gap-x-2 gap-y-1">
          <span className="text-sm">Возраст</span>
          <div data-value-age className="whitespace-nowrap text-lg md:text-xl">{lifeAgeLabel(value.ageYears)}</div>
        </div>
      </div>
      <div data-value-status className="mt-2 h-5 text-right text-sm font-semibold uppercase text-safe">{value.emergency ? "Дом аварийный" : ""}</div>
    </div>
  );
}