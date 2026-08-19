import { describe, expect, it } from "vitest";

import { dateKey, formatDateInput, formatDueDate, formatTimeInput, isSameDay, maskDateInput, maskTimeInput, nextRecurringDueAt, parseDateInput, parseDateTimeInput } from "../lib/date-utils";
import { formatActiveTaskCount } from "../lib/localized-format";

describe("date utilities", () => {
  it("serializes an ISO date to a local calendar key", () => {
    expect(dateKey(new Date(2026, 11, 25, 9, 0, 0))).toBe("2026-12-25");
  });

  it("accepts a valid due date written in Russian numeric format", () => {
    const dueAt = parseDateInput("25.12.2026");
    expect(dueAt).toBeDefined();
    expect(formatDateInput(dueAt)).toBe("25.12.2026");
  });

  it("rejects impossible or incomplete dates", () => {
    expect(parseDateInput("31.02.2026")).toBeUndefined();
    expect(parseDateInput("2026-12-25")).toBeUndefined();
    expect(parseDateInput("25.12")).toBeUndefined();
  });

  it("matches two values that fall on the same local day", () => {
    expect(isSameDay(new Date(2026, 4, 7, 8), new Date(2026, 4, 7, 22))).toBe(true);
    expect(isSameDay(new Date(2026, 4, 7), new Date(2026, 4, 8))).toBe(false);
  });

  it("combines a valid date and time into one due timestamp", () => {
    const dueAt = parseDateTimeInput("25.12.2026", "18:30");
    expect(dueAt).toBeDefined();
    expect(formatTimeInput(dueAt)).toBe("18:30");
    expect(parseDateTimeInput("25.12.2026", "25:90")).toBeUndefined();
  });

  it("adds separators to numeric date and time input while preserving natural backspace behavior", () => {
    expect(maskDateInput("25092026")).toBe("25.09.2026");
    expect(maskDateInput("25", "2")).toBe("25.");
    expect(maskDateInput("25", "25.")).toBe("25");
    expect(maskTimeInput("1830")).toBe("18:30");
    expect(maskTimeInput("18", "18:")).toBe("18");
  });

  it("moves recurring deadlines forward by one day or one week", () => {
    expect(formatDateInput(nextRecurringDueAt("2026-12-25T18:30:00.000Z", "daily"))).toBe("26.12.2026");
    expect(formatDateInput(nextRecurringDueAt("2026-12-25T18:30:00.000Z", "weekly"))).toBe("01.01.2027");
  });

  it("uses the chosen language for a due date and active task count", () => {
    expect(formatDueDate("2026-12-25T09:00:00.000Z", "en")).not.toContain("дек");
    expect(formatActiveTaskCount(1, "en")).toBe("1 active task");
    expect(formatActiveTaskCount(2, "ja")).toBe("2件のアクティブなタスク");
  });
});
