import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Secretary one-click action from the owner email; the unguessable per-booking token is the credential.
export const applyBookingAction = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string().uuid(), action: z.enum(["confirm", "reject"]) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: b } = await supabaseAdmin.from("bookings").select("id,status,date,slot,client_name").eq("action_token", data.token).maybeSingle();
    if (!b) return { ok: false as const, error: "Заявка не найдена" as string };
    if (b.status !== "pending") return { ok: true as const, status: b.status, already: true, date: b.date, slot: b.slot, name: b.client_name };
    const status = data.action === "confirm" ? "confirmed" : "rejected";
    const { error } = await supabaseAdmin.from("bookings").update({ status }).eq("id", b.id).eq("status", "pending");
    if (error) return { ok: false as const, error: "Не удалось обновить заявку" as string };
    return { ok: true as const, status, already: false, date: b.date, slot: b.slot, name: b.client_name };
  });
