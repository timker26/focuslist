export function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function dateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isSameDay(left: Date | string, right: Date | string) {
  return dateKey(left) === dateKey(right);
}

export function isOverdue(iso?: string) {
  return Boolean(iso && startOfDay(new Date(iso)).getTime() < startOfDay(new Date()).getTime());
}

export function formatDueDate(iso?: string, language: AppLanguage = "ru") {
  if (!iso) return relativeDueLabels[language].noDueDate;
  const date = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (isSameDay(date, today)) return relativeDueLabels[language].today;
  if (isSameDay(date, tomorrow)) return relativeDueLabels[language].tomorrow;
  return new Intl.DateTimeFormat(localeByLanguage[language], { day: "numeric", month: "short" }).format(date);
}

export function formatDateInput(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

/** Keeps a DD.MM.YYYY input numeric while adding visual separators as the user types. */
export function maskDateInput(value: string, previousValue = "") {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const removedSeparator = previousValue.endsWith(".") && value === previousValue.slice(0, -1);
  if (digits.length <= 2) return digits.length === 2 && !removedSeparator ? `${digits}.` : digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}${digits.length === 4 && !removedSeparator ? "." : ""}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

export function parseDateInput(value: string) {
  const match = value.trim().match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (!match) return undefined;
  const [, dayRaw, monthRaw, yearRaw] = match;
  const date = new Date(Number(yearRaw), Number(monthRaw) - 1, Number(dayRaw), 9, 0, 0, 0);
  if (date.getFullYear() !== Number(yearRaw) || date.getMonth() !== Number(monthRaw) - 1 || date.getDate() !== Number(dayRaw)) return undefined;
  return date.toISOString();
}

export function formatTimeInput(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** Keeps a HH:MM input numeric while adding the time separator as the user types. */
export function maskTimeInput(value: string, previousValue = "") {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  const removedSeparator = previousValue.endsWith(":") && value === previousValue.slice(0, -1);
  if (digits.length <= 2) return digits.length === 2 && !removedSeparator ? `${digits}:` : digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function parseDateTimeInput(dateValue: string, timeValue: string) {
  const dateMatch = dateValue.trim().match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  const timeMatch = (timeValue.trim() || "09:00").match(/^(\d{1,2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) return undefined;
  const [, dayRaw, monthRaw, yearRaw] = dateMatch;
  const [, hourRaw, minuteRaw] = timeMatch;
  const date = new Date(Number(yearRaw), Number(monthRaw) - 1, Number(dayRaw), Number(hourRaw), Number(minuteRaw), 0, 0);
  if (date.getFullYear() !== Number(yearRaw) || date.getMonth() !== Number(monthRaw) - 1 || date.getDate() !== Number(dayRaw) || date.getHours() !== Number(hourRaw) || date.getMinutes() !== Number(minuteRaw)) return undefined;
  return date.toISOString();
}

export function nextRecurringDueAt(dueAt: string | undefined, recurrence: "daily" | "weekly") {
  const next = dueAt ? new Date(dueAt) : new Date();
  next.setDate(next.getDate() + (recurrence === "daily" ? 1 : 7));
  return next.toISOString();
}

export function addDays(offset: number) {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString();
}
import type { AppLanguage } from "./languages";

const localeByLanguage: Record<AppLanguage, string> = { ru: "ru-RU", en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE", pt: "pt-BR", zh: "zh-CN", ar: "ar-SA", hi: "hi-IN", ja: "ja-JP" };
const relativeDueLabels: Record<AppLanguage, { today: string; tomorrow: string; noDueDate: string }> = {
  ru: { today: "Сегодня", tomorrow: "Завтра", noDueDate: "Без срока" }, en: { today: "Today", tomorrow: "Tomorrow", noDueDate: "No due date" }, es: { today: "Hoy", tomorrow: "Mañana", noDueDate: "Sin fecha" }, fr: { today: "Aujourd’hui", tomorrow: "Demain", noDueDate: "Sans échéance" }, de: { today: "Heute", tomorrow: "Morgen", noDueDate: "Ohne Termin" }, pt: { today: "Hoje", tomorrow: "Amanhã", noDueDate: "Sem prazo" }, zh: { today: "今天", tomorrow: "明天", noDueDate: "无截止日期" }, ar: { today: "اليوم", tomorrow: "غدًا", noDueDate: "بدون موعد" }, hi: { today: "आज", tomorrow: "कल", noDueDate: "बिना नियत तारीख" }, ja: { today: "今日", tomorrow: "明日", noDueDate: "期限なし" },
};
