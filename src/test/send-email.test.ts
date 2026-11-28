import { expect, it } from "vitest";
import { buildOwnerMail } from "@/lib/yandex-mail.server";

it("sends owner notifications from and to termin.info@yandex.ru", () => {
  const m = buildOwnerMail("Новая заявка", "Иван", []);
  expect(m.from.address).toBe("termin.info@yandex.ru");
  expect(m.to).toBe("termin.info@yandex.ru");
});

it("escapes visitor input in the HTML body", () => {
  const m = buildOwnerMail("Новая заявка", "Иван", [{ label: "Имя", value: "<script>" }]);
  expect(m.html).not.toContain("<script>");
});
