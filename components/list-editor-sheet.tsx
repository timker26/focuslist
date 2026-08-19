import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";
import type { TaskList } from "@/lib/tasks-context";
import { useTasks } from "@/lib/tasks-context";

const COLORS = ["#4659E8", "#9A55DE", "#E25D7B", "#E89642", "#2EAD75", "#2F9BBE"];
type Props = { visible: boolean; list?: TaskList; onClose: () => void };

export function ListEditorSheet({ visible, list, onClose }: Props) {
  const colors = useColors();
  const { t } = useI18n();
  const { addList, updateList, deleteList } = useTasks();
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  useEffect(() => { if (visible) { setTitle(list?.title ?? ""); setColor(list?.color ?? COLORS[0]); } }, [list, visible]);

  const save = () => {
    if (!title.trim()) { Alert.alert("Добавьте название", "Например, «Работа» или «Личное»."); return; }
    if (list) updateList(list.id, { title, color }); else addList({ title, color });
    onClose();
  };
  const remove = () => {
    if (!list || list.isDefault) return;
    Alert.alert("Удалить список?", "Задачи из него останутся во «Входящих».", [{ text: "Отмена", style: "cancel" }, { text: "Удалить", style: "destructive", onPress: () => { deleteList(list.id); onClose(); } }]);
  };
  return (
    <Modal animationType="slide" transparent={Platform.OS === "web"} visible={visible} onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={[styles.backdrop, Platform.OS === "web" && styles.webBackdrop]}><View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={styles.header}><Pressable onPress={onClose} style={styles.action}><Text style={[styles.actionText, { color: colors.muted }]}>{t("Отмена")}</Text></Pressable><Text style={[styles.heading, { color: colors.foreground }]}>{t(list ? "Изменить список" : "Новый список")}</Text><Pressable onPress={save} style={styles.action}><Text style={[styles.actionText, { color: colors.primary }]}>{t("Готово")}</Text></Pressable></View>
        <View style={styles.content}>
          <TextInput autoFocus value={title} onChangeText={setTitle} placeholder={t("Название списка")} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} returnKeyType="done" onSubmitEditing={save} />
          <Text style={[styles.label, { color: colors.muted }]}>{t("ЦВЕТ")}</Text>
          <View style={styles.palette}>{COLORS.map((item) => <Pressable key={item} onPress={() => setColor(item)} style={[styles.swatch, { backgroundColor: item, borderColor: color === item ? colors.foreground : "transparent" }]}>{color === item ? <MaterialIcons name="check" color="#FFFFFF" size={20} /> : null}</Pressable>)}</View>
          {list && !list.isDefault ? <Pressable onPress={remove} style={styles.delete}><MaterialIcons name="delete-outline" size={18} color={colors.error} /><Text style={[styles.deleteText, { color: colors.error }]}>{t("Удалить список")}</Text></Pressable> : null}
        </View>
      </View></View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: { flex: 1 }, webBackdrop: { justifyContent: "flex-end", backgroundColor: "rgba(7, 12, 26, 0.36)" }, sheet: { flex: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28 }, header: { minHeight: 60, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, action: { minWidth: 64, minHeight: 44, justifyContent: "center" }, actionText: { fontSize: 16, fontWeight: "600" }, heading: { fontSize: 17, fontWeight: "700" }, content: { padding: 20 }, input: { height: 58, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, fontSize: 17, fontWeight: "600" }, label: { marginTop: 24, marginBottom: 10, fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }, palette: { flexDirection: "row", gap: 12, flexWrap: "wrap" }, swatch: { width: 42, height: 42, borderRadius: 21, borderWidth: 3, alignItems: "center", justifyContent: "center" }, delete: { marginTop: 38, minHeight: 48, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }, deleteText: { fontSize: 15, fontWeight: "700" },
});
