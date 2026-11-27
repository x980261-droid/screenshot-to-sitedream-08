import { z } from "zod";

export const DOCUMENTATION_SERVICES = [
  { id: "project", label: "Экспертиза стадии «П»" },
  { id: "working", label: "Верификация РД" },
  { id: "estimate", label: "Проверка сметной документации" },
] as const;
export const DOCUMENTS_BUCKET = "documentation-orders";
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;
export const MAX_DOCUMENTS = 5;
export const documentationOrderSchema = z.object({
  service: z.enum(["project", "working", "estimate"], { errorMap: () => ({ message: "Выберите услугу." }) }),
  project_description: z.string().trim().min(3, "Укажите ЖК, ссылку или комментарий.").max(2000, "Комментарий слишком длинный."),
  client_name: z.string().trim().min(1, "Укажите имя.").max(100),
  phone: z.string().trim().regex(/^[\d\s()+-]{5,30}$/, "Проверьте номер телефона."),
  consent: z.literal(true, { errorMap: () => ({ message: "Отметьте согласие с офертой, политикой конфиденциальности и обработкой данных." }) }),
});

export function documentExtension(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext === "pdf" || ext === "dwg" || ext === "xlsx" ? ext : null;
}

export function validateDocuments(files: Pick<File, "name" | "size">[]) {
  if (files.length > MAX_DOCUMENTS) return "Можно прикрепить не более 5 файлов.";
  if (files.some((f) => !documentExtension(f.name))) return "Допустимы только PDF, DWG и XLSX.";
  if (files.some((f) => f.size <= 0 || f.size > MAX_DOCUMENT_SIZE)) return "Каждый файл должен быть непустым и не больше 20 МБ.";
  return null;
}