import { useCallback, useEffect, useState, type FormEvent } from "react";
import { addDays, endOfMonth, format, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { notifyOwner } from "@/lib/owner-notify.functions";
import { BOOKING_SLOTS, CITIES, isCityDay, isDayClosed, isPastDay, slotState, toDateKey, type BookingSlotId, type CityId, type SlotQueue, type SlotState } from "@/lib/inspection-slots";

const STATE_STYLE: Record<SlotState, string> = {
  free: "border-white bg-white text-zinc-900",
  booked: "border-emerald-600 bg-emerald-600 text-white",
  rebooked: "border-red-600 bg-red-600 text-white",
  closed: "",
};
const STATE_NOTE: Record<SlotState, string> = {
  free: "Свободно. Вы записываетесь 1-м в очереди",
  booked: "Время предварительно забронировано. Вы записываетесь 2-м в очереди (резерв)",
  rebooked: "Повторная бронь. Вы записываетесь 3-м в очереди (финальный резерв)",
  closed: "Закрыто",
};

const btn = "inline-flex items-center justify-center bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-50";

export function InspectionRequestForm() {
  const [month, setMonth] = useState(() => new Date());
  const [taken, setTaken] = useState<SlotQueue[]>([]);
  const [city, setCity] = useState<CityId | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [slot, setSlot] = useState<BookingSlotId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState(false);
  const [consent, setConsent] = useState(false);

  const loadTaken = useCallback(async (m: Date) => {
    // include neighbouring-month days shown in the grid
    const from = addDays(startOfMonth(m), -7), to = addDays(endOfMonth(m), 14);
    const { data, error: loadError } = await supabase.rpc("get_slot_queue", { _from: toDateKey(from), _to: toDateKey(to) });
    setAvailabilityError(Boolean(loadError));
    if (!loadError) setTaken((data as SlotQueue[] | null) ?? []);
    setAvailabilityLoading(false);
  }, []);

  useEffect(() => {
    setAvailabilityLoading(true);
    void loadTaken(month);
    const refresh = () => { if (document.visibilityState === "visible") void loadTaken(month); };
    const timer = window.setInterval(refresh, 10000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [month, loadTaken]);

  const stateOf = (id: string) => (date ? slotState(taken, toDateKey(date), id) : "free");
  useEffect(() => {
    if (date && slot && slotState(taken, toDateKey(date), slot) === "closed") {
      setSlot(null);
      setError("Это время уже занято — выберите другое.");
    }
  }, [date, slot, taken]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!date || !slot || !city || availabilityLoading || availabilityError || stateOf(slot) === "closed") return;
    setError(null);
    if (!consent) return setError("Отметьте согласие с офертой, политикой конфиденциальности и обработкой данных.");
    const f = new FormData(e.currentTarget);
    const s0 = BOOKING_SLOTS.find((b) => b.id === slot);
    if (String(f.get("website") ?? "")) return setSent(`${format(date, "d MMMM yyyy", { locale: ru })}, ${s0?.label.toLowerCase()}`);
    const address = String(f.get("address") ?? "").trim();
    const phone = String(f.get("phone") ?? "").trim();
    const client_name = String(f.get("client_name") ?? "").trim();
    if (address.length < 3) return setError("Укажите название ЖК или адрес объекта.");
    if (!/^[\d\s()+-]{5,30}$/.test(phone)) return setError("Проверьте номер телефона.");
    if (!client_name) return setError("Укажите имя.");
    setSubmitting(true);
    const id = crypto.randomUUID();
    const { error: err } = await supabase.from("bookings").insert({ id, city, date: toDateKey(date), slot, address, phone, client_name });
    setSubmitting(false);
    if (err) {
      const msg = `${err.message ?? ""}`;
      setError(msg.includes("one_phone") ? "С этого телефона уже есть запись на это время." : msg.includes("SLOT_FULL") || err.code === "23505" ? "Очередь на это время только что заполнилась — выберите другое." : msg.includes("CITY_DAY") ? "В этот день выезд в выбранный город не проводится." : "Не удалось записаться. Попробуйте ещё раз.");
      setSlot(null);
      void loadTaken(month);
      return;
    }
    void notifyOwner({ data: { kind: "booking", id } }).catch(() => {});
    const s = BOOKING_SLOTS.find((b) => b.id === slot);
    if (!s) return;
    void loadTaken(month);
    setSent(`${format(date, "d MMMM yyyy", { locale: ru })}, ${s.label.toLowerCase()} (${s.hours})`);
  };

  if (sent) {
    return (
      <div className="mt-10 border-2 border-safe p-8 shadow-safe">
        <div className="font-semibold">Вы записаны.</div>
        <div className="mt-1 text-sm text-muted-foreground">Приемка: {sent}. Мы свяжемся с вами для подтверждения.</div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-10 grid gap-4 text-left">
      <span className="block font-mono text-xs uppercase text-muted-foreground">Город</span>
      <div className="grid gap-2 sm:grid-cols-3">
        {CITIES.map((c) => (
          <Button key={c.id} type="button" variant="outline" aria-pressed={city === c.id}
            onClick={() => { setCity(c.id); setDate(undefined); setSlot(null); setError(null); }}
            className={`h-auto py-4 text-base font-semibold ${city === c.id ? "border-safe bg-safe/15" : "hover:border-safe"}`}>{c.label}</Button>
        ))}
      </div>
      {!city && <p className="text-sm text-muted-foreground">Выберите город, чтобы открыть доступные даты</p>}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <span className="block font-mono text-xs uppercase text-muted-foreground">Выберите дату приемки</span>
      <div className="grid gap-4 border bg-card p-4 sm:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_11rem]">
        <Calendar mode="single" locale={ru} month={month} onMonthChange={setMonth} selected={date}
          onSelect={(d) => { setDate(d); setSlot(null); setError(null); setAvailabilityLoading(true); void loadTaken(month); }}
          disabled={(d) => !city || !isCityDay(city, d) || availabilityLoading || availabilityError || isPastDay(d) || isDayClosed(taken, toDateKey(d))}
          modifiers={{ full: (d) => !!city && isCityDay(city, d) && !isPastDay(d) && isDayClosed(taken, toDateKey(d)) }}
          modifiersClassNames={{ full: "!text-destructive line-through" }}
          className="pointer-events-auto p-0" />
        <div>
          {!date ? (
            <p className="text-sm text-muted-foreground">{city ? "Нажмите на доступную дату. Зачёркнутые красным — полностью заняты." : "Сначала выберите город."}</p>
          ) : (
            <>
              <p className="mb-3 text-sm">{format(date, "d MMMM, EEEE", { locale: ru })}</p>
              <div className="grid gap-2">
                {BOOKING_SLOTS.map((s) => {
                  const st = stateOf(s.id);
                  const busy = st === "closed";
                  return (
                    <Button key={s.id} variant="outline" type="button" disabled={busy || availabilityLoading || availabilityError} aria-pressed={slot === s.id} onClick={() => setSlot(s.id)}
                      className={`h-auto flex-col items-start whitespace-normal border-2 px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-40 ${STATE_STYLE[st]} ${slot === s.id ? "ring-3 ring-safe ring-offset-2 ring-offset-card" : ""}`}>
                      <span className="block font-semibold">{s.label} <span className="font-mono text-sm font-normal">{s.hours}</span></span>
                      <span className="block text-xs opacity-80">{STATE_NOTE[st]}</span>
                    </Button>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <aside aria-label="Пример: 25 декабря" className="pointer-events-none select-none border border-dashed p-3 text-xs sm:col-span-2 lg:col-span-1">
          <div className="mb-2 font-mono uppercase text-muted-foreground">Пример · 25 декабря</div>
          {([["border-white bg-white text-zinc-900", "Белый — Свободно (1-й в очереди)"], ["border-emerald-600 bg-emerald-600 text-white", "Зелёный — Забронировано (2-й в очереди — резерв)"], ["border-red-600 bg-red-600 text-white", "Красный — Повторная бронь (3-й в очереди — последний резерв)"]] as const).map(([c, t]) => (
            <div key={t} className={`mb-2 border-2 px-2 py-2 ${c}`}>{t}</div>
          ))}
        </aside>
      </div>
      {availabilityError && <p role="alert" className="text-sm text-destructive">Не удалось проверить свободное время. <Button type="button" variant="link" onClick={() => { setAvailabilityLoading(true); void loadTaken(month); }}>Повторить</Button></p>}
      {date && slot && (
        <>
          {([["address", "Название ЖК / адрес объекта", "text", 200], ["phone", "Номер телефона", "tel", 30], ["client_name", "Имя", "text", 100]] as const).map(([n, l, type, max]) => (
            <label key={n} className="block">
              <span className="mb-2 block font-mono text-xs uppercase text-muted-foreground">{l}</span>
              <input required name={n} type={type} maxLength={max}
                className="w-full border bg-card px-4 py-3 outline-none transition-colors focus:border-safe" />
            </label>
          ))}
        </>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {date && slot && (
        <Button type="submit" disabled={submitting || availabilityLoading || availabilityError} className={`${btn} mt-2 h-auto w-full`}>{submitting ? "Отправка…" : "Записаться"}</Button>
      )}
      {date && slot && <p className="text-xs text-muted-foreground">Секретарь созванивается с записавшимися строго в порядке очерёдности регистрации для финального подтверждения времени</p>}
      {date && (
        <div className={`flex items-start gap-3 border bg-card p-4 text-sm transition-colors ${error && !consent ? "border-danger" : "border-input"}`}>
          <Checkbox id="booking-consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)}
            className="mt-0.5 h-5 w-5 shrink-0 border-input data-[state=checked]:border-safe data-[state=checked]:bg-safe data-[state=checked]:text-primary-foreground" />
          <label htmlFor="booking-consent" className="cursor-pointer text-foreground">
            Принимаю условия{" "}
            <a href="/offer" className="font-semibold underline underline-offset-4 hover:text-accent">Публичная оферта</a>,{" "}
            <a href="/privacy" className="font-semibold underline underline-offset-4 hover:text-accent">Политика конфиденциальности</a>{" "}
            и согласен на обработку данных заказа.
          </label>
        </div>
      )}
    </form>
  );
}
