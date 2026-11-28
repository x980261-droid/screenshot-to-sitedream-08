import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { applyBookingAction } from "@/lib/booking-action.functions";
import { BOOKING_SLOTS } from "@/lib/inspection-slots";

export const Route = createFileRoute("/booking-action")({
  validateSearch: (s: Record<string, unknown>) => ({ token: String(s["token"] ?? ""), action: String(s["action"] ?? "") }),
  head: () => ({ meta: [{ title: "Заявка на приёмку — действие секретаря" }, { name: "robots", content: "noindex" }] }),
  component: BookingActionPage,
});

type Result = Awaited<ReturnType<typeof applyBookingAction>>;

function BookingActionPage() {
  const { token, action } = Route.useSearch();
  const run = useServerFn(applyBookingAction);
  const [res, setRes] = useState<Result | null>(null);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    if (action !== "confirm" && action !== "reject") return setRes({ ok: false, error: "Неверная ссылка" });
    run({ data: { token, action } }).then(setRes).catch(() => setRes({ ok: false, error: "Неверная или устаревшая ссылка" }));
  }, [token, action, run]);

  let text = "Обрабатываю…";
  if (res && !res.ok) text = res.error;
  if (res && res.ok) {
    const [y, m, d] = res.date.split("-");
    const s = BOOKING_SLOTS.find((x) => x.id === res.slot);
    const what = `${res.name}, ${d}.${m}.${y}, ${s ? `${s.label} (${s.hours})` : res.slot}`;
    const label = res.status === "confirmed" ? "подтверждена — время закреплено и закрыто в календаре" : "отклонена — место в очереди освобождено";
    text = `${res.already ? "Заявка уже была обработана ранее: " : "Заявка "}${what} — ${label}.`;
  }
  return (
    <main className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="text-2xl font-semibold">Запись на приёмку</h1>
      <p role="status" className="mt-6">{text}</p>
      <Link to="/" className="mt-8 inline-block underline">На сайт</Link>
    </main>
  );
}
