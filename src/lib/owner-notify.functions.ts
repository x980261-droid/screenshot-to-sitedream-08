import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Notifies the owner about a submission the browser just inserted. Only the row id
// crosses the wire; content is read server-side and the recipient is fixed in the template.
export const notifyOwner = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ kind: z.enum(["booking", "documentation"]), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { sendOwnerNotification } = await import("./owner-notify.server");
    try {
      return await sendOwnerNotification(data.kind, data.id);
    } catch (error) {
      console.error("owner notification failed", error);
      return { sent: false as const };
    }
  });
