import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DraggableFlatList, { type RenderItemParams } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";
import type { TaskFolder } from "@/lib/tasks-context";
import { useTasks } from "@/lib/tasks-context";

type Props = { visible: boolean; onClose: () => void };

type FolderOrderRowProps = {
  folder: TaskFolder;
  drag: () => void;
  isActive: boolean;
  isDropTarget: boolean;
  isDimmed: boolean;
  label: string;
  pinnedLabel: string;
  dragHint: string;
};

function folderComparator(left: TaskFolder, right: TaskFolder) {
  return Number(right.isPinned) - Number(left.isPinned) || left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt);
}

function FolderOrderRow({
  folder,
  drag,
  isActive,
  isDropTarget,
  isDimmed,
  label,
  pinnedLabel,
  dragHint,
}: FolderOrderRowProps) {
  const colors = useColors();
  const activeProgress = useSharedValue(0);
  const dimmedProgress = useSharedValue(0);

  useEffect(() => {
    activeProgress.value = isActive
      ? withSpring(1, { damping: 22, stiffness: 310, mass: 0.45 })
      : withTiming(0, { duration: 150 });
    dimmedProgress.value = withTiming(isDimmed ? 1 : 0, { duration: 120 });
  }, [activeProgress, dimmedProgress, isActive, isDimmed]);

  const animatedRowStyle = useAnimatedStyle(() => ({
    opacity: 1 - dimmedProgress.value * 0.24,
    transform: [{ scale: 1 - activeProgress.value * 0.02 }],
    shadowOpacity: 0.06 + activeProgress.value * 0.18,
    shadowRadius: 5 + activeProgress.value * 8,
    shadowOffset: { width: 0, height: 2 + activeProgress.value * 5 },
    elevation: 1 + activeProgress.value * 7,
    zIndex: Math.round(activeProgress.value * 10),
  }));

  return (
    <Animated.View style={animatedRowStyle}>
      <Pressable
        onLongPress={drag}
        delayLongPress={180}
        disabled={isActive}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={`${label}: ${folder.title}`}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: isActive || isDropTarget ? `${colors.primary}14` : colors.surface,
            borderColor: isActive ? colors.primary : isDropTarget ? `${colors.primary}B8` : colors.border,
            borderWidth: isDropTarget ? 1.5 : StyleSheet.hairlineWidth,
          },
          pressed && !isActive && styles.pressed,
        ]}
      >
        <MaterialIcons name="drag-indicator" size={23} color={isActive ? colors.primary : colors.muted} />
        <Text style={styles.emoji}>{folder.emoji}</Text>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.foreground }]}>{folder.title}</Text>
          <Text style={[styles.note, { color: isDropTarget ? colors.primary : colors.muted }]}>
            {isDropTarget ? dragHint : folder.isPinned ? pinnedLabel : dragHint}
          </Text>
        </View>
        {folder.isPinned ? <MaterialIcons name="push-pin" size={16} color={colors.primary} /> : null}
        {isDropTarget ? <MaterialIcons name="south" size={18} color={colors.primary} /> : null}
      </Pressable>
    </Animated.View>
  );
}

export function FolderOrderSheet({ visible, onClose }: Props) {
  const colors = useColors();
  const { t } = useI18n();
  const { folders, reorderFolders } = useTasks();
  const orderedFolders = useMemo(() => [...folders].sort(folderComparator), [folders]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(style);
    }
  };

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<TaskFolder>) => {
    const index = getIndex() ?? -1;
    return (
      <FolderOrderRow
        folder={item}
        drag={drag}
        isActive={isActive}
        isDropTarget={activeFolderId !== null && dropTargetIndex === index && !isActive}
        isDimmed={activeFolderId !== null && activeFolderId !== item.id && dropTargetIndex !== index}
        label={t("Порядок папок")}
        pinnedLabel={t("Закреплена вверху")}
        dragHint={t("Удерживайте и перетаскивайте")}
      />
    );
  };

  return (
    <Modal animationType="slide" transparent={Platform.OS === "web"} visible={visible} onRequestClose={onClose} presentationStyle="pageSheet">
      <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={[styles.backdrop, Platform.OS === "web" && styles.webBackdrop]}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <SafeAreaView edges={["top"]} style={[styles.safeHeader, { backgroundColor: colors.background }]}>
              <View style={styles.header}>
                <View style={styles.headerAction} />
                <Text style={[styles.heading, { color: colors.foreground }]}>{t("Порядок папок")}</Text>
                <Pressable onPress={onClose} style={({ pressed }) => [styles.headerAction, styles.doneAction, pressed && styles.pressed]}>
                  <Text style={[styles.done, { color: colors.primary }]}>{t("Готово")}</Text>
                </Pressable>
              </View>
            </SafeAreaView>
            <Text style={[styles.intro, { color: colors.muted }]}>{t("Удерживайте папку за карточку и перетаскивайте её. Закреплённые папки остаются в верхней группе.")}</Text>
            <DraggableFlatList
              data={orderedFolders}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              activationDistance={4}
              dragItemOverflow={false}
              autoscrollThreshold={64}
              animationConfig={{ damping: 24, stiffness: 280, mass: 0.45 }}
              onDragBegin={(index) => {
                setActiveFolderId(orderedFolders[index]?.id ?? null);
                setDropTargetIndex(index);
                triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
              }}
              onPlaceholderIndexChange={(index) => setDropTargetIndex(index >= 0 ? index : null)}
              onRelease={() => triggerHaptic(Haptics.ImpactFeedbackStyle.Light)}
              onDragEnd={({ data }) => {
                setActiveFolderId(null);
                setDropTargetIndex(null);
                reorderFolders(data.map((folder) => folder.id));
              }}
            />
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },
  backdrop: { flex: 1 },
  webBackdrop: { justifyContent: "flex-end", backgroundColor: "rgba(7, 12, 26, 0.36)" },
  sheet: { flex: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
  safeHeader: { flexShrink: 0 },
  header: { minHeight: 60, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerAction: { minWidth: 68, minHeight: 44, justifyContent: "center" },
  doneAction: { alignItems: "flex-end" },
  heading: { flex: 1, fontSize: 17, fontWeight: "800", textAlign: "center" },
  done: { fontSize: 16, fontWeight: "700" },
  intro: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, fontSize: 14, lineHeight: 20 },
  listContent: { paddingHorizontal: 20, paddingBottom: 34, gap: 9 },
  row: { minHeight: 68, paddingHorizontal: 13, borderRadius: 17, flexDirection: "row", alignItems: "center", gap: 10 },
  emoji: { fontSize: 23 },
  copy: { flex: 1 },
  title: { fontSize: 16, fontWeight: "800" },
  note: { marginTop: 3, fontSize: 12.5 },
  pressed: { opacity: 0.7 },
});
