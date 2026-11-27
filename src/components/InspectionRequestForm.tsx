import { useCallback, useEffect, useState, type FormEvent } from "react";
import { addDays, endOfMonth, format, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BOOKING_SLOTS, isFullyBooked, isPastDay, takenOn, toDateKey, type BookingSlotId, type TakenSlot } from "@/lib/inspection-slots";

const btn = "inline-flex items-center justify-center bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-50";

export function InspectionRequestForm() {
  const [month, setMonth] = useState(() => new Date());
  const [taken, setTaken] = useState<TakenSlot[]>([]);
  const [date, setDate] = useState<Date | undefined>();
  const [slot, setSlot] = useState<BookingSlotId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState(false);

  const loadTaken = useCallback(async (m: Date) => {
    // include neighbouring-month days shown in the grid
    const from = addDays(startOfMonth(m), -7), to = addDays(endOfMonth(m), 14);
    const { data, error: loadError } = await supabase.rpc("get_taken_slots", { _from: toDateKey(from), _to: toDateKey(to) });
    setAvailabilityError(Boolean(loadError));
    if (!loadError) setTaken((data as TakenSlot[] | null) ?? []);
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

  const dayTaken = date ? takenOn(taken, toDateKey(date)) : [];
  useEffect(() => {
    if (date && slot && takenOn(taken, toDateKey(date)).includes(slot)) {
      setSlot(null);
      setError("Это время уже занято — выберите другое.");
    }
  }, [date, slot, taken]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!date || !slot || availabilityLoading || availabilityError || dayTaken.includes(slot)) return;
    setError(null);
    const f = new FormData(e.currentTarget);
    const address = String(f.get("address") ?? "").trim();
    const phone = String(f.get("phone") ?? "").trim();
    const client_name = String(f.get("client_name") ?? "").trim();
    if (address.length < 3) return setError("Укажите адрес дома.");
    if (!/^[\d\s()+-]{5,30}$/.test(phone)) return setError("Проверьте номер телефона.");
    if (!client_name) return setError("Укажите имя.");
    setSubmitting(true);
    const { error: err } = await supabase.from("bookings").insert({ date: toDateKey(date), slot, address, phone, client_name });
    setSubmitting(false);
    if (err) {
      setError(err.code === "23505" ? "Этот слот только что заняли — выберите другой." : "Не удалось записаться. Попробуйте ещё раз.");
      setSlot(null);
      void loadTaken(month);
      return;
    }
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
      <span className="block font-mono text-xs uppercase text-muted-foreground">Выберите дату приемки</span>
      <div className="grid gap-4 border bg-card p-4 sm:grid-cols-[auto_1fr]">
        <Calendar mode="single" locale={ru} month={month} onMonthChange={setMonth} selected={date}
          onSelect={(d) => { setDate(d); setSlot(null); setError(null); setAvailabilityLoading(true); void loadTaken(month); }}
          disabled={(d) => availabilityLoading || availabilityError || isPastDay(d) || isFullyBooked(taken, toDateKey(d))}
          modifiers={{ full: (d) => !isPastDay(d) && isFullyBooked(taken, toDateKey(d)) }}
          modifiersClassNames={{ full: "!text-destructive line-through" }}
          className="pointer-events-auto p-0" />
        <div>
          {!date ? (
            <p className="text-sm text-muted-foreground">Нажмите на свободную дату. Зачёркнутые красным — полностью заняты.</p>
          ) : (
            <>
              <p className="mb-3 text-sm">{format(date, "d MMMM, EEEE", { locale: ru })}</p>
              <div className="grid gap-2">
                {BOOKING_SLOTS.map((s) => {
                  const busy = dayTaken.includes(s.id);
                  return (
                    <Button key={s.id} variant="outline" type="button" disabled={busy || availabilityLoading || availabilityError} aria-pressed={slot === s.id} onClick={() => setSlot(s.id)}
                      className={`h-auto flex-col items-start whitespace-normal px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-40 ${slot === s.id ? "border-safe bg-safe/15" : "hover:border-safe"}`}>
                      <span className="block font-semibold">{s.label} <span className="font-mono text-sm font-normal">{s.hours}</span></span>
                      <span className="block text-xs text-muted-foreground">{busy ? "Занято" : s.note}</span>
                    </Button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      {availabilityError && <p role="alert" className="text-sm text-destructive">Не удалось проверить свободное время. <Button type="button" variant="link" onClick={() => { setAvailabilityLoading(true); void loadTaken(month); }}>Повторить</Button></p>}
      {date && slot && (
        <>
          {([["address", "Адрес дома", "text", 200], ["phone", "Номер телефона", "tel", 30], ["client_name", "Имя", "text", 100]] as const).map(([n, l, type, max]) => (
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
    </form>
  );
}
