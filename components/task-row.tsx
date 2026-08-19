import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatDueDate, isOverdue } from "@/lib/date-utils";
import { priorityMeta } from "@/lib/task-priority";
import type { Task, TaskFolder, TaskList, TaskTag } from "@/lib/tasks-context";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";

type Props = {
  task: Task;
  list?: TaskList;
  folder?: TaskFolder;
  tags?: TaskTag[];
  onToggle: () => void;
  onPress: () => void;
  onLongPress?: () => void;
};

export function TaskRow({ task, list, folder, tags = [], onToggle, onPress, onLongPress }: Props) {
  const colors = useColors();
  const { language, t } = useI18n();
  const completed = Boolean(task.completedAt);
  const overdue = !completed && isOverdue(task.dueAt);
  const priority = priorityMeta[task.priority];
  const priorityTint = colors[priority.color];

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={350} style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
      <Pressable
        accessibilityLabel={t(completed ? "Вернуть задачу в работу" : "Отметить задачу выполненной")}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        onPress={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        style={[styles.checkbox, { borderColor: completed ? colors.success : colors.border, backgroundColor: completed ? colors.success : "transparent" }]}
      >
        {completed ? <MaterialIcons name="check" size={16} color="#FFFFFF" /> : null}
      </Pressable>
      <View style={styles.content}>
        <Text numberOfLines={2} style={[styles.title, { color: colors.foreground }, completed && { color: colors.muted, textDecorationLine: "line-through" }]}>
          {task.title}
        </Text>
        {task.isImportant ? <View style={styles.important}><MaterialIcons name="star" size={13} color={colors.warning} /><Text style={[styles.importantText, { color: colors.warning }]}>{t("Важно")}</Text></View> : null}
        {task.priority !== "none" ? <View style={styles.priority}><MaterialIcons name="flag" size={12} color={priorityTint} /><Text style={[styles.priorityText, { color: priorityTint }]}>{t(priority.label)}</Text></View> : null}
        <View style={styles.metaRow}>
          <View style={[styles.dot, { backgroundColor: list?.color ?? colors.primary }]} />
          <Text style={[styles.meta, { color: colors.muted }]}>{list?.title ?? t("Входящие")}</Text>
          {task.dueAt ? (
            <>
              <Text style={[styles.separator, { color: colors.border }]}>•</Text>
              <Text style={[styles.meta, { color: overdue ? colors.error : colors.muted }]}>{formatDueDate(task.dueAt, language)}</Text>
            </>
          ) : null}
          {task.attachments.length ? <><Text style={[styles.separator, { color: colors.border }]}>•</Text><MaterialIcons name="attach-file" size={14} color={colors.muted} /><Text style={[styles.meta, { color: colors.muted }]}>{task.attachments.length}</Text></> : null}
        </View>
        {folder || tags.length ? <View style={styles.categoryRow}>{folder ? <View style={[styles.categoryPill, { backgroundColor: `${folder.color}18` }]}><Text style={styles.folderEmoji}>{folder.emoji}</Text><Text numberOfLines={1} style={[styles.categoryText, { color: folder.color }]}>{folder.title}</Text></View> : null}{tags.slice(0, 2).map((tag) => <View key={tag.id} style={[styles.categoryPill, { backgroundColor: `${tag.color}18` }]}><View style={[styles.tagDot, { backgroundColor: tag.color }]} /><Text numberOfLines={1} style={[styles.categoryText, { color: tag.color }]}>{tag.title}</Text></View>)}{tags.length > 2 ? <Text style={[styles.moreTags, { color: colors.muted }]}>{`+${tags.length - 2}`}</Text> : null}</View> : null}
      </View>
      {task.isPinned ? <MaterialIcons name="push-pin" size={17} color={colors.primary} /> : null}
      {onLongPress ? <MaterialIcons name="drag-handle" size={20} color={colors.muted} /> : null}
      <MaterialIcons name={language === "ar" ? "chevron-left" : "chevron-right"} size={22} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 72, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  pressed: { opacity: 0.72 },
  checkbox: { height: 24, width: 24, borderRadius: 12, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, gap: 6 },
  title: { fontSize: 16, fontWeight: "600", lineHeight: 21 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { height: 7, width: 7, borderRadius: 4 },
  meta: { fontSize: 12, fontWeight: "500" },
  separator: { fontSize: 12 },
  important: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: -2 }, importantText: { fontSize: 11, fontWeight: "700" }, priority: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: -2 }, priorityText: { fontSize: 11, fontWeight: "700" }, categoryRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 5, marginTop: 1 }, categoryPill: { maxWidth: 128, minHeight: 22, paddingHorizontal: 7, borderRadius: 11, flexDirection: "row", alignItems: "center", gap: 4 }, folderEmoji: { fontSize: 12 }, categoryText: { fontSize: 10.5, fontWeight: "700", flexShrink: 1 }, tagDot: { width: 6, height: 6, borderRadius: 3 }, moreTags: { fontSize: 11, fontWeight: "700" },
});
