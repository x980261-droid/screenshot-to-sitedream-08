import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";
import { BOOKING_SLOTS } from "@/lib/inspection-slots";
import { DOCUMENTATION_SERVICES, DOCUMENTS_BUCKET } from "@/lib/documentation-order";

const FRESH_MS = 15 * 60 * 1000;
export type OwnerNotifyResult =
  | { sent: true; messageId: string; status?: string }
  | { sent: false; error: string };

function toNotifyResult(result: Awaited<ReturnType<typeof sendTemplateEmail>>): OwnerNotifyResult {
  return result.sent ? result : { sent: false, error: "Адрес получателя заблокирован почтовым сервисом (recipient_suppressed)" };
}

const isFresh = (createdAt: string) => Date.now() - new Date(createdAt).getTime() < FRESH_MS;

export async function sendOwnerNotification(kind: "booking" | "documentation", id: string): Promise<OwnerNotifyResult> {
  if (kind === "booking") {
    const { data: b } = await supabaseAdmin.from("bookings").select("*").eq("id", id).maybeSingle();
    if (!b) return { sent: false as const, error: "Заявка не найдена" };
    if (!isFresh(b.created_at)) return { sent: false as const, error: "Заявка старше 15 минут — уведомление не отправляется" };
    const s = BOOKING_SLOTS.find((x) => x.id === b.slot);
    const [y, m, d] = b.date.split("-");
    const result = await sendTemplateEmail("owner-new-request", "termin.info@yandex.ru", {
      idempotencyKey: `owner-new-request-booking-${b.id}`,
      templateData: {
        kind: "Запись на приёмку квартиры",
        name: b.client_name,
        rows: [
          { label: "Дата", value: `${d}.${m}.${y}, ${s ? `${s.label} (${s.hours})` : b.slot}` },
          { label: "Адрес", value: b.address },
          { label: "Телефон", value: b.phone },
          { label: "Имя", value: b.client_name },
        ],
      },
    });
    return toNotifyResult(result);
  }
  const { data: o } = await supabaseAdmin.from("documentation_orders").select("*").eq("id", id).maybeSingle();
  if (!o) return { sent: false as const, error: "Заказ не найден" };
  if (!isFresh(o.created_at)) return { sent: false as const, error: "Заказ старше 15 минут — уведомление не отправляется" };
  const files = (Array.isArray(o.files) ? o.files : []) as { name: string; path: string }[];
  const links = await Promise.all(files.map(async (f) => {
    const { data } = await supabaseAdmin.storage.from(DOCUMENTS_BUCKET).createSignedUrl(f.path, 60 * 60 * 24 * 7);
    return { label: `Файл ${f.name}`, value: data?.signedUrl ?? "ссылка недоступна — откройте в админке" };
  }));
  const result = await sendTemplateEmail("owner-new-request", "termin.info@yandex.ru", {
    idempotencyKey: `owner-new-request-documentation-${o.id}`,
    templateData: {
      kind: "Заказ проверки проектной документации",
      name: o.client_name,
      rows: [
        { label: "Услуга", value: DOCUMENTATION_SERVICES.find((x) => x.id === o.service)?.label ?? o.service },
        { label: "ЖК / ссылка / комментарий", value: o.project_description },
        { label: "Имя", value: o.client_name },
        { label: "Телефон", value: o.phone },
        ...links,
      ],
    },
  });
  return toNotifyResult(result);
}
