import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import type { Task } from "@/lib/tasks-context";
import type { AppLanguage } from "@/lib/languages";
import { translate } from "@/lib/translations";

const CHANNEL_ID = "task-reminders";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestReminderPermission(language: AppLanguage = "ru") {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: translate(language, "Напоминания о задачах"),
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180],
      lightColor: "#4659E8",
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

export async function cancelTaskReminder(notificationId?: string) {
  if (!notificationId || Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => undefined);
}

export async function scheduleTaskReminder(task: Pick<Task, "id" | "title" | "dueAt" | "completedAt">, language: AppLanguage = "ru") {
  if (Platform.OS === "web" || !task.dueAt || task.completedAt) return undefined;
  const date = new Date(task.dueAt);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return undefined;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: translate(language, "Пора сфокусироваться"),
      body: task.title,
      sound: "default",
      data: { taskId: task.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: CHANNEL_ID,
    },
  });
}
