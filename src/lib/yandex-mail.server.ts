
// Owner notifications go straight through Yandex SMTP; sender and recipient are fixed.
export const OWNER_MAILBOX = "termin.info@yandex.ru";

export type MailRow = { label: string; value: string };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function buildOwnerMail(kind: string, name: string, rows: MailRow[]) {
  return {
    from: { name: "Термин", address: OWNER_MAILBOX },
    to: OWNER_MAILBOX,
    subject: `${kind} — ${name || "сайт Термин"}`,
    text: [kind, "", ...rows.map((r) => `${r.label}: ${r.value}`)].join("\n"),
    html: `<h2>${esc(kind)}</h2>${rows.map((r) => `<p><b>${esc(r.label)}:</b> ${esc(r.value)}</p>`).join("")}`,
  };
}

export async function sendOwnerMail(kind: string, name: string, rows: MailRow[]): Promise<string> {
  const pass = process.env["YANDEX_SMTP_PASS"];
  if (!pass) throw new Error("YANDEX_SMTP_PASS is not configured");
  const { WorkerMailer } = await import("worker-mailer");
  const m = buildOwnerMail(kind, name, rows);
  const mailer = await WorkerMailer.connect({
    credentials: { username: OWNER_MAILBOX, password: pass },
    authType: "login",
    host: "smtp.yandex.ru",
    port: 465,
    secure: true,
  });
  try {
    await mailer.send({ from: { name: m.from.name, email: m.from.address }, to: { email: m.to }, subject: m.subject, text: m.text, html: m.html });
  } finally {
    await mailer.close().catch(() => {});
  }
  return `smtp.yandex.ru:${Date.now()}`;
}
