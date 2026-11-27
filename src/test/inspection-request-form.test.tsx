import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { addDays } from "date-fns";
import { beforeEach, expect, it, vi } from "vitest";

const { insert, rpc, notifyOwner } = vi.hoisted(() => ({
  insert: vi.fn(async (_row: { id: string; [key: string]: unknown }) => ({ error: null })),
  rpc: vi.fn(async () => ({ data: [], error: null })),
  notifyOwner: vi.fn(async () => ({ sent: true })),
}));

vi.mock("@/lib/owner-notify.functions", () => ({ notifyOwner }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc, from: () => ({ insert }) },
}));

import { InspectionRequestForm } from "@/components/InspectionRequestForm";

const GENITIVE = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const WEEKDAYS = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];

/** Accessible name of a day button in the ru-locale calendar, e.g. "суббота, 28 ноября 2026 г." */
function dayLabel(date: Date) {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${GENITIVE[date.getMonth()]} ${date.getFullYear()} г.`;
}

/** Let the availability request started by a click settle inside React's act() scope. */
async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

/** Days and slots are disabled while availability is being checked, so wait until clickable. */
async function clickWhenReady(get: () => HTMLElement) {
  await waitFor(() => expect(get()).toBeEnabled());
  await act(async () => {
    fireEvent.click(get());
  });
  await flush();
}

async function pickTomorrow() {
  const tomorrow = addDays(new Date(), 1);
  await clickWhenReady(() => screen.getByRole("button", { name: dayLabel(tomorrow) }));
  return tomorrow;
}

function fillContacts() {
  fireEvent.change(screen.getByLabelText("Адрес дома"), { target: { value: "Москва, ул. Строителей, 12" } });
  fireEvent.change(screen.getByLabelText("Номер телефона"), { target: { value: "+7 977 875 76 87" } });
  fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Иван" } });
}

beforeEach(async () => {
  insert.mockClear();
  rpc.mockClear();
  notifyOwner.mockClear();
  render(<InspectionRequestForm />);
  await flush();
});

it("shows the consent line with offer and privacy links right after a date is picked", async () => {
  await pickTomorrow();
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  expect(screen.getByText(/Принимаю условия/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Публичная оферта" })).toHaveAttribute("href", "/offer");
  expect(screen.getByRole("link", { name: "Политика конфиденциальности" })).toHaveAttribute("href", "/privacy");
});

it("refuses to register the booking while the consent box is unticked", async () => {
  await pickTomorrow();
  await clickWhenReady(() => screen.getByRole("button", { name: /Утро/ }));
  fillContacts();
  await clickWhenReady(() => screen.getByRole("button", { name: "Записаться" }));

  expect(await screen.findByText(/Отметьте согласие/)).toBeInTheDocument();
  expect(insert).not.toHaveBeenCalled();
});

it("registers the booking once the consent box is ticked", async () => {
  const tomorrow = await pickTomorrow();
  await clickWhenReady(() => screen.getByRole("button", { name: /Утро/ }));
  fillContacts();
  await act(async () => {
    fireEvent.click(screen.getByRole("checkbox"));
  });
  await clickWhenReady(() => screen.getByRole("button", { name: "Записаться" }));

  await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
  expect(insert).toHaveBeenCalledWith({ id: expect.any(String),
    date: `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`,
    slot: "morning",
    address: "Москва, ул. Строителей, 12",
    phone: "+7 977 875 76 87",
    client_name: "Иван",
  });
  const bookingId = insert.mock.calls[0]?.[0].id;
  expect(bookingId).toEqual(expect.any(String));
  await waitFor(() => expect(notifyOwner).toHaveBeenCalledWith({ data: { kind: "booking", id: bookingId } }));
  expect(await screen.findByText("Вы записаны.")).toBeInTheDocument();
});
