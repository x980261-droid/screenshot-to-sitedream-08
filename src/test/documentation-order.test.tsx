import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { documentationOrderSchema, validateDocuments } from "@/lib/documentation-order";

const { insert, upload, notifyOwner } = vi.hoisted(() => ({
  insert: vi.fn(async () => ({ error: null })),
  upload: vi.fn(async () => ({ error: null })),
  notifyOwner: vi.fn(async () => ({ sent: true })),
}));
vi.mock("@/lib/owner-notify.functions", () => ({ notifyOwner }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ insert }), storage: { from: () => ({ upload }) } } }));
vi.mock("@tanstack/react-router", () => ({ Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a> }));
import { DocumentationOrderForm } from "@/components/DocumentationOrderForm";

const valid = { service: "project", project_description: "ЖК Тест", client_name: "Иван", phone: "+7 977 875 76 87", consent: true };
beforeEach(() => {
  vi.clearAllMocks();
  // jsdom does not implement the browser method used by the service selector.
  Element.prototype.scrollIntoView = vi.fn();
});

it.each(["project", "working", "estimate"])("accepts the requested documentation service %s", (service) => {
  expect(documentationOrderSchema.safeParse({ ...valid, service }).success).toBe(true);
});
it("rejects consent-free orders and unsupported services", () => {
  expect(documentationOrderSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
  expect(documentationOrderSchema.safeParse({ ...valid, service: "inspection" }).success).toBe(false);
});
it.each(["plans.pdf", "plans.DWG", "estimate.xlsx"])("accepts requested attachment %s", (name) => {
  expect(validateDocuments([{ name, size: 100 }])).toBeNull();
});
it("rejects other attachment formats", () => {
  expect(validateDocuments([{ name: "script.exe", size: 100 }])).not.toBeNull();
});
it("blocks submission before consent without uploading or saving", async () => {
  render(<DocumentationOrderForm />);
  fireEvent.submit(screen.getByRole("form"));
  await screen.findByRole("alert");
  expect(insert).not.toHaveBeenCalled();
  expect(upload).not.toHaveBeenCalled();
});
it("uploads a PDF and saves a consented order without date or slot", async () => {
  vi.spyOn(crypto, "randomUUID").mockReturnValue("8dfe2c82-61a1-4a50-9db3-2a15c9538759");
  render(<DocumentationOrderForm />);
  fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
  fireEvent.click(await screen.findByRole("option", { name: "Верификация РД" }));
  fireEvent.change(screen.getByLabelText(/Название ЖК/), { target: { value: "ЖК Тест" } });
  fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Иван" } });
  fireEvent.change(screen.getByLabelText("Телефон"), { target: { value: "+7 977 875 76 87" } });
  fireEvent.change(screen.getByLabelText("Файлы документации"), { target: { files: [new File(["%PDF-1.4"], "plans.pdf", { type: "application/pdf" })] } });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.submit(screen.getByRole("form"));
  await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
  expect(upload).toHaveBeenCalledTimes(1);
  expect(insert).toHaveBeenCalledWith({ ...valid, service: "working", id: "8dfe2c82-61a1-4a50-9db3-2a15c9538759", files: [{ name: "plans.pdf", path: "8dfe2c82-61a1-4a50-9db3-2a15c9538759/8dfe2c82-61a1-4a50-9db3-2a15c9538759.pdf" }] });
  expect(notifyOwner).toHaveBeenCalledWith({ data: { kind: "documentation", id: "8dfe2c82-61a1-4a50-9db3-2a15c9538759" } });
  await screen.findByRole("status");
});