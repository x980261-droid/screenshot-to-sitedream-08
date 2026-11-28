import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { ru } from "date-fns/locale";
import { CITIES, BOOKING_SLOTS, isFullyBooked, isPastDay, takenOn, toDateKey } from "@/lib/inspection-slots";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Панель администратора — заявки на приемку" },
      { name: "description", content: "Закрытая панель: заявки и блокировка дат." },
      { property: "og:title", content: "Панель администратора" },
      { property: "og:description", content: "Закрытая панель управления заявками." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Booking = { id: string; date: string; slot: string; address: string; phone: string; client_name: string; city: string | null; queue_position: number | null; status: string };
const STATUS: Record<string, string> = { pending: "Ожидает", confirmed: "Подтверждена", rejected: "Отклонена" };
type Block = { id: string; date: string; slot: string | null };
const slotLabel = (s: string | null) => (s ? BOOKING_SLOTS.find((b) => b.id === s)?.label ?? s : "Весь день");
const fmt = (d: string) => d.split("-").reverse().join(".");

function AdminPage() {
  const [state, setState] = useState<"loading" | "guest" | "denied" | "admin">("loading");
  const check = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return setState("guest");
    const { data: ok } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
    setState(ok ? "admin" : "denied");
  }, []);
  useEffect(() => {
    void check();
    const { data } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN" || e === "SIGNED_OUT") void check();
    });
    return () => data.subscription.unsubscribe();
  }, [check]);

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Панель администратора</h1>
          {state !== "guest" && state !== "loading" && (
            <Button variant="outline" onClick={() => supabase.auth.signOut()}>Выйти</Button>
          )}
        </div>
        {state === "loading" && <p className="text-muted-foreground">Загрузка…</p>}
        {state === "guest" && <SignIn />}
        {state === "denied" && <p className="text-muted-foreground">У этой учётной записи нет прав администратора.</p>}
        {state === "admin" && <Dashboard />}
      </div>
    </main>
  );
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const submit = async (mode: "in" | "up") => {
    setMsg("");
    const r = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    if (r.error) setMsg(r.error.message);
    else if (mode === "up" && !r.data.session) setMsg("Проверьте почту и подтвердите регистрацию.");
  };
  return (
    <form className="max-w-sm space-y-3" onSubmit={(e) => { e.preventDefault(); void submit("in"); }}>
      <Input type="email" placeholder="Почта" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      <div className="flex gap-2">
        <Button type="submit">Войти</Button>
        <Button type="button" variant="outline" onClick={() => void submit("up")}>Регистрация</Button>
      </div>
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
    </form>
  );
}

function Dashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [day, setDay] = useState<Date | undefined>();
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const taken = [...bookings.filter((b) => b.status !== "rejected"), ...blocks.flatMap((b) => b.slot ? [{ date: b.date, slot: b.slot }] : BOOKING_SLOTS.map((s) => ({ date: b.date, slot: s.id })))];
  const dayTaken = day ? takenOn(taken, toDateKey(day)) : [];
  const load = useCallback(async () => {
    const [b, bl] = await Promise.all([
      supabase.from("bookings").select("id,date,slot,address,phone,client_name,city,queue_position,status").order("date").order("slot", { ascending: false }),
      supabase.from("blocked_slots").select("id,date,slot").order("date"),
    ]);
    if (b.error || bl.error) setErr("Не удалось загрузить заявки или блокировки. Обновите страницу.");
    setBookings(b.data ?? []);
    setBlocks(bl.data ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const block = async (slot: string | null) => {
    if (!day || saving) return;
    setErr("");
    setSaving(true);
    const { error } = await supabase.from("blocked_slots").insert({ date: toDateKey(day), slot });
    if (error) setErr(error.code === "23505" ? "Уже заблокировано." : error.message);
    await load();
    setSaving(false);
  };
  const unblock = async (id: string) => {
    setErr("");
    const { error } = await supabase.from("blocked_slots").delete().eq("id", id);
    if (error) setErr("Не удалось снять блокировку.");
    await load();
  };

  return (
    <div className="space-y-12">
      <section>
        <h2 className="mb-4 text-lg font-semibold">Заявки ({bookings.length})</h2>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>{["Дата", "Слот", "Город", "Очередь", "Статус", "ЖК / адрес", "Телефон", "Имя"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="px-3 py-2 whitespace-nowrap">{fmt(b.date)}</td>
                  <td className="px-3 py-2">{slotLabel(b.slot)}</td>
                  <td className="px-3 py-2">{CITIES.find((c) => c.id === b.city)?.label ?? "—"}</td>
                  <td className="px-3 py-2">{b.queue_position ?? "—"}</td>
                  <td className="px-3 py-2">{STATUS[b.status] ?? b.status}</td>
                  <td className="px-3 py-2">{b.address}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{b.phone}</td>
                  <td className="px-3 py-2">{b.client_name}</td>
                </tr>
              ))}
              {bookings.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Заявок пока нет</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-semibold">Заблокировать дату или слот</h2>
          <Calendar mode="single" locale={ru} selected={day} onSelect={setDay} disabled={isPastDay}
            modifiers={{ full: (d) => isFullyBooked(taken, toDateKey(d)) }} modifiersClassNames={{ full: "text-destructive line-through" }} className="rounded-md border border-border" />
          {day && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button disabled={saving || BOOKING_SLOTS.every((s) => dayTaken.includes(s.id))} onClick={() => void block(null)}>Весь день</Button>
              {BOOKING_SLOTS.map((s) => <Button key={s.id} disabled={saving || dayTaken.includes(s.id)} variant="outline" onClick={() => void block(s.id)}>{s.label}{dayTaken.includes(s.id) ? " — Занято" : ""}</Button>)}
            </div>
          )}
          {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold">Блокировки</h2>
          <ul className="space-y-2">
            {blocks.map((b) => (
              <li key={b.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span>{fmt(b.date)} — {slotLabel(b.slot)}</span>
                <Button size="sm" variant="ghost" onClick={() => void unblock(b.id)}>Снять</Button>
              </li>
            ))}
            {blocks.length === 0 && <li className="text-sm text-muted-foreground">Нет блокировок</li>}
          </ul>
        </div>
      </section>
    </div>
  );
}
