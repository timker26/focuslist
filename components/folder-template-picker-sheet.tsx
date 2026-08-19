import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";
import type { TaskFolder } from "@/lib/tasks-context";
import { useTasks } from "@/lib/tasks-context";

type Props = { visible: boolean; folder?: TaskFolder; onClose: () => void };

export function FolderTemplatePickerSheet({ visible, folder, onClose }: Props) {
  const colors = useColors();
  const { t } = useI18n();
  const { createTaskFromTemplate } = useTasks();
  const templates = folder?.templates ?? [];

  const createFromTemplate = (templateId: string) => {
    if (folder) createTaskFromTemplate(folder.id, templateId);
    onClose();
  };

  return <Modal animationType="slide" transparent={Platform.OS === "web"} visible={visible} onRequestClose={onClose} presentationStyle="pageSheet">
    <View style={[styles.backdrop, Platform.OS === "web" && styles.webBackdrop]}><View style={[styles.sheet, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={["top"]} style={[styles.safeHeader, { backgroundColor: colors.background }]}><View style={styles.header}>
        <Pressable onPress={onClose} style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}><Text style={[styles.headerText, { color: colors.muted }]}>{t("Закрыть")}</Text></Pressable>
        <Text numberOfLines={1} style={[styles.heading, { color: colors.foreground }]}>{folder ? `${folder.emoji} ${t("Шаблоны")}` : t("Шаблоны")}</Text>
        <View style={styles.headerAction} />
      </View></SafeAreaView>
      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{`${t("Выберите шаблон — задача сразу появится в папке")}: ${folder?.title ?? ""}`}</Text>
        {templates.length ? templates.map((template) => <Pressable key={template.id} onPress={() => createFromTemplate(template.id)} style={({ pressed }) => [styles.templateCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
          <View style={[styles.templateIcon, { backgroundColor: `${colors.primary}18` }]}><MaterialIcons name="bolt" size={19} color={colors.primary} /></View>
          <View style={styles.templateCopy}><Text numberOfLines={1} style={[styles.templateTitle, { color: colors.foreground }]}>{template.title}</Text>{template.notes ? <Text numberOfLines={2} style={[styles.templateNote, { color: colors.muted }]}>{template.notes}</Text> : null}</View>
          <MaterialIcons name="add-circle" size={22} color={colors.primary} />
        </Pressable>) : <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}><MaterialIcons name="auto-awesome" size={28} color={colors.primary} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t("Нет шаблонов")}</Text><Text style={[styles.emptyText, { color: colors.muted }]}>{t("Откройте папку и добавьте шаблон, чтобы создавать повторяющиеся дела быстрее.")}</Text></View>}
      </View>
    </View></View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 }, webBackdrop: { justifyContent: "flex-end", backgroundColor: "rgba(7, 12, 26, 0.36)" }, sheet: { flex: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" }, safeHeader: { flexShrink: 0 }, header: { minHeight: 60, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headerAction: { minWidth: 68, minHeight: 44, justifyContent: "center" }, headerText: { fontSize: 16, fontWeight: "600" }, heading: { flex: 1, fontSize: 17, fontWeight: "800", textAlign: "center" }, content: { padding: 20, gap: 10 }, subtitle: { marginBottom: 8, fontSize: 14, lineHeight: 20 }, templateCard: { minHeight: 70, padding: 12, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", gap: 11 }, templateIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" }, templateCopy: { flex: 1 }, templateTitle: { fontSize: 15, fontWeight: "800" }, templateNote: { marginTop: 3, fontSize: 12.5, lineHeight: 18 }, empty: { marginTop: 8, padding: 28, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: "center" }, emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: "800" }, emptyText: { marginTop: 6, maxWidth: 250, textAlign: "center", fontSize: 13.5, lineHeight: 19 }, pressed: { opacity: 0.68 },
});
