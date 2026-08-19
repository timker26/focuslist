import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { TaskEditorSheet } from "@/components/task-editor-sheet";
import { TaskRow } from "@/components/task-row";
import { useColors } from "@/hooks/use-colors";
import { compareByPriority } from "@/lib/task-priority";
import { useI18n } from "@/lib/i18n";
import type { Task } from "@/lib/tasks-context";
import { useTasks } from "@/lib/tasks-context";

export default function HomeScreen() {
  const colors = useColors();
  const { t, language } = useI18n();
  const { tasks, folders, getList, getFolder, getTag, toggleTask, isReady } = useTasks();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [sortMode, setSortMode] = useState<"schedule" | "priority">("schedule");
  const openNew = () => { setEditingTask(undefined); setEditorOpen(true); };
  const openTask = (task: Task) => { setEditingTask(task); setEditorOpen(true); };
  const openTasks = useMemo(() => tasks.filter((task) => !task.completedAt), [tasks]);
  const sortedTasks = useMemo(() => [...openTasks].sort(sortMode === "priority" ? compareByPriority : (left, right) => {
    if (left.dueAt && right.dueAt) return left.dueAt.localeCompare(right.dueAt) || right.createdAt.localeCompare(left.createdAt);
    if (left.dueAt) return -1;
    if (right.dueAt) return 1;
    return right.createdAt.localeCompare(left.createdAt);
  }), [openTasks, sortMode]);
  const flatData = useMemo(() => {
    const items: ({ type: "header"; id: string; title: string; emoji?: string; pinned?: boolean; count: number } | { type: "task"; id: string; task: Task })[] = [];
    const appendGroup = (id: string, title: string, tasksInGroup: Task[], emoji?: string, pinned?: boolean) => {
      if (!tasksInGroup.length) return;
      items.push({ type: "header", id: `header-${id}`, title, emoji, pinned, count: tasksInGroup.length });
      tasksInGroup.forEach((task) => items.push({ type: "task", id: task.id, task }));
    };
    appendGroup("pinned", t("pinnedTasks"), sortedTasks.filter((task) => task.isPinned), undefined, true);
    const orderedFolders = [...folders].sort((left, right) => Number(right.isPinned) - Number(left.isPinned) || left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt));
    orderedFolders.forEach((folder) => appendGroup(folder.id, folder.title, sortedTasks.filter((task) => !task.isPinned && task.folderId === folder.id), folder.emoji));
    appendGroup("without-folder", t("withoutFolder"), sortedTasks.filter((task) => !task.isPinned && !task.folderId));
    return items;
  }, [folders, sortedTasks, t]);

  return <ScreenContainer edges={["top", "left", "right"]}>
    <FlatList
      data={flatData}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<><View style={styles.top}>
        <View><Text style={[styles.eyebrow, { color: colors.primary }]}>FOCUSLIST</Text><Text style={[styles.title, { color: colors.foreground }]}>{t("taskList")}</Text><Text style={[styles.subtitle, { color: colors.muted }]}>{t("allTasks")} — {openTasks.length}</Text></View>
        <View style={styles.headerActions}><Pressable accessibilityLabel={t("openSearch")} onPress={() => router.push("/search" as never)} style={({ pressed }) => [styles.searchAction, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}><MaterialIcons name="search" size={20} color={colors.foreground} /></Pressable><View style={[styles.dateBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.dayNumber, { color: colors.foreground }]}>{new Date().getDate()}</Text><Text style={[styles.month, { color: colors.muted }]}>{new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : language === "zh" ? "zh-CN" : language === "ja" ? "ja-JP" : language === "ar" ? "ar-SA" : language === "hi" ? "hi-IN" : `${language}-${language.toUpperCase()}`, { month: "short" }).format(new Date()).replace(".", "")}</Text></View></View>
      </View><View style={styles.sortRow}><Text style={[styles.sortLabel, { color: colors.muted }]}>{t("sort")}</Text><Pressable onPress={() => setSortMode("schedule")} style={({ pressed }) => [styles.sortChip, { backgroundColor: sortMode === "schedule" ? `${colors.primary}18` : colors.surface, borderColor: sortMode === "schedule" ? colors.primary : colors.border }, pressed && styles.pressed]}><Text style={[styles.sortText, { color: sortMode === "schedule" ? colors.primary : colors.foreground }]}>{t("byDueDate")}</Text></Pressable><Pressable onPress={() => setSortMode("priority")} style={({ pressed }) => [styles.sortChip, { backgroundColor: sortMode === "priority" ? `${colors.primary}18` : colors.surface, borderColor: sortMode === "priority" ? colors.primary : colors.border }, pressed && styles.pressed]}><MaterialIcons name="flag" size={14} color={sortMode === "priority" ? colors.primary : colors.muted} /><Text style={[styles.sortText, { color: sortMode === "priority" ? colors.primary : colors.foreground }]}>{t("priority")}</Text></Pressable></View></>}
      ListEmptyComponent={<View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}18` }]}><MaterialIcons name="task-alt" size={28} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{isReady ? t("allUnderControl") : t("loadingTasks")}</Text><Text style={[styles.emptyText, { color: colors.muted }]}>{isReady ? t("addFirstTask") : ""}</Text></View>}
      renderItem={({ item }) => item.type === "header" ? <View style={styles.groupHeader}>{item.emoji ? <Text style={styles.groupEmoji}>{item.emoji}</Text> : item.pinned ? <MaterialIcons name="push-pin" size={15} color={colors.primary} /> : <MaterialIcons name="folder-off" size={15} color={colors.muted} />}<Text style={[styles.groupTitle, { color: item.pinned ? colors.primary : colors.muted }]}>{item.title.toUpperCase()}</Text><Text style={[styles.groupCount, { color: colors.muted }]}>{item.count}</Text></View> : <TaskRow task={item.task} list={getList(item.task.listId)} folder={getFolder(item.task.folderId)} tags={item.task.tagIds.map((id) => getTag(id)).filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))} onToggle={() => toggleTask(item.task.id)} onPress={() => openTask(item.task)} />}
      ItemSeparatorComponent={() => <View style={{ height: 9 }} />}
    />
    <Pressable accessibilityRole="button" accessibilityLabel={t("createTask")} onPress={openNew} style={({ pressed }) => [styles.fab, { backgroundColor: colors.primary }, pressed && styles.fabPressed]}><MaterialIcons name="add" size={28} color="#FFFFFF" /><Text style={styles.fabText}>{t("task")}</Text></Pressable>
    <TaskEditorSheet visible={editorOpen} task={editingTask} onClose={() => setEditorOpen(false)} />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 108, gap: 0 }, top: { marginBottom: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, eyebrow: { marginBottom: 8, fontSize: 11, fontWeight: "800", letterSpacing: 1.3 }, title: { fontSize: 32, lineHeight: 39, fontWeight: "800", letterSpacing: -0.7 }, subtitle: { marginTop: 5, fontSize: 15, lineHeight: 21 }, headerActions: { flexDirection: "row", alignItems: "center", gap: 8 }, searchAction: { width: 42, height: 42, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" }, dateBadge: { width: 57, height: 64, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" }, dayNumber: { fontSize: 22, fontWeight: "800", lineHeight: 25 }, month: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" }, sortRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 7, marginBottom: 20 }, sortLabel: { marginRight: 2, fontSize: 10, fontWeight: "800", letterSpacing: 0.7 }, sortChip: { minHeight: 32, paddingHorizontal: 10, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", gap: 4 }, sortText: { fontSize: 12, fontWeight: "700" }, pressed: { opacity: 0.68 },
  groupHeader: { minHeight: 29, marginTop: 12, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 6 }, groupEmoji: { fontSize: 16 }, groupTitle: { flex: 1, fontSize: 11, fontWeight: "800", letterSpacing: 0.9 }, groupCount: { minWidth: 20, fontSize: 12, fontWeight: "700", textAlign: "right" }, empty: { marginTop: 6, borderWidth: StyleSheet.hairlineWidth, borderRadius: 24, padding: 28, alignItems: "center" }, emptyIcon: { height: 58, width: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", marginBottom: 15 }, emptyTitle: { fontSize: 18, fontWeight: "700" }, emptyText: { marginTop: 7, maxWidth: 235, textAlign: "center", fontSize: 14, lineHeight: 20 },
  fab: { position: "absolute", right: 20, bottom: 20, height: 54, borderRadius: 27, paddingHorizontal: 19, flexDirection: "row", alignItems: "center", gap: 8, elevation: 5, shadowColor: "#111827", shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }, fabPressed: { opacity: 0.86, transform: [{ scale: 0.97 }] }, fabText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
