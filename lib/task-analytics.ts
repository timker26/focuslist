import { dateKey, startOfDay } from "./date-utils";
import type { Task } from "@/lib/tasks-context";

const WEEKDAYS = {
  ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], es: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"], fr: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"], de: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"], pt: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"], zh: ["日", "一", "二", "三", "四", "五", "六"], ar: ["الأح", "الإث", "الث", "الأر", "الخ", "الجم", "السب"], hi: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"], ja: ["日", "月", "火", "水", "木", "金", "土"],
} as const;

export type WeeklyCompletion = {
  key: string;
  label: string;
  dayNumber: number;
  count: number;
};

export function getWeeklyCompletions(tasks: Task[], reference = new Date(), language: keyof typeof WEEKDAYS = "ru", firstDayOfWeek: 0 | 1 = 1): WeeklyCompletion[] {
  const today = startOfDay(reference);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() - firstDayOfWeek + 7) % 7));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const counts = new Map<string, number>();
  for (const task of tasks) {
    const completion = task.archivedAt ?? task.completedAt;
    if (!completion) continue;
    const key = dateKey(completion);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return days.map((date) => ({ key: dateKey(date), label: WEEKDAYS[language][date.getDay()], dayNumber: date.getDate(), count: counts.get(dateKey(date)) ?? 0 }));
}

export function getWeeklySummary(completions: WeeklyCompletion[]) {
  const total = completions.reduce((sum, day) => sum + day.count, 0);
  const best = completions.reduce((bestDay, day) => day.count > bestDay.count ? day : bestDay, completions[0]);
  return { total, best };
}
