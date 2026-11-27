import { useEffect, useState, type FormEvent } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { isPastDay, slotStates, toDateKey } from "@/lib/inspection-slots";

const btn = "inline-flex items-center justify-center bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-50";

export function InspectionRequestForm() {
  const [sent, setSent] = useState<{ date: string; time: string } | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | null>(null);
  const [booked, setBooked] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadBooked = async (d: Date) => {
    setLoadingSlots(true);
    const { data } = await supabase.rpc("get_booked_slots", { _date: toDateKey(d) });
    setBooked((data as string[] | null) ?? []);
    setLoadingSlots(false);
  };

  useEffect(() => {
    setTime(null);
    if (date) void loadBooked(date);
  }, [date]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!date || !time) { setError("Выберите дату и время осмотра."); return; }
    const f = new FormData(e.currentTarget);
    setSubmitting(true);
    const { error: err } = await supabase.from("inspection_requests").insert({
      name: String(f.get("name") ?? "").trim(),
      phone: String(f.get("phone") ?? "").trim(),
      object: String(f.get("object") ?? "").trim(),
      inspection_date: toDateKey(date),
      inspection_time: time,
    });
    setSubmitting(false);
    if (err) {
      if (err.code === "23505") {
        setError("Это время уже занято — выберите другое.");
        void loadBooked(date);
      } else setError("Не удалось отправить заявку. Попробуйте ещё раз.");
      return;
    }
    setSent({ date: format(date, "d MMMM yyyy", { locale: ru }), time });
  };

  if (sent) {
    return (
      <div className="mt-10 border-2 border-safe p-8 shadow-safe">
        <div className="font-semibold">Запрос принят.</div>
        <div className="mt-1 text-sm text-muted-foreground">Осмотр: {sent.date}, {sent.time}. Мы свяжемся с вами для подтверждения.</div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-10 grid gap-4 text-left">
      {[["name", "Имя", "text"], ["phone", "Телефон", "tel"], ["object", "Объект", "text"]].map(([n, l, type]) => (
        <label key={n} className="block">
          <span className="mb-2 block font-mono text-xs uppercase text-muted-foreground">{l}</span>
          <input required name={n} type={type} maxLength={120}
            className="w-full border bg-card px-4 py-3 outline-none transition-colors focus:border-safe" />
        </label>
      ))}
      <div>
        <span className="mb-2 block font-mono text-xs uppercase text-muted-foreground">Дата и время осмотра</span>
        <div className="grid gap-4 border bg-card p-4 sm:grid-cols-[auto_1fr]">
          <Calendar mode="single" locale={ru} selected={date} onSelect={setDate}
            disabled={(d) => isPastDay(d)} className="pointer-events-auto p-0" />
          <div>
            {!date ? (
              <p className="text-sm text-muted-foreground">Выберите дату в календаре.</p>
            ) : (
              <>
                <p className="mb-3 text-sm">{format(date, "d MMMM, EEEE", { locale: ru })}</p>
                <div className="grid grid-cols-2 gap-2">
                  {slotStates(booked).map((s) => (
                    <button key={s.time} type="button" disabled={s.booked || loadingSlots}
                      aria-pressed={time === s.time} onClick={() => setTime(s.time)}
                      className={`border px-4 py-3 font-mono text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${time === s.time ? "border-safe bg-safe/15" : "hover:border-safe"}`}>
                      {s.time}
                      {s.booked && <span className="block text-[10px] uppercase">занято</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={submitting} className={`${btn} mt-2 w-full`}>
        {submitting ? "Отправка…" : "Отправить запрос"}
      </button>
    </form>
  );
}
