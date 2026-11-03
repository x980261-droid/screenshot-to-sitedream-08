import { buildingValueAt } from "@/lib/building-value";

export function BuildingValueCounter({ elapsedSeconds }: { elapsedSeconds: number }) {
  const value = buildingValueAt(elapsedSeconds);
  const price = value.price === 0 ? "0 ₽" : `${(value.price / 1_000_000).toFixed(2).replace(/0$/, "").replace(".", ",")} млн ₽`;
  return (
    <div data-building-value className="absolute bottom-4 right-4 z-20 w-[300px] max-w-[calc(100%-2rem)] border-t border-foreground/40 bg-background/85 px-4 py-3 text-foreground backdrop-blur-sm md:bottom-6 md:right-6 md:w-[390px]">
      <div className="grid grid-cols-[1fr_1.1fr] items-end gap-4 font-mono tabular-nums">
        <div>
          <div className="mb-1 text-[10px] uppercase text-muted-foreground">День · месяц · год</div>
          <time data-value-date className="whitespace-nowrap text-lg md:text-xl" dateTime={`${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`}>
            {String(value.day).padStart(2, "0")}.{String(value.month).padStart(2, "0")}.{value.year}
          </time>
        </div>
        <div className="border-l pl-4">
          <div className="mb-1 text-[10px] uppercase text-muted-foreground">Цена квартиры</div>
          <div data-value-price className={`whitespace-nowrap text-lg md:text-xl ${value.emergency ? "text-safe" : "text-foreground"}`}>{price}</div>
        </div>
      </div>
      <div data-value-status className="mt-2 h-5 text-right text-sm font-semibold uppercase text-safe">{value.emergency ? "Дом аварийный" : ""}</div>
    </div>
  );
}