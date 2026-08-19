import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";
import { priorityMeta } from "@/lib/task-priority";
import type { TaskPriority, TaskTemplate } from "@/lib/tasks-context";
import { useTasks } from "@/lib/tasks-context";

type Props = { visible: boolean; folderId: string; template?: TaskTemplate; onClose: () => void };

export function TemplateEditorSheet({ visible, folderId, template, onClose }: Props) {
  const colors = useColors();
  const { t } = useI18n();
  const { addFolderTemplate, updateFolderTemplate, deleteFolderTemplate } = useTasks();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("none");
  const [isImportant, setIsImportant] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(template?.title ?? "");
    setNotes(template?.notes ?? "");
    setPriority(template?.priority ?? "none");
    setIsImportant(template?.isImportant ?? false);
  }, [template, visible]);

  const save = () => {
    if (!title.trim()) { Alert.alert("Добавьте название", "Введите название для шаблона задачи."); return; }
    const values = { title, notes, priority, isImportant };
    if (template) updateFolderTemplate(folderId, template.id, values); else addFolderTemplate(folderId, values);
    onClose();
  };

  const remove = () => {
    if (!template) return;
    Alert.alert("Удалить шаблон?", "Задачи, уже созданные из него, останутся без изменений.", [{ text: "Отмена", style: "cancel" }, { text: "Удалить", style: "destructive", onPress: () => { deleteFolderTemplate(folderId, template.id); onClose(); } }]);
  };

  return <Modal animationType="slide" transparent={Platform.OS === "web"} visible={visible} onRequestClose={onClose} presentationStyle="pageSheet"><View style={[styles.backdrop, Platform.OS === "web" && styles.webBackdrop]}><View style={[styles.sheet, { backgroundColor: colors.background }]}><SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}><View style={styles.header}><Pressable onPress={onClose} style={styles.action}><Text style={[styles.actionText, { color: colors.muted }]}>{t("Отмена")}</Text></Pressable><Text style={[styles.heading, { color: colors.foreground }]}>{t(template ? "Изменить шаблон" : "Новый шаблон")}</Text><Pressable onPress={save} style={styles.action}><Text style={[styles.actionText, { color: colors.primary }]}>{t("Готово")}</Text></Pressable></View></SafeAreaView><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><TextInput autoFocus value={title} onChangeText={setTitle} placeholder={t("Например, купить продукты")} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} returnKeyType="done" onSubmitEditing={save} /><TextInput value={notes} onChangeText={setNotes} placeholder={t("Заметка (необязательно)")} placeholderTextColor={colors.muted} multiline style={[styles.notes, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} /><Pressable onPress={() => setIsImportant((current) => !current)} style={({ pressed }) => [styles.important, { borderColor: isImportant ? colors.warning : colors.border, backgroundColor: isImportant ? `${colors.warning}18` : colors.surface }, pressed && styles.pressed]}><MaterialIcons name={isImportant ? "star" : "star-border"} size={18} color={isImportant ? colors.warning : colors.muted} /><Text style={[styles.importantText, { color: isImportant ? colors.warning : colors.foreground }]}>{t("Важно")}</Text></Pressable><Text style={[styles.label, { color: colors.muted }]}>{t("ПРИОРИТЕТ")}</Text><View style={styles.chips}>{(["high", "medium", "low", "none"] as TaskPriority[]).map((level) => { const meta = priorityMeta[level]; const tint = colors[meta.color]; const selected = priority === level; return <Pressable key={level} onPress={() => setPriority(level)} style={({ pressed }) => [styles.chip, { borderColor: selected ? tint : colors.border, backgroundColor: selected ? `${tint}18` : colors.surface }, pressed && styles.pressed]}><MaterialIcons name={level === "none" ? "remove" : "flag"} size={15} color={tint} /><Text style={[styles.chipText, { color: colors.foreground }]}>{t(meta.label)}</Text>{selected ? <MaterialIcons name="check" size={15} color={tint} /> : null}</Pressable>; })}</View>{template ? <Pressable onPress={remove} style={styles.delete}><MaterialIcons name="delete-outline" size={18} color={colors.error} /><Text style={[styles.deleteText, { color: colors.error }]}>{t("Удалить шаблон")}</Text></Pressable> : null}</ScrollView></View></View></Modal>;
}

const styles = StyleSheet.create({ backdrop: { flex: 1 }, webBackdrop: { justifyContent: "flex-end", backgroundColor: "rgba(7, 12, 26, 0.36)" }, sheet: { flex: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28 }, header: { minHeight: 60, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, action: { minWidth: 64, minHeight: 44, justifyContent: "center" }, actionText: { fontSize: 16, fontWeight: "600" }, heading: { fontSize: 17, fontWeight: "700" }, content: { padding: 20, paddingBottom: 44 }, input: { minHeight: 58, paddingHorizontal: 16, borderWidth: 1, borderRadius: 16, fontSize: 17, fontWeight: "700" }, notes: { minHeight: 102, marginTop: 12, padding: 16, borderWidth: 1, borderRadius: 16, textAlignVertical: "top", fontSize: 15, lineHeight: 21 }, important: { alignSelf: "flex-start", minHeight: 42, marginTop: 14, paddingHorizontal: 13, borderRadius: 21, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 7 }, importantText: { fontSize: 14, fontWeight: "700" }, label: { marginTop: 22, marginBottom: 9, fontSize: 12, fontWeight: "800", letterSpacing: 0.75 }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { minHeight: 40, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 7 }, chipText: { fontSize: 14, fontWeight: "600" }, delete: { minHeight: 48, marginTop: 28, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, deleteText: { fontSize: 15, fontWeight: "700" }, pressed: { opacity: 0.7 }, });
