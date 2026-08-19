import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { TaskEditorSheet } from "@/components/task-editor-sheet";
import { TaskRow } from "@/components/task-row";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";
import { priorityMeta } from "@/lib/task-priority";
import type { Task, TaskPriority, TaskTag } from "@/lib/tasks-context";
import { useTasks } from "@/lib/tasks-context";

type StatusFilter = "all" | "active" | "archive";
type PriorityFilter = "all" | TaskPriority;

export default function SearchScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const { tasks, tags, getList, getFolder, getTag, toggleTask } = useTasks();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [tagId, setTagId] = useState<string | undefined>();
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [editorOpen, setEditorOpen] = useState(false);
  const taskTags = (task: Task) => task.tagIds.map((id) => getTag(id)).filter((tag): tag is TaskTag => Boolean(tag));
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return tasks.filter((task) => {
      const matchesStatus = status === "all" || (status === "archive" ? Boolean(task.completedAt) : !task.completedAt);
      const matchesPriority = priority === "all" || task.priority === priority;
      const matchesTag = !tagId || task.tagIds.includes(tagId);
      const tagText = taskTags(task).map((tag) => tag.title).join(" ").toLocaleLowerCase();
      const matchesText = !term || `${task.title} ${task.notes} ${tagText}`.toLocaleLowerCase().includes(term);
      return matchesStatus && matchesPriority && matchesTag && matchesText;
    });
  }, [priority, query, status, tagId, tags, tasks]);

  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><FlatList data={results} keyExtractor={(item) => item.id} contentContainerStyle={styles.content}
    ListHeaderComponent={<><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-back" size={23} color={colors.foreground} /></Pressable><Text style={[styles.title, { color: colors.foreground }]}>{t("Поиск")}</Text></View><View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}><MaterialIcons name="search" size={20} color={colors.muted} /><TextInput autoFocus value={query} onChangeText={setQuery} placeholder={t("Название, заметка или тег")} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground }]} returnKeyType="search" />{query ? <Pressable onPress={() => setQuery("")}><MaterialIcons name="close" size={20} color={colors.muted} /></Pressable> : null}</View><Text style={[styles.filterLabel, { color: colors.muted }]}>{t("СТАТУС")}</Text><View style={styles.chips}>{([{ id: "all", label: "Все" }, { id: "active", label: "Активные" }, { id: "archive", label: "Архив" }] as { id: StatusFilter; label: string }[]).map((item) => <Pressable key={item.id} onPress={() => setStatus(item.id)} style={({ pressed }) => [styles.chip, { backgroundColor: status === item.id ? `${colors.primary}18` : colors.surface, borderColor: status === item.id ? colors.primary : colors.border }, pressed && styles.pressed]}><Text style={[styles.chipText, { color: status === item.id ? colors.primary : colors.foreground }]}>{t(item.label)}</Text></Pressable>)}</View><Text style={[styles.filterLabel, { color: colors.muted }]}>{t("ПРИОРИТЕТ")}</Text><View style={styles.chips}><Pressable onPress={() => setPriority("all")} style={({ pressed }) => [styles.chip, { backgroundColor: priority === "all" ? `${colors.primary}18` : colors.surface, borderColor: priority === "all" ? colors.primary : colors.border }, pressed && styles.pressed]}><Text style={[styles.chipText, { color: priority === "all" ? colors.primary : colors.foreground }]}>{t("Все")}</Text></Pressable>{(["high", "medium", "low", "none"] as TaskPriority[]).map((level) => { const meta = priorityMeta[level]; const tint = colors[meta.color]; return <Pressable key={level} onPress={() => setPriority(level)} style={({ pressed }) => [styles.chip, { backgroundColor: priority === level ? `${tint}18` : colors.surface, borderColor: priority === level ? tint : colors.border }, pressed && styles.pressed]}><Text style={[styles.chipText, { color: priority === level ? tint : colors.foreground }]}>{t(meta.label)}</Text></Pressable>; })}</View>{tags.length ? <><Text style={[styles.filterLabel, { color: colors.muted }]}>{t("ТЕГ")}</Text><View style={styles.chips}><Pressable onPress={() => setTagId(undefined)} style={({ pressed }) => [styles.chip, { backgroundColor: !tagId ? `${colors.primary}18` : colors.surface, borderColor: !tagId ? colors.primary : colors.border }, pressed && styles.pressed]}><Text style={[styles.chipText, { color: !tagId ? colors.primary : colors.foreground }]}>{t("Все теги")}</Text></Pressable>{tags.map((tag) => <Pressable key={tag.id} onPress={() => setTagId(tag.id)} style={({ pressed }) => [styles.chip, { backgroundColor: tagId === tag.id ? `${tag.color}18` : colors.surface, borderColor: tagId === tag.id ? tag.color : colors.border }, pressed && styles.pressed]}><View style={[styles.tagDot, { backgroundColor: tag.color }]} /><Text style={[styles.chipText, { color: tagId === tag.id ? tag.color : colors.foreground }]}>{tag.title}</Text></Pressable>)}</View></> : null}<Text style={[styles.results, { color: colors.muted }]}>{`${t("Найдено")}: ${results.length}`}</Text></>}
    ListEmptyComponent={<View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}><MaterialIcons name="search-off" size={28} color={colors.primary} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t("Ничего не найдено")}</Text><Text style={[styles.emptyText, { color: colors.muted }]}>{t("Измените запрос или условия фильтрации.")}</Text></View>}
    renderItem={({ item }) => <TaskRow task={item} list={getList(item.listId)} folder={getFolder(item.folderId)} tags={taskTags(item)} onToggle={() => toggleTask(item.id)} onPress={() => { setEditingTask(item); setEditorOpen(true); }} />}
    ItemSeparatorComponent={() => <View style={{ height: 9 }} />}
  /><TaskEditorSheet visible={editorOpen} task={editingTask} onClose={() => setEditorOpen(false)} /></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 34 }, header: { minHeight: 44, marginBottom: 14, flexDirection: "row", alignItems: "center", gap: 8 }, back: { width: 42, height: 42, alignItems: "center", justifyContent: "center", marginLeft: -10 }, title: { fontSize: 29, fontWeight: "800", letterSpacing: -0.6 }, inputWrap: { minHeight: 52, paddingHorizontal: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", gap: 10 }, input: { flex: 1, height: 50, fontSize: 16 }, filterLabel: { marginTop: 18, marginBottom: 7, fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { minHeight: 36, paddingHorizontal: 11, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", gap: 6 }, chipText: { fontSize: 13, fontWeight: "700" }, tagDot: { width: 7, height: 7, borderRadius: 4 }, results: { marginTop: 22, marginBottom: 11, fontSize: 13 }, pressed: { opacity: 0.68 }, empty: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 27, alignItems: "center" }, emptyTitle: { marginTop: 10, fontSize: 17, fontWeight: "700" }, emptyText: { marginTop: 6, fontSize: 14 }, });
