import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/use-colors";
import { TaskAttachmentsSection } from "@/components/task-attachments-section";
import { addDays, formatDateInput, formatTimeInput, maskDateInput, maskTimeInput, parseDateTimeInput } from "@/lib/date-utils";
import { deleteTaskAttachments } from "@/lib/task-attachment-storage";
import { priorityMeta } from "@/lib/task-priority";
import type { Task, TaskAttachment, TaskPriority, TaskRecurrence } from "@/lib/tasks-context";
import { useTasks } from "@/lib/tasks-context";
import { useI18n } from "@/lib/i18n";

type Props = { visible: boolean; task?: Task; initialFolderId?: string; onClose: () => void };

export function TaskEditorSheet({ visible, task, initialFolderId, onClose }: Props) {
  const colors = useColors();
  const { language, t } = useI18n();
  const ru = language === "ru";
  const { lists, folders, tags, inboxListId, addTask, updateTask, deleteTask, toggleTask } = useTasks();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [listId, setListId] = useState(inboxListId);
  const [folderId, setFolderId] = useState<string | undefined>();
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [isImportant, setIsImportant] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [priority, setPriority] = useState<TaskPriority>("none");
  const [recurrence, setRecurrence] = useState<TaskRecurrence>("none");
  const [dueText, setDueText] = useState("");
  const [timeText, setTimeText] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const timeInputRef = useRef<TextInput>(null);
  const pendingAttachmentsRef = useRef(new Map<string, TaskAttachment>());

  useEffect(() => {
    if (!visible) return;
    setTitle(task?.title ?? "");
    setNotes(task?.notes ?? "");
    setListId(task?.listId ?? inboxListId);
    setFolderId(task?.folderId ?? initialFolderId);
    setTagIds(task?.tagIds ?? []);
    setIsImportant(task?.isImportant ?? false);
    setIsPinned(task?.isPinned ?? false);
    setPriority(task?.priority ?? "none");
    setRecurrence(task?.recurrence ?? "none");
    setDueText(formatDateInput(task?.dueAt));
    setTimeText(formatTimeInput(task?.dueAt));
    setIsCompleted(Boolean(task?.completedAt));
    setAttachments(task?.attachments ?? []);
    pendingAttachmentsRef.current.clear();
  }, [inboxListId, initialFolderId, task, visible]);

  const validDate = useMemo(() => (!dueText ? true : Boolean(parseDateTimeInput(dueText, timeText))), [dueText, timeText]);

  const save = () => {
    const dueAt = dueText ? parseDateTimeInput(dueText, timeText) : undefined;
    if (!title.trim()) {
      Alert.alert(t("Добавьте название"), t("Введите короткое и понятное название задачи."));
      return;
    }
    if (!validDate) {
      Alert.alert(t("Проверьте дату"), t("Используйте формат ДД.ММ.ГГГГ, например 25.12.2026."));
      return;
    }
    const draft = { title, notes, listId, folderId, tagIds, isImportant, isPinned, priority, recurrence, dueAt, attachments };
    const existingAttachments = task?.attachments ?? [];
    const keptAttachmentIds = new Set(attachments.map((attachment) => attachment.id));
    const removedAttachments = [...existingAttachments.filter((attachment) => !keptAttachmentIds.has(attachment.id)), ...[...pendingAttachmentsRef.current.values()].filter((attachment) => !keptAttachmentIds.has(attachment.id))];
    if (task) { updateTask(task.id, draft); if (Boolean(task.completedAt) !== isCompleted) toggleTask(task.id); }
    else addTask(draft);
    if (removedAttachments.length) void deleteTaskAttachments(removedAttachments);
    pendingAttachmentsRef.current.clear();
    onClose();
  };

  const setQuickDate = (offset: number | null) => { setDueText(offset === null ? "" : formatDateInput(addDays(offset))); if (offset !== null && !timeText) setTimeText("09:00"); };
  const toggleTag = (id: string) => setTagIds((current) => current.includes(id) ? current.filter((tagId) => tagId !== id) : [...current, id]);
  const revealDeadlineFields = () => {
    requestAnimationFrame(() => scrollViewRef.current?.scrollToEnd({ animated: true }));
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 180);
  };
  const closeWithoutSaving = () => {
    const pendingAttachments = [...pendingAttachmentsRef.current.values()];
    if (pendingAttachments.length) void deleteTaskAttachments(pendingAttachments);
    pendingAttachmentsRef.current.clear();
    onClose();
  };

  const remove = () => {
    if (!task) return;
    Alert.alert(t("Удалить задачу?"), t("Это действие нельзя отменить."), [
      { text: t("Отмена"), style: "cancel" },
      { text: t("Удалить"), style: "destructive", onPress: () => { deleteTask(task.id); onClose(); } },
    ]);
  };

  return (
    <Modal animationType="slide" transparent={Platform.OS === "web"} visible={visible} onRequestClose={closeWithoutSaving} presentationStyle="pageSheet" statusBarTranslucent={false} navigationBarTranslucent={false}>
      <View style={[styles.backdrop, Platform.OS === "web" && styles.webBackdrop]}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}> 
          <SafeAreaView edges={["top"]} style={[styles.safeHeader, { backgroundColor: colors.background }]}><View style={styles.header}>
              <Pressable onPress={closeWithoutSaving} style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}><Text style={[styles.headerText, { color: colors.muted }]}>{t("Отмена")}</Text></Pressable>
              <Text style={[styles.heading, { color: colors.foreground }]}>{task ? t("Изменить задачу") : t("Новая задача")}</Text>
              <Pressable onPress={save} style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}><Text style={[styles.headerText, { color: colors.primary }]}>{t("Готово")}</Text></Pressable>
          </View></SafeAreaView>
          <SafeAreaView edges={["bottom"]} style={styles.bodySafeArea}>
          <KeyboardAvoidingView style={styles.keyboardAvoider} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView ref={scrollViewRef} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"} contentContainerStyle={styles.scrollContent}>
            <TextInput autoFocus={!task} value={title} onChangeText={setTitle} placeholder={t("Что нужно сделать?")} placeholderTextColor={colors.muted} style={[styles.titleInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} returnKeyType="done" onSubmitEditing={save} />
            <TextInput value={notes} onChangeText={setNotes} placeholder={t("Заметка (необязательно)")} placeholderTextColor={colors.muted} multiline style={[styles.notesInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} />
            <TaskAttachmentsSection attachments={attachments} onChange={setAttachments} onAdded={(added) => added.forEach((attachment) => pendingAttachmentsRef.current.set(attachment.id, attachment))} />
            {task ? <Pressable onPress={() => setIsCompleted((value) => !value)} style={({ pressed }) => [styles.importantToggle, { borderColor: isCompleted ? colors.success : colors.border, backgroundColor: isCompleted ? `${colors.success}18` : colors.surface }, pressed && styles.pressed]}><MaterialIcons name={isCompleted ? "check-circle" : "radio-button-unchecked"} size={18} color={isCompleted ? colors.success : colors.muted} /><Text style={[styles.importantText, { color: isCompleted ? colors.success : colors.foreground }]}>{isCompleted ? t("Выполнено") : t("Отметить выполненной")}</Text></Pressable> : null}
            <Pressable onPress={() => setIsImportant((current) => !current)} style={({ pressed }) => [styles.importantToggle, { borderColor: isImportant ? colors.warning : colors.border, backgroundColor: isImportant ? `${colors.warning}18` : colors.surface }, pressed && styles.pressed]}><MaterialIcons name={isImportant ? "star" : "star-border"} size={18} color={isImportant ? colors.warning : colors.muted} /><Text style={[styles.importantText, { color: isImportant ? colors.warning : colors.foreground }]}>{t("Важно")}</Text></Pressable>
            <Pressable onPress={() => setIsPinned((current) => !current)} style={({ pressed }) => [styles.importantToggle, { borderColor: isPinned ? colors.primary : colors.border, backgroundColor: isPinned ? `${colors.primary}18` : colors.surface }, pressed && styles.pressed]}><MaterialIcons name="push-pin" size={18} color={isPinned ? colors.primary : colors.muted} /><Text style={[styles.importantText, { color: isPinned ? colors.primary : colors.foreground }]}>{isPinned ? t("Закреплена вверху") : t("Закрепить вверху")}</Text></Pressable>
            <Text style={[styles.label, { color: colors.muted }]}>{t("ПРИОРИТЕТ")}</Text>
            <View style={styles.choiceWrap}>{(["high", "medium", "low", "none"] as TaskPriority[]).map((level) => { const meta = priorityMeta[level]; const tint = colors[meta.color]; const selected = priority === level; return <Pressable key={level} onPress={() => setPriority(level)} style={({ pressed }) => [styles.choice, { borderColor: selected ? tint : colors.border, backgroundColor: selected ? `${tint}18` : colors.surface }, pressed && styles.pressed]}><MaterialIcons name={level === "none" ? "remove" : "flag"} size={15} color={tint} /><Text style={[styles.choiceText, { color: colors.foreground }]}>{meta.label}</Text>{selected ? <MaterialIcons name="check" size={15} color={tint} /> : null}</Pressable>; })}</View>
            <Text style={[styles.label, { color: colors.muted }]}>{t("ПОВТОРЕНИЕ")}</Text>
            <View style={styles.choiceWrap}>{([{ id: "none", label: t("Без повторения") }, { id: "daily", label: t("Каждый день") }, { id: "weekly", label: t("Каждую неделю") }] as { id: TaskRecurrence; label: string }[]).map((item) => { const selected = recurrence === item.id; return <Pressable key={item.id} onPress={() => setRecurrence(item.id)} style={({ pressed }) => [styles.choice, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? `${colors.primary}18` : colors.surface }, pressed && styles.pressed]}><MaterialIcons name={item.id === "none" ? "remove" : "repeat"} size={15} color={selected ? colors.primary : colors.muted} /><Text style={[styles.choiceText, { color: colors.foreground }]}>{item.label}</Text>{selected ? <MaterialIcons name="check" size={15} color={colors.primary} /> : null}</Pressable>; })}</View>
            <Text style={[styles.label, { color: colors.muted }]}>{t("СПИСОК")}</Text>
            <View style={styles.choiceWrap}>
              {lists.map((list) => (
                <Pressable key={list.id} onPress={() => setListId(list.id)} style={({ pressed }) => [styles.choice, { borderColor: listId === list.id ? list.color : colors.border, backgroundColor: listId === list.id ? `${list.color}18` : colors.surface }, pressed && styles.pressed]}>
                  <View style={[styles.listDot, { backgroundColor: list.color }]} /><Text style={[styles.choiceText, { color: colors.foreground }]}>{list.title}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.muted }]}>{t("ПАПКА")}</Text>
            <View style={styles.choiceWrap}>
              <Pressable onPress={() => setFolderId(undefined)} style={({ pressed }) => [styles.choice, { borderColor: !folderId ? colors.primary : colors.border, backgroundColor: !folderId ? `${colors.primary}18` : colors.surface }, pressed && styles.pressed]}><MaterialIcons name="folder-off" size={16} color={!folderId ? colors.primary : colors.muted} /><Text style={[styles.choiceText, { color: colors.foreground }]}>{t("Без папки")}</Text></Pressable>
              {folders.map((folder) => <Pressable key={folder.id} onPress={() => setFolderId(folder.id)} style={({ pressed }) => [styles.choice, { borderColor: folderId === folder.id ? folder.color : colors.border, backgroundColor: folderId === folder.id ? `${folder.color}18` : colors.surface }, pressed && styles.pressed]}><Text style={styles.folderEmoji}>{folder.emoji}</Text><Text style={[styles.choiceText, { color: colors.foreground }]}>{folder.title}</Text>{folder.isPinned ? <MaterialIcons name="push-pin" size={13} color={folder.color} /> : null}</Pressable>)}
            </View>
            <Text style={[styles.label, { color: colors.muted }]}>{t("ТЕГИ")}</Text>
            {tags.length === 0 ? <Text style={[styles.emptyHint, { color: colors.muted }]}>{t("Создайте теги в разделе «Списки», чтобы назначать их задачам.")}</Text> : <View style={styles.choiceWrap}>{tags.map((tag) => { const selected = tagIds.includes(tag.id); return <Pressable key={tag.id} onPress={() => toggleTag(tag.id)} style={({ pressed }) => [styles.choice, { borderColor: selected ? tag.color : colors.border, backgroundColor: selected ? `${tag.color}18` : colors.surface }, pressed && styles.pressed]}><View style={[styles.listDot, { backgroundColor: tag.color }]} /><Text style={[styles.choiceText, { color: colors.foreground }]}>{tag.title}</Text>{selected ? <MaterialIcons name="check" size={15} color={tag.color} /> : null}</Pressable>; })}</View>}
            <Text style={[styles.label, { color: colors.muted }]}>{t("СРОК ВЫПОЛНЕНИЯ")}</Text>
            <View style={styles.quickDates}>
              {[{ label: t("Сегодня"), offset: 0 }, { label: t("Завтра"), offset: 1 }, { label: t("Неделя"), offset: 7 }, { label: t("Без срока"), offset: null }].map((item) => (
                <Pressable key={item.label} onPress={() => setQuickDate(item.offset)} style={({ pressed }) => [styles.quickButton, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}><Text style={[styles.quickText, { color: colors.foreground }]}>{item.label}</Text></Pressable>
              ))}
            </View>
            <View style={[styles.dateInputWrap, { borderColor: validDate ? colors.border : colors.error, backgroundColor: colors.surface }]}> 
              <MaterialIcons name="calendar-today" size={18} color={validDate ? colors.muted : colors.error} />
              <TextInput value={dueText} onChangeText={(value) => setDueText(maskDateInput(value, dueText))} onFocus={revealDeadlineFields} placeholder="ДД.ММ.ГГГГ" placeholderTextColor={colors.muted} keyboardType="number-pad" maxLength={10} returnKeyType="next" onSubmitEditing={() => timeInputRef.current?.focus()} style={[styles.dateInput, { color: colors.foreground }]} />
            </View>
            <View style={[styles.dateInputWrap, { borderColor: validDate ? colors.border : colors.error, backgroundColor: colors.surface }]}><MaterialIcons name="schedule" size={18} color={validDate ? colors.muted : colors.error} /><TextInput ref={timeInputRef} value={timeText} onChangeText={(value) => setTimeText(maskTimeInput(value, timeText))} onFocus={revealDeadlineFields} placeholder={t("Время, например 18:30")} placeholderTextColor={colors.muted} keyboardType="number-pad" maxLength={5} returnKeyType="done" onSubmitEditing={save} style={[styles.dateInput, { color: colors.foreground }]} /></View>
            {task ? <Pressable onPress={remove} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}><MaterialIcons name="delete-outline" size={18} color={colors.error} /><Text style={[styles.deleteText, { color: colors.error }]}>{t("Удалить задачу")}</Text></Pressable> : null}
          </ScrollView>
          </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 }, webBackdrop: { justifyContent: "flex-end", backgroundColor: "rgba(7, 12, 26, 0.36)" }, sheet: { flex: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
  safeHeader: { flexShrink: 0 }, bodySafeArea: { flex: 1 }, keyboardAvoider: { flex: 1 }, header: { minHeight: 60, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headerAction: { minWidth: 64, minHeight: 44, justifyContent: "center" }, headerText: { fontSize: 16, fontWeight: "600" }, heading: { fontSize: 17, fontWeight: "700" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 42, gap: 12 }, titleInput: { minHeight: 58, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, fontSize: 18, fontWeight: "700" }, notesInput: { minHeight: 104, borderWidth: 1, borderRadius: 16, padding: 16, textAlignVertical: "top", fontSize: 15, lineHeight: 21 },
  importantToggle: { marginTop: 2, minHeight: 42, paddingHorizontal: 13, alignSelf: "flex-start", borderRadius: 21, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 7 }, importantText: { fontSize: 14, fontWeight: "700" }, label: { marginTop: 14, marginBottom: 2, fontSize: 12, fontWeight: "800", letterSpacing: 0.75 }, choiceWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, choice: { minHeight: 40, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 7 }, folderEmoji: { fontSize: 16 }, listDot: { height: 8, width: 8, borderRadius: 4 }, choiceText: { fontSize: 14, fontWeight: "600" }, emptyHint: { marginTop: 1, fontSize: 13, lineHeight: 19 },
  quickDates: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, quickButton: { height: 38, paddingHorizontal: 12, borderRadius: 19, borderWidth: 1, justifyContent: "center" }, quickText: { fontSize: 14, fontWeight: "600" }, dateInputWrap: { marginTop: 4, height: 52, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 10 }, dateInput: { flex: 1, height: "100%", fontSize: 16 },
  deleteButton: { marginTop: 18, minHeight: 48, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, deleteText: { fontSize: 15, fontWeight: "700" }, pressed: { opacity: 0.65 },
});
