import { describe, expect, it } from "vitest";

import { getWeeklyCompletions, getWeeklySummary } from "../lib/task-analytics";
import type { Task } from "../lib/tasks-context";

const baseTask: Omit<Task, "id" | "completedAt" | "archivedAt"> = {
  title: "Задача",
  notes: "",
  listId: "inbox",
  tagIds: [],
  isImportant: false,
  isPinned: false,
  priority: "none",
  recurrence: "none",
  attachments: [],
  createdAt: "2026-08-01T09:00:00.000Z",
};

describe("weekly completion analytics", () => {
  it("groups completed tasks by local calendar day in the latest seven-day window", () => {
    const tasks: Task[] = [
      { ...baseTask, id: "one", completedAt: "2026-08-17T09:00:00.000Z", archivedAt: "2026-08-17T09:00:00.000Z" },
      { ...baseTask, id: "two", completedAt: "2026-08-17T18:00:00.000Z", archivedAt: "2026-08-17T18:00:00.000Z" },
      { ...baseTask, id: "three", completedAt: "2026-08-18T11:00:00.000Z", archivedAt: "2026-08-18T11:00:00.000Z" },
    ];
    const results = getWeeklyCompletions(tasks, new Date(2026, 7, 17, 12));
    expect(results).toHaveLength(7);
    expect(results.find((day) => day.key === "2026-08-17")?.count).toBe(2);
    expect(results.find((day) => day.key === "2026-08-18")?.count).toBe(1);
  });

  it("returns the weekly total and the strongest completion day", () => {
    const summary = getWeeklySummary([
      { key: "a", label: "Пн", dayNumber: 1, count: 1 },
      { key: "b", label: "Вт", dayNumber: 2, count: 4 },
    ]);
    expect(summary.total).toBe(5);
    expect(summary.best.label).toBe("Вт");
  });

  it("starts the weekly range on the configured regional weekday", () => {
    const mondayFirst = getWeeklyCompletions([], new Date(2026, 7, 19, 12), "en", 1);
    const sundayFirst = getWeeklyCompletions([], new Date(2026, 7, 19, 12), "en", 0);
    expect(mondayFirst[0].key).toBe("2026-08-17");
    expect(sundayFirst[0].key).toBe("2026-08-16");
  });
});
