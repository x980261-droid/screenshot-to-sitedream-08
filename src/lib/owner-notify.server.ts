import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendOwnerMail } from "@/lib/yandex-mail.server";
import { BOOKING_SLOTS, CITIES } from "@/lib/inspection-slots";
import { DOCUMENTATION_SERVICES, DOCUMENTS_BUCKET } from "@/lib/documentation-order";

const FRESH_MS = 15 * 60 * 1000;
export type OwnerNotifyResult =
  | { sent: true; messageId: string; status?: string }
  | { sent: false; error: string };


const isFresh = (createdAt: string) => Date.now() - new Date(createdAt).getTime() < FRESH_MS;

export async function sendOwnerNotification(kind: "booking" | "documentation", id: string, baseUrl = "https://screenshot-to-sitedream-08.lovable.app"): Promise<OwnerNotifyResult> {
  if (kind === "booking") {
    const { data: b } = await supabaseAdmin.from("bookings").select("*").eq("id", id).maybeSingle();
    if (!b) return { sent: false as const, error: "Заявка не найдена" };
    if (!isFresh(b.created_at)) return { sent: false as const, error: "Заявка старше 15 минут — уведомление не отправляется" };
    const s = BOOKING_SLOTS.find((x) => x.id === b.slot);
    const [y, m, d] = b.date.split("-");
    const city = CITIES.find((c) => c.id === b.city)?.label ?? "Город не указан";
    const time = s ? `${s.label} (${s.hours})` : b.slot;
    const q = b.queue_position ?? 1;
    const link = (action: string) => `${baseUrl}/booking-action?token=${b.action_token}&action=${action}`;
    const messageId = await sendOwnerMail("Запись на приёмку квартиры", b.client_name, [
          { label: "Очередь", value: `${q}-й в очереди` },
          { label: "Город", value: city },
          { label: "Дата", value: `${d}.${m}.${y}, ${time}` },
          { label: "ЖК / адрес объекта", value: b.address },
          { label: "Телефон", value: b.phone },
          { label: "Имя", value: b.client_name },
          { label: "Комментарий", value: b.comment || "—" },
        ], {
          subject: `[${q}-й в очереди] ${city}, ${d}.${m}.${y}, ${time} — ${b.client_name}`,
          actions: [
            { label: "Подтвердить бронь (закрепить время)", url: link("confirm"), color: "#15803d" },
            { label: "Отклонить / Не дозвонились", url: link("reject"), color: "#b91c1c" },
          ],
        });
    return { sent: true, messageId };
  }
  const { data: o } = await supabaseAdmin.from("documentation_orders").select("*").eq("id", id).maybeSingle();
  if (!o) return { sent: false as const, error: "Заказ не найден" };
  if (!isFresh(o.created_at)) return { sent: false as const, error: "Заказ старше 15 минут — уведомление не отправляется" };
  const files = (Array.isArray(o.files) ? o.files : []) as { name: string; path: string }[];
  const links = await Promise.all(files.map(async (f) => {
    const { data } = await supabaseAdmin.storage.from(DOCUMENTS_BUCKET).createSignedUrl(f.path, 60 * 60 * 24 * 7);
    return { label: `Файл ${f.name}`, value: data?.signedUrl ?? "ссылка недоступна — откройте в админке" };
  }));
  const messageId = await sendOwnerMail("Заказ проверки проектной документации", o.client_name, [
        { label: "Услуга", value: DOCUMENTATION_SERVICES.find((x) => x.id === o.service)?.label ?? o.service },
        { label: "ЖК / ссылка / комментарий", value: o.project_description },
        { label: "Имя", value: o.client_name },
        { label: "Телефон", value: o.phone },
        { label: "Комментарий", value: o.comment || "—" },
        ...links,
      ]);
    return { sent: true, messageId };
}
