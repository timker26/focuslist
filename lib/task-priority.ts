import type { TaskPriority } from "@/lib/tasks-context";

export const priorityMeta: Record<TaskPriority, { label: string; color: "muted" | "primary" | "warning" | "error"; rank: number }> = {
  high: { label: "Высокий", color: "error", rank: 0 },
  medium: { label: "Средний", color: "warning", rank: 1 },
  low: { label: "Низкий", color: "primary", rank: 2 },
  none: { label: "Без приоритета", color: "muted", rank: 3 },
};

export function compareByPriority<T extends { priority: TaskPriority; createdAt: string }>(left: T, right: T) {
  return priorityMeta[left.priority].rank - priorityMeta[right.priority].rank || right.createdAt.localeCompare(left.createdAt);
}
