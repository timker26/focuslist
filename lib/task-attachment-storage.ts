import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import type { TaskAttachment } from "@/lib/tasks-context";
import { isImageAttachment } from "@/lib/task-attachment-utils";

export type PickedTaskAttachment = {
  name?: string | null;
  uri: string;
  mimeType?: string | null;
  size?: number | null;
  kind?: TaskAttachment["kind"];
};

const ATTACHMENTS_DIRECTORY = "focuslist-attachments/";

function makeId() {
  return `attachment-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(-96) || "attachment";
}

function attachmentDirectory() {
  return FileSystem.documentDirectory ? `${FileSystem.documentDirectory}${ATTACHMENTS_DIRECTORY}` : undefined;
}

function inferName(uri: string, supplied?: string | null) {
  if (supplied?.trim()) return supplied.trim();
  const fallback = uri.split("/").pop()?.split("?")[0];
  return fallback || "attachment";
}

export async function persistTaskAttachment(source: PickedTaskAttachment): Promise<TaskAttachment> {
  const id = makeId();
  const name = inferName(source.uri, source.name);
  const provisional: TaskAttachment = {
    id,
    name,
    uri: source.uri,
    mimeType: source.mimeType ?? undefined,
    size: typeof source.size === "number" ? source.size : undefined,
    kind: source.kind ?? "file",
    addedAt: new Date().toISOString(),
  };
  const kind = source.kind ?? (isImageAttachment(provisional) ? "image" : "file");

  if (Platform.OS === "web") return { ...provisional, kind };

  const directory = attachmentDirectory();
  if (!directory) return { ...provisional, kind };
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const destination = `${directory}${id}-${safeFileName(name)}`;
  await FileSystem.copyAsync({ from: source.uri, to: destination });
  const info = await FileSystem.getInfoAsync(destination);
  return { ...provisional, uri: destination, kind, size: info.exists && "size" in info ? info.size : provisional.size };
}

export async function persistTaskAttachments(sources: PickedTaskAttachment[]) {
  return Promise.all(sources.map(persistTaskAttachment));
}

export async function deleteTaskAttachments(attachments: TaskAttachment[]) {
  if (Platform.OS === "web") return;
  const directory = attachmentDirectory();
  if (!directory) return;
  await Promise.all(attachments.map(async (attachment) => {
    if (!attachment.uri.startsWith(directory)) return;
    const info = await FileSystem.getInfoAsync(attachment.uri);
    if (info.exists) await FileSystem.deleteAsync(attachment.uri, { idempotent: true });
  }));
}

export async function openTaskAttachment(attachment: TaskAttachment) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.open(attachment.uri, "_blank", "noopener,noreferrer");
    return true;
  }
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(attachment.uri, { mimeType: attachment.mimeType, dialogTitle: attachment.name });
  return true;
}
