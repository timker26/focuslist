import type { AppLanguage } from "./languages";

const activeTaskLabels: Record<AppLanguage, { zero: string; one: string; other: string }> = {
  ru: { zero: "Нет активных задач", one: "активная задача", other: "активных задач" }, en: { zero: "No active tasks", one: "active task", other: "active tasks" }, es: { zero: "No hay tareas activas", one: "tarea activa", other: "tareas activas" }, fr: { zero: "Aucune tâche active", one: "tâche active", other: "tâches actives" }, de: { zero: "Keine aktiven Aufgaben", one: "aktive Aufgabe", other: "aktive Aufgaben" }, pt: { zero: "Nenhuma tarefa ativa", one: "tarefa ativa", other: "tarefas ativas" }, zh: { zero: "没有活动任务", one: "个活动任务", other: "个活动任务" }, ar: { zero: "لا توجد مهام نشطة", one: "مهمة نشطة", other: "مهام نشطة" }, hi: { zero: "कोई सक्रिय कार्य नहीं", one: "सक्रिय कार्य", other: "सक्रिय कार्य", }, ja: { zero: "アクティブなタスクはありません", one: "件のアクティブなタスク", other: "件のアクティブなタスク" },
};

export function formatActiveTaskCount(count: number, language: AppLanguage) {
  const labels = activeTaskLabels[language];
  if (count === 0) return labels.zero;
  if (language === "zh" || language === "ja") return `${count}${labels.other}`;
  return `${count} ${count === 1 ? labels.one : labels.other}`;
}
