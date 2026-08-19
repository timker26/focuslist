import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

export type FocusListBackup<T> = { schemaVersion: 1; exportedAt: string; state: T };

export function createBackup<T>(state: T): FocusListBackup<T> {
  return { schemaVersion: 1, exportedAt: new Date().toISOString(), state };
}

export function parseBackup<T>(raw: string): FocusListBackup<T> | undefined {
  try {
    const backup = JSON.parse(raw) as FocusListBackup<T>;
    return backup?.schemaVersion === 1 && backup.state ? backup : undefined;
  } catch {
    return undefined;
  }
}

export async function shareBackup<T>(backup: FocusListBackup<T>) {
  const content = JSON.stringify(backup, null, 2);
  const fileName = `focuslist-backup-${backup.exportedAt.slice(0, 10)}.json`;
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = fileName; anchor.click(); URL.revokeObjectURL(url);
    return true;
  }
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true, intermediates: true });
  file.write(content);
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle: "FocusList backup" });
  return true;
}

export async function pickBackup<T>() {
  const result = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true });
  if (result.canceled) return undefined;
  return parseBackup<T>(await FileSystem.readAsStringAsync(result.assets[0].uri));
}
