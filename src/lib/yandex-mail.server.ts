
// Owner notifications go straight through Yandex SMTP; sender and recipient are fixed.
export const OWNER_MAILBOX = "termin.info@yandex.ru";

export type MailRow = { label: string; value: string };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type MailAction = { label: string; url: string; color: string };
export type MailOptions = { subject?: string; actions?: MailAction[] };

export function buildOwnerMail(kind: string, name: string, rows: MailRow[], opts: MailOptions = {}) {
  const actions = opts.actions ?? [];
  return {
    from: { name: "Термин", address: OWNER_MAILBOX },
    to: OWNER_MAILBOX,
    subject: opts.subject ?? `${kind} — ${name || "сайт Термин"}`,
    text: [kind, "", ...rows.map((r) => `${r.label}: ${r.value}`), "", ...actions.map((a) => `${a.label}: ${a.url}`)].join("\n"),
    html: `<h2>${esc(kind)}</h2>${rows.map((r) => `<p><b>${esc(r.label)}:</b> ${esc(r.value)}</p>`).join("")}${actions.length ? `<p style="margin-top:24px">${actions.map((a) => `<a href="${esc(a.url)}" style="display:inline-block;margin:0 8px 8px 0;padding:12px 20px;background:${a.color};color:#fff;text-decoration:none;font-weight:bold;border-radius:4px">${esc(a.label)}</a>`).join("")}</p>` : ""}`,
  };
}

export async function sendOwnerMail(kind: string, name: string, rows: MailRow[], opts: MailOptions = {}): Promise<string> {
  const pass = process.env["YANDEX_SMTP_PASS"];
  if (!pass) throw new Error("YANDEX_SMTP_PASS is not configured");
  const { WorkerMailer } = await import("worker-mailer");
  const m = buildOwnerMail(kind, name, rows, opts);
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
