import { fireEvent, render, screen } from "@testing-library/react";
import { addDays, format } from "date-fns";
import { describe, expect, it, vi } from "vitest";

import { HabitForm } from "@/components/habits/HabitForm";
import { todayISO, type Habit } from "@/lib/habits";

const habit = (startDate: string): Habit => ({
  id: "h1",
  title: "Зарядка",
  description: "",
  reminderTime: "08:00",
  startDate,
  endDate: null,
  remindersEnabled: true,
  notificationId: null,
  scheduledIds: [],
  status: "active",
  archivedReason: null,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
});

async function fillRequired() {
  fireEvent.change(screen.getByLabelText(/Название привычки/), {
    target: { value: "Зарядка" },
  });
  fireEvent.change(screen.getByLabelText(/Время напоминания/), {
    target: { value: "08:00" },
  });
}

describe("HabitForm start date", () => {
  it("defaults to today and switches via the «Завтра» chip", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<HabitForm open habit={null} onCancel={() => {}} onSave={onSave} />);

    const input = screen.getByLabelText(/Дата начала/) as HTMLInputElement;
    expect(input.value).toBe(todayISO());

    fireEvent.click(screen.getByRole("button", { name: "Завтра" }));
    const tomorrow = todayISO(addDays(new Date(), 1));
    expect(input.value).toBe(tomorrow);
    expect(screen.getByRole("button", { name: "Завтра" })).toHaveAttribute("aria-pressed", "true");
  });

  it("saves the chosen arbitrary date through the date input", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<HabitForm open habit={null} onCancel={() => {}} onSave={onSave} />);

    await fillRequired();
    fireEvent.change(screen.getByLabelText(/Дата начала/), {
      target: { value: "2026-12-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ startDate: "2026-12-01", title: "Зарядка" }),
    );
  });

  it("reopens an existing habit for editing with its start date", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<HabitForm open habit={habit("2026-10-01")} onCancel={() => {}} onSave={onSave} />);

    const input = screen.getByLabelText(/Дата начала/) as HTMLInputElement;
    expect(input.value).toBe("2026-10-01");
    expect(screen.getByText("Редактировать привычку")).toBeInTheDocument();
  });
});
