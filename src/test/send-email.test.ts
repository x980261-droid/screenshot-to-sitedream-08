import { afterAll, beforeEach, expect, it, vi } from "vitest";

const { sendLovableEmail } = vi.hoisted(() => ({
  sendLovableEmail: vi.fn(async (_payload: Record<string, unknown>, _options: Record<string, unknown>) => ({ success: true, send_id: "msg-123", status: "queued" } as Record<string, unknown>)),
}));

vi.mock("@lovable.dev/email-js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@lovable.dev/email-js")>();
  return { ...actual, sendLovableEmail };
});
vi.mock("@react-email/render", () => ({
  render: vi.fn(async (_element: unknown, options?: { plainText?: boolean }) => options?.plainText ? "Текст письма" : "<p>Письмо</p>"),
}));

import { sendTemplateEmail } from "@/lib/email-templates/send-email";

const originalApiKey = process.env["LOVABLE_API_KEY"];

beforeEach(() => {
  process.env["LOVABLE_API_KEY"] = "test-api-key";
  sendLovableEmail.mockClear();
});

afterAll(() => {
  if (originalApiKey === undefined) delete process.env["LOVABLE_API_KEY"];
  else process.env["LOVABLE_API_KEY"] = originalApiKey;
});

async function sendOwnerEmail() {
  await sendTemplateEmail("owner-new-request", "visitor@example.com", {
    idempotencyKey: "test-request",
    templateData: { kind: "Новая заявка", name: "Иван", rows: [] },
  });
}

it("uses noreply@notify.termin-expert.pro as the visible sender and the verified delegated domain for sending", async () => {
  await sendOwnerEmail();
  const payload = sendLovableEmail.mock.calls[0]?.[0];
  expect(payload).toMatchObject({
    from: { name: "Термин", address: "noreply@notify.termin-expert.pro" },
    sender_domain: "notify.termin-expert.pro",
  });
});

it("always delivers the owner template to termin.info@yandex.ru instead of a caller-provided address", async () => {
  await sendOwnerEmail();
  const payload = sendLovableEmail.mock.calls[0]?.[0];
  expect(payload).toMatchObject({ to: "termin.info@yandex.ru" });
  expect(payload?.["to"]).not.toBe("visitor@example.com");
});

it("returns the gateway message id when the email is accepted", async () => {
  const result = await sendTemplateEmail("owner-new-request", "termin.info@yandex.ru", {
    templateData: { kind: "Новая заявка", name: "Иван", rows: [] },
  });
  expect(result).toEqual({ sent: true, messageId: "msg-123", status: "queued" });
});

it("throws instead of reporting sent when the gateway returns no message id", async () => {
  sendLovableEmail.mockResolvedValueOnce({ success: false });
  await expect(sendOwnerEmail()).rejects.toThrow("did not accept");
});
