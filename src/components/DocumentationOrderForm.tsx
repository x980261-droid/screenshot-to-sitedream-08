import { useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { FileText, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { notifyOwner } from "@/lib/owner-notify.functions";
import { DOCUMENTATION_SERVICES, DOCUMENTS_BUCKET, documentationOrderSchema, documentExtension, validateDocuments } from "@/lib/documentation-order";

const field = "w-full border border-input bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-safe";
const caption = "mb-2 block font-mono text-xs uppercase text-muted-foreground";

export function DocumentationOrderForm() {
  const input = useRef<HTMLInputElement>(null);
  const [service, setService] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  // Keep uploaded paths on retry rather than uploading the same documents twice.
  const pending = useRef<{ id: string; uploads: Map<File, string> } | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    if (!consent) {
      setError("Отметьте согласие с офертой, политикой конфиденциальности и обработкой данных.");
      return;
    }
    const form = new FormData(e.currentTarget);
    const result = documentationOrderSchema.safeParse({ service, project_description: form.get("project_description"), client_name: form.get("client_name"), phone: form.get("phone"), comment: form.get("comment") ?? "", consent });
    if (!result.success) { setError(result.error.issues[0]?.message ?? "Проверьте поля формы."); return; }
    const fileError = validateDocuments(files);
    if (fileError) { setError(fileError); return; }
    setSubmitting(true);
    try {
      const order = pending.current ?? { id: crypto.randomUUID(), uploads: new Map<File, string>() };
      pending.current = order;
      const attachments: { name: string; path: string }[] = [];
      for (const file of files) {
        const ext = documentExtension(file.name);
        if (!ext) throw new Error("Недопустимый формат файла.");
        let path = order.uploads.get(file);
        if (!path) {
          path = `${order.id}/${crypto.randomUUID()}.${ext}`;
          const contentType = ext === "pdf" ? "application/pdf" : ext === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/octet-stream";
          const upload = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, file, { contentType, upsert: false });
          if (upload.error) throw new Error("Не удалось загрузить файлы. Попробуйте ещё раз.");
          order.uploads.set(file, path);
        }
        attachments.push({ name: file.name.slice(0, 255), path });
      }
      const saved = await supabase.from("documentation_orders").insert({ id: order.id, ...result.data, files: attachments });
      if (saved.error) throw new Error("Не удалось отправить заказ. Попробуйте ещё раз.");
      void notifyOwner({ data: { kind: "documentation", id: order.id } }).catch(() => {});
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить заказ. Попробуйте ещё раз.");
    } finally { setSubmitting(false); }
  };

  return (
    <section aria-labelledby="documentation-order-title" className="mt-6 border-t pt-10 text-left">
      <div className="mb-7 flex items-start gap-3">
        <FileText aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-safe" />
        <h3 id="documentation-order-title" className="text-2xl font-semibold leading-tight">Заказ проверки проектной документации</h3>
      </div>
      {sent ? <div role="status" className="border-l-2 border-safe bg-card px-5 py-6"><p className="font-semibold">Заказ проверки документации отправлен.</p><p className="mt-2 text-sm text-muted-foreground">Мы свяжемся с вами для уточнения деталей.</p></div> : (
        <form onSubmit={submit} aria-label="Заказ проверки проектной документации" className="grid gap-5">
          <fieldset disabled={submitting} className="grid min-w-0 gap-5">
            <div>
              <label id="documentation-service-label" className={caption}>Услуга</label>
              <Select value={service} onValueChange={setService}>
                <SelectTrigger aria-labelledby="documentation-service-label" className="h-auto min-h-12 whitespace-normal bg-card px-4 py-3 text-left"><SelectValue placeholder="Выберите услугу" /></SelectTrigger>
                <SelectContent>{DOCUMENTATION_SERVICES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <label><span className={caption}>Название ЖК / ссылка на наш.дом.рф или комментарий</span><textarea name="project_description" required minLength={3} maxLength={2000} rows={3} className={`${field} resize-y`} /></label>
            <div>
              <input ref={input} type="file" multiple accept=".pdf,.dwg,.xlsx" aria-label="Файлы документации" className="hidden" onChange={(e) => {
                const next = [...files, ...Array.from(e.target.files ?? [])];
                const issue = validateDocuments(next);
                if (issue) setError(issue); else { setFiles(next); setError(null); }
                e.target.value = "";
              }} />
              <Button type="button" variant="outline" onClick={() => input.current?.click()} className="h-auto gap-2 px-4 py-3"><Paperclip className="h-4 w-4" />Прикрепить файлы</Button>
              <p className="mt-2 font-mono text-xs text-muted-foreground">PDF, DWG, XLSX · до 5 файлов, до 20 МБ каждый</p>
              {files.length > 0 && <ul className="mt-3 divide-y border">{files.map((f, i) => <li key={`${f.name}-${i}`} className="flex min-w-0 items-center gap-3 bg-card px-3 py-2"><FileText className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 break-all text-sm">{f.name}</span><Button variant="ghost" size="icon" type="button" aria-label={`Удалить ${f.name}`} title="Удалить файл" onClick={() => setFiles(files.filter((_, index) => index !== i))}><X className="h-4 w-4" /></Button></li>)}</ul>}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label><span className={caption}>Имя</span><input name="client_name" required maxLength={100} autoComplete="name" className={field} /></label>
              <label><span className={caption}>Телефон</span><input name="phone" type="tel" required maxLength={30} autoComplete="tel" className={field} /></label>
            </div>
            <label><span className={caption}>Комментарий (дополнительные требования)</span><textarea name="comment" maxLength={2000} rows={3} className={`${field} resize-y`} /></label>
            <div className={`flex items-start gap-3 border bg-card p-4 text-sm ${error && !consent ? "border-danger" : "border-input"}`}>
              <Checkbox id="documentation-consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5 h-5 w-5 shrink-0 data-[state=checked]:border-safe data-[state=checked]:bg-safe data-[state=checked]:text-primary-foreground" />
              <label htmlFor="documentation-consent" className="cursor-pointer">Принимаю условия <Link to="/offer" className="font-semibold underline underline-offset-4 hover:text-accent">Публичная оферта</Link>, <Link to="/privacy" className="font-semibold underline underline-offset-4 hover:text-accent">Политика конфиденциальности</Link> и согласен на обработку данных заказа.</label>
            </div>
          </fieldset>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={submitting} className="h-auto min-h-12 w-full whitespace-normal bg-primary px-5 py-3 text-sm font-semibold uppercase text-primary-foreground hover:bg-primary/85">{submitting ? "Отправка…" : "Заказать проверку документации"}</Button>
        </form>
      )}
    </section>
  );
}