import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";
import { openTaskAttachment, persistTaskAttachments } from "@/lib/task-attachment-storage";
import { formatAttachmentSize, isImageAttachment } from "@/lib/task-attachment-utils";
import type { TaskAttachment } from "@/lib/tasks-context";

type Props = { attachments: TaskAttachment[]; onChange: (attachments: TaskAttachment[]) => void; onAdded?: (attachments: TaskAttachment[]) => void };

export function TaskAttachmentsSection({ attachments, onChange, onAdded }: Props) {
  const colors = useColors();
  const { t } = useI18n();

  const addAttachments = async (sources: Parameters<typeof persistTaskAttachments>[0]) => {
    try {
      const added = await persistTaskAttachments(sources);
      onChange([...attachments, ...added]);
      onAdded?.(added);
    } catch {
      Alert.alert(t("Не удалось добавить вложение"), t("Попробуйте выбрать файл ещё раз."));
    }
  };

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: 10, quality: 0.9 });
    if (result.canceled) return;
    await addAttachments(result.assets.map((asset) => ({ name: asset.fileName, uri: asset.uri, mimeType: asset.mimeType, size: asset.fileSize, kind: "image" })));
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert(t("Нет доступа к камере"), t("Разрешите доступ к камере в настройках устройства, чтобы сделать фото для задачи."));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [4, 3], quality: 0.9, exif: false });
    if (result.canceled) return;
    await addAttachments(result.assets.map((asset) => ({ name: asset.fileName, uri: asset.uri, mimeType: asset.mimeType, size: asset.fileSize, kind: "image" })));
  };

  const pickFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*", multiple: true, copyToCacheDirectory: true });
    if (result.canceled) return;
    await addAttachments(result.assets.map((asset) => ({ name: asset.name, uri: asset.uri, mimeType: asset.mimeType, size: asset.size })));
  };

  const openAttachment = async (attachment: TaskAttachment) => {
    try {
      const opened = await openTaskAttachment(attachment);
      if (!opened) Alert.alert(t("Не удалось открыть вложение"), attachment.name);
    } catch {
      Alert.alert(t("Не удалось открыть вложение"), attachment.name);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.muted }]}>{t("ВЛОЖЕНИЯ")}</Text>
      <View style={styles.actions}>
        <Pressable onPress={() => void takePhoto()} style={({ pressed }) => [styles.addButton, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
          <MaterialIcons name="photo-camera" size={18} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.foreground }]}>{t("Снять фото")}</Text>
        </Pressable>
        <Pressable onPress={() => void pickPhotos()} style={({ pressed }) => [styles.addButton, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
          <MaterialIcons name="photo-library" size={18} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.foreground }]}>{t("Добавить фото")}</Text>
        </Pressable>
        <Pressable onPress={() => void pickFiles()} style={({ pressed }) => [styles.addButton, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
          <MaterialIcons name="attach-file" size={18} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.foreground }]}>{t("Добавить файл")}</Text>
        </Pressable>
      </View>
      {attachments.length === 0 ? <Text style={[styles.empty, { color: colors.muted }]}>{t("Нет вложений")}</Text> : null}
      {attachments.map((attachment) => {
        const image = isImageAttachment(attachment);
        const size = formatAttachmentSize(attachment.size);
        return (
          <View key={attachment.id} style={[styles.attachment, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable onPress={() => void openAttachment(attachment)} style={({ pressed }) => [styles.attachmentMain, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`${t("Открыть вложение")}: ${attachment.name}`}>
              {image ? <Image source={{ uri: attachment.uri }} style={styles.thumbnail} /> : <View style={[styles.fileIcon, { backgroundColor: `${colors.primary}18` }]}><MaterialIcons name="insert-drive-file" size={21} color={colors.primary} /></View>}
              <View style={styles.attachmentCopy}>
                <Text numberOfLines={1} style={[styles.attachmentName, { color: colors.foreground }]}>{attachment.name}</Text>
                <Text numberOfLines={1} style={[styles.attachmentMeta, { color: colors.muted }]}>{size || attachment.mimeType || t("Файл")}</Text>
              </View>
              <MaterialIcons name="open-in-new" size={18} color={colors.muted} />
            </Pressable>
            <Pressable onPress={() => onChange(attachments.filter((item) => item.id !== attachment.id))} style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`${t("Удалить вложение")}: ${attachment.name}`}>
              <MaterialIcons name="close" size={19} color={colors.muted} />
            </Pressable>
          </View>
        );
      })}
      <Text style={[styles.localNote, { color: colors.muted }]}>{t("Фото и файлы хранятся только на этом устройстве.")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 2 },
  label: { marginTop: 14, marginBottom: 8, fontSize: 12, fontWeight: "800", letterSpacing: 0.75 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  addButton: { minHeight: 42, paddingHorizontal: 13, borderRadius: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 7 },
  addButtonText: { fontSize: 14, fontWeight: "700" },
  empty: { marginTop: 9, fontSize: 13 },
  attachment: { minHeight: 60, marginTop: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 15, flexDirection: "row", alignItems: "center", paddingRight: 4 },
  attachmentMain: { flex: 1, minHeight: 58, paddingLeft: 9, flexDirection: "row", alignItems: "center", gap: 9 },
  thumbnail: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#D9DDEA" },
  fileIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  attachmentCopy: { flex: 1, minWidth: 0 },
  attachmentName: { fontSize: 13.5, fontWeight: "700" },
  attachmentMeta: { marginTop: 2, fontSize: 11.5 },
  removeButton: { width: 42, minHeight: 44, alignItems: "center", justifyContent: "center" },
  localNote: { marginTop: 8, fontSize: 11.5, lineHeight: 16 },
  pressed: { opacity: 0.68 },
});
