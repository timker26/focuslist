import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { TaskEditorSheet } from "@/components/task-editor-sheet";
import { TaskRow } from "@/components/task-row";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";
import type { Task, TaskTag } from "@/lib/tasks-context";
import { useTasks } from "@/lib/tasks-context";

export default function ArchiveScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const { tasks, getList, getFolder, getTag, toggleTask } = useTasks();
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [editorOpen, setEditorOpen] = useState(false);
  const archivedTasks = useMemo(() => tasks.filter((task) => task.completedAt).sort((left, right) => (right.archivedAt ?? right.completedAt ?? "").localeCompare(left.archivedAt ?? left.completedAt ?? "")), [tasks]);
  const taskTags = (task: Task) => task.tagIds.map((id) => getTag(id)).filter((tag): tag is TaskTag => Boolean(tag));
  return <ScreenContainer><FlatList data={archivedTasks} keyExtractor={(item) => item.id} contentContainerStyle={styles.content}
    ListHeaderComponent={<View style={styles.header}><View><Text style={[styles.title, { color: colors.foreground }]}>{t("Архив")}</Text><Text style={[styles.subtitle, { color: colors.muted }]}>{t("Завершённые задачи сохраняются здесь")}</Text></View><View style={[styles.count, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.countText, { color: colors.foreground }]}>{archivedTasks.length}</Text></View></View>}
    ListEmptyComponent={<View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}18` }]}><MaterialIcons name="archive" size={27} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t("Архив пока пуст")}</Text><Text style={[styles.emptyText, { color: colors.muted }]}>{t("Завершённые задачи появятся здесь и их можно будет восстановить.")}</Text></View>}
    renderItem={({ item }) => <TaskRow task={item} list={getList(item.listId)} folder={getFolder(item.folderId)} tags={taskTags(item)} onToggle={() => toggleTask(item.id)} onPress={() => { setEditingTask(item); setEditorOpen(true); }} />}
    ItemSeparatorComponent={() => <View style={{ height: 9 }} />}
  /><Text style={[styles.hint, { color: colors.muted }]}>{t("Нажмите на галочку у задачи, чтобы быстро восстановить её.")}</Text><TaskEditorSheet visible={editorOpen} task={editingTask} onClose={() => setEditorOpen(false)} /></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 10 }, header: { marginBottom: 23, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.6 }, subtitle: { marginTop: 4, fontSize: 15 }, count: { minWidth: 48, height: 44, paddingHorizontal: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" }, countText: { fontSize: 17, fontWeight: "800" }, empty: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 22, padding: 28, alignItems: "center" }, emptyIcon: { height: 56, width: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 14 }, emptyTitle: { fontSize: 18, fontWeight: "700" }, emptyText: { marginTop: 7, maxWidth: 260, textAlign: "center", fontSize: 14, lineHeight: 20 }, hint: { paddingHorizontal: 20, paddingBottom: 18, fontSize: 12, textAlign: "center" }, });
