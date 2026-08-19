import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useRef, useState } from "react";
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { CategoryEditorSheet } from "@/components/category-editor-sheet";
import { FolderOrderSheet } from "@/components/folder-order-sheet";
import { FolderTemplatePickerSheet } from "@/components/folder-template-picker-sheet";
import { ListEditorSheet } from "@/components/list-editor-sheet";
import { ScreenContainer } from "@/components/screen-container";
import { TaskEditorSheet } from "@/components/task-editor-sheet";
import { TemplateEditorSheet } from "@/components/template-editor-sheet";
import { TaskRow } from "@/components/task-row";
import { useColors } from "@/hooks/use-colors";
import { isOverdue } from "@/lib/date-utils";
import { formatActiveTaskCount } from "@/lib/localized-format";
import { folderCovers } from "@/lib/folder-covers";
import { useI18n } from "@/lib/i18n";
import type { Task, TaskFolder, TaskList, TaskTag, TaskTemplate } from "@/lib/tasks-context";
import { useTasks } from "@/lib/tasks-context";

type CategoryKind = "folder" | "tag";
type EntityKind = CategoryKind | "list";
type SelectedEntity = { kind: EntityKind; id: string };
type CategoryEntity = TaskFolder | TaskTag;
type CatalogRow = { id: string; type: "heading"; title: string; action: EntityKind } | { id: string; type: "entity"; kind: EntityKind; entity: TaskFolder | TaskTag | TaskList };
type SmartFilter = "important" | "without-folder" | "without-tag";

export default function ListsScreen() {
  const colors = useColors();
  const { language, t } = useI18n();
  const { lists, folders, tags, tasks, getList, getFolder, getTag, toggleTask, updateTask, toggleFolderPinned, createTaskFromTemplate, deleteFolder } = useTasks();
  const [selected, setSelected] = useState<SelectedEntity | undefined>();
  const [taskEditor, setTaskEditor] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [initialTaskFolderId, setInitialTaskFolderId] = useState<string | undefined>();
  const [listEditor, setListEditor] = useState(false);
  const [editingList, setEditingList] = useState<TaskList | undefined>();
  const [categoryEditor, setCategoryEditor] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryEntity | undefined>();
  const [categoryKind, setCategoryKind] = useState<CategoryKind>("folder");
  const [query, setQuery] = useState("");
  const [smartFilter, setSmartFilter] = useState<SmartFilter | undefined>();
  const [movingTask, setMovingTask] = useState<Task | undefined>();
  const [templateEditor, setTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | undefined>();
  const [templatePickerFolder, setTemplatePickerFolder] = useState<TaskFolder | undefined>();
  const [folderOrderOpen, setFolderOrderOpen] = useState(false);
  const longPressFolderId = useRef<string | undefined>(undefined);
  const smartFilters: { id: SmartFilter; label: string; icon: "star" | "folder-off" | "sell" }[] = [{ id: "important", label: t("Важно"), icon: "star" }, { id: "without-folder", label: t("Без папки"), icon: "folder-off" }, { id: "without-tag", label: t("Без тега"), icon: "sell" }];
  const activeTaskLabel = (count: number) => formatActiveTaskCount(count, language);

  const catalog = useMemo<CatalogRow[]>(() => [
    { id: "heading-folders", type: "heading", title: t("ПАПКИ"), action: "folder" },
    ...[...folders].sort((left, right) => Number(right.isPinned) - Number(left.isPinned) || left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt)).map((entity) => ({ id: `folder-${entity.id}`, type: "entity" as const, kind: "folder" as const, entity })),
    { id: "heading-tags", type: "heading", title: t("ТЕГИ"), action: "tag" },
    ...tags.map((entity) => ({ id: `tag-${entity.id}`, type: "entity" as const, kind: "tag" as const, entity })),
    { id: "heading-lists", type: "heading", title: t("СПИСКИ"), action: "list" },
    ...lists.map((entity) => ({ id: `list-${entity.id}`, type: "entity" as const, kind: "list" as const, entity })),
  ], [folders, lists, t, tags]);

  const active = useMemo(() => {
    if (!selected) return undefined;
    if (selected.kind === "folder") return folders.find((folder) => folder.id === selected.id);
    if (selected.kind === "tag") return tags.find((tag) => tag.id === selected.id);
    return lists.find((list) => list.id === selected.id);
  }, [folders, lists, selected, tags]);

  const visibleTasks = useMemo(() => {
    if (!selected) return [];
    return tasks.filter((task) => !task.completedAt && (
      selected.kind === "folder" ? task.folderId === selected.id : selected.kind === "tag" ? task.tagIds.includes(selected.id) : task.listId === selected.id
    ));
  }, [selected, tasks]);

  const taskTags = (task: Task) => task.tagIds.map((id) => getTag(id)).filter((tag): tag is TaskTag => Boolean(tag));
  const resultTasks = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return tasks.filter((task) => {
      if (task.completedAt) return false;
      const tagText = taskTags(task).map((tag) => tag.title).join(" ").toLocaleLowerCase();
      const textMatches = !term || `${task.title} ${task.notes} ${tagText}`.toLocaleLowerCase().includes(term);
      const filterMatches = !smartFilter || (smartFilter === "important" ? task.isImportant : smartFilter === "without-folder" ? !task.folderId : task.tagIds.length === 0);
      return textMatches && filterMatches;
    });
  }, [query, smartFilter, tasks, tags]);

  const openCreate = (kind: EntityKind) => {
    if (kind === "list") { setEditingList(undefined); setListEditor(true); return; }
    setCategoryKind(kind); setEditingCategory(undefined); setCategoryEditor(true);
  };

  const clearSearch = () => { setQuery(""); setSmartFilter(undefined); };
  const moveTaskTo = (folderId?: string) => { if (movingTask) updateTask(movingTask.id, { folderId }); setMovingTask(undefined); };
  const openNewTask = (folderId?: string) => { setEditingTask(undefined); setInitialTaskFolderId(folderId); setTaskEditor(true); };
  const confirmDeleteFolder = (folder: TaskFolder) => {
    const linkedCount = tasks.filter((task) => task.folderId === folder.id).length;
    Alert.alert("Удалить папку?", linkedCount ? `${linkedCount} ${linkedCount === 1 ? "задача останется" : "задач останутся"} в приложении без папки.` : "Задач в этой папке нет.", [{ text: "Отмена", style: "cancel" }, { text: "Удалить", style: "destructive", onPress: () => deleteFolder(folder.id) }]);
  };

  if (selected && active) {
    const selectedKind = selected.kind;
    const editCurrent = () => {
      if (selectedKind === "list") { setEditingList(active as TaskList); setListEditor(true); }
      else { setCategoryKind(selectedKind); setEditingCategory(active as CategoryEntity); setCategoryEditor(true); }
    };
    const folder = selectedKind === "folder" ? active as TaskFolder : undefined;
    const icon = selectedKind === "tag" ? "sell" : "list-alt";
    const overdueCount = folder ? tasks.filter((task) => !task.completedAt && task.folderId === folder.id && isOverdue(task.dueAt)).length : 0;
    const openTemplateEditor = (template?: TaskTemplate) => { setEditingTemplate(template); setTemplateEditor(true); };
    return <ScreenContainer><FlatList data={visibleTasks} keyExtractor={(item) => item.id} contentContainerStyle={styles.content}
      ListHeaderComponent={<><View style={styles.detailHeader}><Pressable onPress={() => setSelected(undefined)} style={styles.back}><MaterialIcons name="arrow-back" size={22} color={colors.foreground} /></Pressable><Pressable onPress={editCurrent} style={styles.detailTitle}><View style={[styles.detailIcon, { backgroundColor: `${active.color}20` }]}>{folder ? <Text style={styles.detailEmoji}>{folder.emoji}</Text> : <MaterialIcons name={icon} size={17} color={active.color} />}</View><Text numberOfLines={1} style={[styles.detailTitleText, { color: colors.foreground }]}>{active.title}</Text></Pressable>{folder ? <Pressable onPress={editCurrent} style={[styles.pinAction, { backgroundColor: colors.surface, borderColor: colors.border }]}><MaterialIcons name="edit" size={17} color={colors.foreground} /></Pressable> : null}{folder ? <Pressable onPress={() => toggleFolderPinned(folder.id)} style={[styles.pinAction, { backgroundColor: folder.isPinned ? `${colors.primary}18` : colors.surface, borderColor: folder.isPinned ? colors.primary : colors.border }]}><MaterialIcons name="push-pin" size={17} color={folder.isPinned ? colors.primary : colors.muted} /></Pressable> : null}<Pressable onPress={() => { setEditingTask(undefined); setTaskEditor(true); }} style={[styles.add, { backgroundColor: colors.primary }]}><MaterialIcons name="add" size={22} color="#FFFFFF" /></Pressable></View>{folder ? <><LinearGradient colors={folderCovers[folder.coverId].colors} style={styles.folderCover}><Text style={styles.coverEmoji}>{folder.emoji}</Text><View style={styles.coverCopy}><Text numberOfLines={1} ellipsizeMode="tail" style={styles.coverTitle}>{folder.title}</Text><Text numberOfLines={1} style={styles.coverSub}>{activeTaskLabel(visibleTasks.length)}</Text></View>{overdueCount ? <View style={styles.overdueBadge}><MaterialIcons name="error-outline" size={14} color="#FFFFFF" /><Text numberOfLines={1} style={styles.overdueText}>{`${overdueCount} проср.`}</Text></View> : null}</LinearGradient><View style={styles.templateSection}><View style={styles.templateHeader}><View><Text style={[styles.templateTitle, { color: colors.foreground }]}>Шаблоны</Text><Text style={[styles.templateSub, { color: colors.muted }]}>Быстрое добавление дел</Text></View><Pressable onPress={() => openTemplateEditor()} style={({ pressed }) => [styles.templateAdd, { backgroundColor: `${colors.primary}18` }, pressed && styles.pressed]}><MaterialIcons name="add" size={17} color={colors.primary} /><Text style={[styles.templateAddText, { color: colors.primary }]}>Шаблон</Text></Pressable></View>{folder.templates.length ? <View style={styles.templateList}>{folder.templates.map((template) => <View key={template.id} style={[styles.templateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Pressable onPress={() => createTaskFromTemplate(folder.id, template.id)} style={({ pressed }) => [styles.templateCreate, pressed && styles.pressed]}><MaterialIcons name="bolt" size={18} color={colors.primary} /><View style={styles.templateCopy}><Text numberOfLines={1} style={[styles.templateName, { color: colors.foreground }]}>{template.title}</Text><Text numberOfLines={1} style={[styles.templateNote, { color: colors.muted }]}>{template.notes || "Добавить из шаблона"}</Text></View></Pressable><Pressable onPress={() => openTemplateEditor(template)} style={styles.templateEdit}><MaterialIcons name="edit" size={18} color={colors.muted} /></Pressable></View>)}</View> : <Text style={[styles.noTemplates, { color: colors.muted }]}>Сохраните повторяющееся дело как шаблон, чтобы добавлять его одним касанием.</Text>}</View></> : null}</>}
      ListEmptyComponent={<View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>{folder ? <Text style={styles.emptyEmoji}>{folder.emoji}</Text> : <MaterialIcons name={icon} size={27} color={active.color} />}<Text style={[styles.emptyTitle, { color: colors.foreground }]}>Здесь пока нет задач</Text><Text style={[styles.emptyText, { color: colors.muted }]}>Добавьте задачу и назначьте ей эту категорию.</Text></View>}
      renderItem={({ item }) => <TaskRow task={item} list={getList(item.listId)} folder={getFolder(item.folderId)} tags={taskTags(item)} onToggle={() => toggleTask(item.id)} onPress={() => { setEditingTask(item); setTaskEditor(true); }} onLongPress={selectedKind === "folder" ? () => setMovingTask(item) : undefined} />}
      ItemSeparatorComponent={() => <View style={{ height: 9 }} />}
    />
      <TaskEditorSheet visible={taskEditor} task={editingTask} initialFolderId={folder?.id} onClose={() => setTaskEditor(false)} />
      {folder ? <TemplateEditorSheet visible={templateEditor} folderId={folder.id} template={editingTemplate} onClose={() => setTemplateEditor(false)} /> : null}
      <ListEditorSheet visible={listEditor} list={editingList} onClose={() => setListEditor(false)} />
      <CategoryEditorSheet visible={categoryEditor} kind={categoryKind} entity={editingCategory} onClose={() => setCategoryEditor(false)} />
      <Modal visible={Boolean(movingTask)} transparent animationType="fade" onRequestClose={() => setMovingTask(undefined)}><View style={styles.modalBackdrop}><View style={[styles.moveSheet, { backgroundColor: colors.background }]}><Text style={[styles.moveTitle, { color: colors.foreground }]}>Переместить задачу</Text><Text numberOfLines={2} style={[styles.moveSubtitle, { color: colors.muted }]}>{movingTask?.title}</Text><Pressable onPress={() => moveTaskTo(undefined)} style={({ pressed }) => [styles.moveOption, { borderColor: colors.border }, pressed && styles.pressed]}><MaterialIcons name="folder-off" size={19} color={colors.muted} /><Text style={[styles.moveText, { color: colors.foreground }]}>Без папки</Text></Pressable>{[...folders].sort((left, right) => Number(right.isPinned) - Number(left.isPinned)).map((folder) => <Pressable key={folder.id} onPress={() => moveTaskTo(folder.id)} style={({ pressed }) => [styles.moveOption, { borderColor: colors.border }, pressed && styles.pressed]}><Text style={styles.moveEmoji}>{folder.emoji}</Text><Text style={[styles.moveText, { color: colors.foreground }]}>{folder.title}</Text>{folder.isPinned ? <MaterialIcons name="push-pin" size={15} color={folder.color} /> : null}{movingTask?.folderId === folder.id ? <MaterialIcons name="check" size={20} color={colors.primary} /> : null}</Pressable>)}<Pressable onPress={() => setMovingTask(undefined)} style={styles.cancelMove}><Text style={[styles.cancelMoveText, { color: colors.primary }]}>Отмена</Text></Pressable></View></View></Modal>
    </ScreenContainer>;
  }

  if (query.trim() || smartFilter) return <ScreenContainer><FlatList data={resultTasks} keyExtractor={(item) => item.id} contentContainerStyle={styles.content}
    ListHeaderComponent={<><View style={styles.searchHeader}><Pressable onPress={clearSearch} style={styles.back}><MaterialIcons name="arrow-back" size={22} color={colors.foreground} /></Pressable><View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}><MaterialIcons name="search" size={19} color={colors.muted} /><TextInput autoFocus value={query} onChangeText={setQuery} placeholder={t("Поиск по задачам и тегам")} placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.foreground }]} returnKeyType="search" /></View></View><Text style={[styles.resultsTitle, { color: colors.foreground }]}>{smartFilter ? smartFilters.find((filter) => filter.id === smartFilter)?.label : t("Результаты поиска")}</Text></>}
    ListEmptyComponent={<View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}><MaterialIcons name="search-off" size={27} color={colors.primary} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Ничего не найдено</Text><Text style={[styles.emptyText, { color: colors.muted }]}>Попробуйте другой запрос или снимите фильтр.</Text></View>}
    renderItem={({ item }) => <TaskRow task={item} list={getList(item.listId)} folder={getFolder(item.folderId)} tags={taskTags(item)} onToggle={() => toggleTask(item.id)} onPress={() => { setEditingTask(item); setTaskEditor(true); }} />}
    ItemSeparatorComponent={() => <View style={{ height: 9 }} />}
  /><TaskEditorSheet visible={taskEditor} task={editingTask} onClose={() => setTaskEditor(false)} /></ScreenContainer>;

  return <ScreenContainer><FlatList data={catalog} keyExtractor={(item) => item.id} contentContainerStyle={styles.content}
    ListHeaderComponent={<><View style={styles.header}><View><Text style={[styles.title, { color: colors.foreground }]}>{t("Организация")}</Text><Text style={[styles.subtitle, { color: colors.muted }]}>{t("Папки, теги и списки для задач")}</Text></View></View><View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}><MaterialIcons name="search" size={19} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder={t("Поиск по задачам и тегам")} placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.foreground }]} returnKeyType="search" /></View><View style={styles.filterRow}>{smartFilters.map((filter) => <Pressable key={filter.id} onPress={() => setSmartFilter(filter.id)} style={({ pressed }) => [styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}><MaterialIcons name={filter.icon} size={15} color={filter.id === "important" ? colors.warning : colors.primary} /><Text style={[styles.filterText, { color: colors.foreground }]}>{filter.label}</Text></Pressable>)}</View></>}
    renderItem={({ item }) => {
      if (item.type === "heading") return <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.muted }]}>{item.title}</Text><View style={styles.sectionActions}>{item.action === "folder" ? <Pressable accessibilityLabel={t("Порядок папок")} onPress={() => setFolderOrderOpen(true)} style={({ pressed }) => [styles.sectionAction, pressed && styles.pressed]}><MaterialIcons name="sort" size={17} color={colors.primary} /><Text style={[styles.sectionActionText, { color: colors.primary }]}>{t("Порядок")}</Text></Pressable> : null}<Pressable onPress={() => openCreate(item.action)} style={({ pressed }) => [styles.sectionAction, pressed && styles.pressed]}><MaterialIcons name="add" size={17} color={colors.primary} /><Text style={[styles.sectionActionText, { color: colors.primary }]}>{t(item.action === "folder" ? "Папка" : item.action === "tag" ? "Тег" : "Список")}</Text></Pressable></View></View>;
      const { entity } = item;
      const count = tasks.filter((task) => !task.completedAt && (item.kind === "folder" ? task.folderId === entity.id : item.kind === "tag" ? task.tagIds.includes(entity.id) : task.listId === entity.id)).length;
      const folderEntity: TaskFolder | undefined = item.kind === "folder" ? (entity as TaskFolder) : undefined;
      const icon = item.kind === "tag" ? "sell" : "list-alt";
      const overdue = folderEntity ? tasks.filter((task) => !task.completedAt && task.folderId === folderEntity.id && isOverdue(task.dueAt)).length : 0;
      if (folderEntity) return <View style={styles.folderCatalogOuter}><LinearGradient colors={folderCovers[folderEntity.coverId].colors} style={styles.folderCatalogCard}><Pressable onPress={() => { if (longPressFolderId.current === folderEntity.id) { longPressFolderId.current = undefined; return; } setSelected({ kind: item.kind, id: entity.id }); }} onLongPress={() => { longPressFolderId.current = folderEntity.id; setTemplatePickerFolder(folderEntity); }} delayLongPress={350} style={({ pressed }) => [styles.folderCardMain, pressed && styles.pressed]}><Text style={styles.folderCatalogEmoji}>{folderEntity.emoji}</Text><View style={styles.folderCatalogCopy}><View style={styles.folderCatalogTitleRow}><Text style={styles.folderCatalogName}>{folderEntity.title}</Text>{folderEntity.isPinned ? <MaterialIcons name="push-pin" size={14} color="#FFFFFF" /> : null}</View><Text style={styles.folderCatalogCount}>{activeTaskLabel(count)}</Text></View>{overdue ? <View style={styles.folderCatalogOverdue}><MaterialIcons name="error-outline" size={14} color="#FFFFFF" /><Text style={styles.folderCatalogOverdueText}>{`${overdue} проср.`}</Text></View> : null}</Pressable><Pressable accessibilityLabel={`Добавить задачу в папку ${folderEntity.title}`} onPress={() => openNewTask(folderEntity.id)} style={({ pressed }) => [styles.folderCardAction, styles.folderActionBorder, pressed && styles.pressed]}><MaterialIcons name="add" size={21} color="#FFFFFF" /></Pressable><Pressable accessibilityLabel={`Редактировать папку ${folderEntity.title}`} onPress={() => { setCategoryKind("folder"); setEditingCategory(folderEntity); setCategoryEditor(true); }} style={({ pressed }) => [styles.folderCardAction, styles.folderActionBorder, pressed && styles.pressed]}><MaterialIcons name="edit" size={18} color="#FFFFFF" /></Pressable><Pressable accessibilityLabel={`Удалить папку ${folderEntity.title}`} onPress={() => confirmDeleteFolder(folderEntity)} style={({ pressed }) => [styles.folderCardAction, pressed && styles.pressed]}><MaterialIcons name="delete-outline" size={19} color="#FFFFFF" /></Pressable></LinearGradient></View>;
      return <Pressable onPress={() => setSelected({ kind: item.kind, id: entity.id })} style={({ pressed }) => [styles.entityCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}><View style={[styles.iconCircle, { backgroundColor: `${entity.color}20` }]}><MaterialIcons name={icon} size={22} color={entity.color} /></View><View style={styles.entityCopy}><View style={styles.entityTitleRow}><Text style={[styles.entityName, { color: colors.foreground }]}>{entity.title}</Text></View><Text style={[styles.entityCount, { color: colors.muted }]}>{activeTaskLabel(count)}</Text></View><MaterialIcons name="chevron-right" size={23} color={colors.muted} /></Pressable>;
    }}
    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
  />
    <ListEditorSheet visible={listEditor} list={editingList} onClose={() => setListEditor(false)} />
    <CategoryEditorSheet visible={categoryEditor} kind={categoryKind} entity={editingCategory} onClose={() => setCategoryEditor(false)} />
    <TaskEditorSheet visible={taskEditor} task={editingTask} initialFolderId={initialTaskFolderId} onClose={() => { setTaskEditor(false); setInitialTaskFolderId(undefined); }} />
    <FolderTemplatePickerSheet visible={Boolean(templatePickerFolder)} folder={templatePickerFolder} onClose={() => setTemplatePickerFolder(undefined)} />
    <FolderOrderSheet visible={folderOrderOpen} onClose={() => setFolderOrderOpen(false)} />
  </ScreenContainer>;
}

const styles: Record<string, any> = StyleSheet.create({
  content: { padding: 20, paddingBottom: 34 }, header: { marginBottom: 20 }, title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.6 }, subtitle: { marginTop: 4, fontSize: 15 }, pressed: { opacity: 0.7 }, searchBox: { minHeight: 48, paddingHorizontal: 14, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", gap: 9 }, searchInput: { flex: 1, height: 46, fontSize: 15 }, filterRow: { marginTop: 12, marginBottom: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 }, filterChip: { minHeight: 36, paddingHorizontal: 11, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", gap: 6 }, filterText: { fontSize: 13, fontWeight: "700" }, sectionHeader: { minHeight: 33, marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, sectionTitle: { fontSize: 11, fontWeight: "800", letterSpacing: 0.9 }, sectionActions: { flexDirection: "row", alignItems: "center", gap: 9 }, sectionAction: { minHeight: 32, paddingHorizontal: 4, flexDirection: "row", alignItems: "center", gap: 3 }, sectionActionText: { fontSize: 13, fontWeight: "700" }, entityCard: { minHeight: 78, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 13 }, iconCircle: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" }, cardEmoji: { fontSize: 23 }, entityCopy: { flex: 1 }, entityTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 }, entityName: { fontSize: 16, fontWeight: "700" }, entityCount: { marginTop: 4, fontSize: 13 }, detailHeader: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 22 }, back: { height: 44, width: 40, alignItems: "center", justifyContent: "center", marginLeft: -8 }, detailTitle: { flex: 1, flexDirection: "row", alignItems: "center", gap: 9 }, detailIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" }, detailEmoji: { fontSize: 18 }, detailTitleText: { flex: 1, fontSize: 20, fontWeight: "800" }, pinAction: { width: 38, height: 38, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" }, add: { height: 44, width: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" }, empty: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 24, alignItems: "center" }, emptyEmoji: { fontSize: 29 }, emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: "700" }, emptyText: { marginTop: 6, fontSize: 14, textAlign: "center" }, searchHeader: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }, resultsTitle: { marginBottom: 12, fontSize: 20, fontWeight: "800" }, modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(7, 12, 26, 0.38)" }, moveSheet: { maxHeight: "72%", paddingHorizontal: 20, paddingTop: 22, paddingBottom: 28, borderTopLeftRadius: 26, borderTopRightRadius: 26 }, moveTitle: { fontSize: 20, fontWeight: "800" }, moveSubtitle: { marginTop: 5, marginBottom: 16, fontSize: 14, lineHeight: 20 }, moveOption: { minHeight: 50, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", gap: 11 }, moveEmoji: { fontSize: 19 }, moveText: { flex: 1, fontSize: 16, fontWeight: "600" }, cancelMove: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 8 }, cancelMoveText: { fontSize: 16, fontWeight: "700" },
});

Object.assign(styles, {
  folderCover: { width: "100%", maxWidth: "100%", alignSelf: "stretch", minHeight: 112, marginBottom: 20, padding: 16, borderRadius: 21, flexDirection: "row", alignItems: "center", gap: 12, overflow: "hidden" },
  coverEmoji: { flexShrink: 0, fontSize: 36 },
  coverCopy: { flex: 1, flexShrink: 1, minWidth: 0 },
  coverTitle: { flexShrink: 1, color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
  coverSub: { marginTop: 4, color: "rgba(255,255,255,0.84)", fontSize: 13, fontWeight: "600" },
  overdueBadge: { flexShrink: 0, minHeight: 28, paddingHorizontal: 9, borderRadius: 14, backgroundColor: "rgba(160, 35, 55, 0.92)", flexDirection: "row", alignItems: "center", gap: 4 },
  overdueText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  templateSection: { marginBottom: 20 },
  templateHeader: { marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  templateTitle: { fontSize: 18, fontWeight: "800" },
  templateSub: { marginTop: 3, fontSize: 12.5 },
  templateAdd: { minHeight: 34, paddingHorizontal: 10, borderRadius: 17, flexDirection: "row", alignItems: "center", gap: 4 },
  templateAddText: { fontSize: 12, fontWeight: "700" },
  templateList: { gap: 8 },
  templateCard: { minHeight: 62, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, flexDirection: "row", alignItems: "center" },
  templateCreate: { flex: 1, minHeight: 62, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 10 },
  templateCopy: { flex: 1 },
  templateName: { fontSize: 14, fontWeight: "700" },
  templateNote: { marginTop: 3, fontSize: 12 },
  templateEdit: { width: 46, height: 46, alignItems: "center", justifyContent: "center" },
  noTemplates: { paddingVertical: 12, fontSize: 13, lineHeight: 19 },
  folderCatalogOuter: { borderRadius: 19, overflow: "hidden" },
  folderCatalogCard: { minHeight: 84, flexDirection: "row", alignItems: "stretch" },
  folderCardMain: { flex: 1, paddingLeft: 15, flexDirection: "row", alignItems: "center", gap: 12 },
  folderCardAction: { width: 44, alignItems: "center", justifyContent: "center" },
  folderActionBorder: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: "rgba(255,255,255,0.34)" },
  folderCatalogEmoji: { fontSize: 29 },
  folderCatalogCopy: { flex: 1 },
  folderCatalogTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  folderCatalogName: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  folderCatalogCount: { marginTop: 4, color: "rgba(255,255,255,0.82)", fontSize: 12.5, fontWeight: "600" },
  folderCatalogOverdue: { minHeight: 28, paddingHorizontal: 8, borderRadius: 14, backgroundColor: "rgba(138, 24, 44, 0.88)", flexDirection: "row", alignItems: "center", gap: 4 },
  folderCatalogOverdueText: { color: "#FFFFFF", fontSize: 10.5, fontWeight: "800" },
});
