import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";
import { folderEmojiOptions, getDefaultFolderEmoji } from "@/lib/folder-icons";
import { folderCoverIds, folderCovers, type FolderCoverId } from "@/lib/folder-covers";
import type { TaskFolder, TaskTag } from "@/lib/tasks-context";
import { useTasks } from "@/lib/tasks-context";

const COLORS = ["#4659E8", "#9A55DE", "#E25D7B", "#E89642", "#2EAD75", "#2F9BBE"];
type CategoryKind = "folder" | "tag";
type Entity = TaskFolder | TaskTag;
type Props = { visible: boolean; kind: CategoryKind; entity?: Entity; onClose: () => void };

export function CategoryEditorSheet({ visible, kind, entity, onClose }: Props) {
  const colors = useColors();
  const { t } = useI18n();
  const { addFolder, updateFolder, deleteFolder, addTag, updateTag, deleteTag } = useTasks();
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [emoji, setEmoji] = useState("📁");
  const [isPinned, setIsPinned] = useState(false);
  const [coverId, setCoverId] = useState<FolderCoverId>("ocean");
  const noun = kind === "folder" ? "папку" : "тег";

  useEffect(() => {
    if (!visible) return;
    setTitle(entity?.title ?? "");
    setColor(entity?.color ?? COLORS[0]);
    setEmoji(kind === "folder" && entity && "emoji" in entity ? entity.emoji : getDefaultFolderEmoji(entity?.title ?? ""));
    setIsPinned(kind === "folder" && entity && "isPinned" in entity ? entity.isPinned : false);
    setCoverId(kind === "folder" && entity && "coverId" in entity ? entity.coverId : "ocean");
  }, [entity, visible]);

  const save = () => {
    if (!title.trim()) { Alert.alert("Добавьте название", `Введите название для ${noun}.`); return; }
    if (kind === "folder") {
      if (entity) updateFolder(entity.id, { title, color, emoji, isPinned, coverId }); else addFolder({ title, color, emoji, isPinned, coverId });
    } else if (entity) updateTag(entity.id, { title, color }); else addTag({ title, color });
    onClose();
  };

  const remove = () => {
    if (!entity) return;
    const impact = kind === "folder" ? "Задачи останутся в приложении без папки." : "Тег будет снят со всех задач.";
    Alert.alert(`Удалить ${noun}?`, impact, [
      { text: "Отмена", style: "cancel" },
      { text: "Удалить", style: "destructive", onPress: () => { if (kind === "folder") deleteFolder(entity.id); else deleteTag(entity.id); onClose(); } },
    ]);
  };

  return <Modal animationType="slide" transparent={Platform.OS === "web"} visible={visible} onRequestClose={onClose} presentationStyle="pageSheet" statusBarTranslucent={false} navigationBarTranslucent={false}>
    <View style={[styles.backdrop, Platform.OS === "web" && styles.webBackdrop]}><View style={[styles.sheet, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={["top"]} style={[styles.safeHeader, { backgroundColor: colors.background }]}><View style={styles.header}><Pressable onPress={onClose} style={styles.action}><Text style={[styles.actionText, { color: colors.muted }]}>{t("Отмена")}</Text></Pressable><Text style={[styles.heading, { color: colors.foreground }]}>{entity ? t(kind === "folder" ? "Изменить папку" : "Изменить тег") : t(kind === "folder" ? "Новая папка" : "Новый тег")}</Text><Pressable onPress={save} style={styles.action}><Text style={[styles.actionText, { color: colors.primary }]}>{t("Готово")}</Text></Pressable></View></SafeAreaView>
      <SafeAreaView edges={["bottom"]} style={styles.bodySafeArea}>
      <KeyboardAvoidingView style={styles.keyboardAvoider} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TextInput autoFocus value={title} onChangeText={setTitle} placeholder={t(kind === "folder" ? "Название папки" : "Название тега")} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} returnKeyType="done" onSubmitEditing={save} />
        {kind === "folder" ? <><Text style={[styles.label, { color: colors.muted }]}>{t("ЭМОДЗИ")}</Text><View style={styles.emojiPalette}>{folderEmojiOptions.map((item) => <Pressable key={item} onPress={() => setEmoji(item)} style={[styles.emojiChoice, { borderColor: emoji === item ? colors.primary : colors.border, backgroundColor: emoji === item ? `${colors.primary}18` : colors.surface }]}><Text style={styles.emoji}>{item}</Text></Pressable>)}</View><View style={[styles.emojiInputWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}><Text style={styles.emoji}>{emoji || "📁"}</Text><TextInput value={emoji} onChangeText={setEmoji} placeholder={t("Или введите свой эмодзи")} placeholderTextColor={colors.muted} style={[styles.emojiInput, { color: colors.foreground }]} maxLength={8} /></View><Text style={[styles.label, { color: colors.muted }]}>{t("ГРАДИЕНТНАЯ ОБЛОЖКА")}</Text><View style={styles.coverGrid}>{folderCoverIds.map((item) => <Pressable key={item} onPress={() => setCoverId(item)} style={({ pressed }) => [styles.coverOption, { borderColor: coverId === item ? colors.primary : "transparent" }, pressed && styles.pressed]}><LinearGradient colors={folderCovers[item].colors} style={styles.coverPreview}><Text style={styles.coverLabel}>{t(folderCovers[item].label)}</Text>{coverId === item ? <MaterialIcons name="check" size={17} color="#FFFFFF" /> : null}</LinearGradient></Pressable>)}</View><Pressable onPress={() => setIsPinned((current) => !current)} style={({ pressed }) => [styles.pinRow, { borderColor: isPinned ? colors.primary : colors.border, backgroundColor: isPinned ? `${colors.primary}18` : colors.surface }, pressed && styles.pressed]}><MaterialIcons name="push-pin" size={18} color={isPinned ? colors.primary : colors.muted} /><View style={styles.pinCopy}><Text style={[styles.pinTitle, { color: colors.foreground }]}>{t("Закрепить сверху")}</Text><Text style={[styles.pinSub, { color: colors.muted }]}>{t("Папка будет первой в списке")}</Text></View>{isPinned ? <MaterialIcons name="check" size={19} color={colors.primary} /> : null}</Pressable></> : null}
        <Text style={[styles.label, { color: colors.muted }]}>{t("ЦВЕТ")}</Text><View style={styles.palette}>{COLORS.map((item) => <Pressable key={item} onPress={() => setColor(item)} style={[styles.swatch, { backgroundColor: item, borderColor: color === item ? colors.foreground : "transparent" }]}>{color === item ? <MaterialIcons name="check" color="#FFFFFF" size={20} /> : null}</Pressable>)}</View>
        {entity ? <Pressable onPress={remove} style={styles.delete}><MaterialIcons name="delete-outline" size={18} color={colors.error} /><Text style={[styles.deleteText, { color: colors.error }]}>{`Удалить ${noun}`}</Text></Pressable> : null}
      </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View></View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 }, webBackdrop: { justifyContent: "flex-end", backgroundColor: "rgba(7, 12, 26, 0.36)" }, sheet: { flex: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28 }, safeHeader: { flexShrink: 0 }, bodySafeArea: { flex: 1 }, keyboardAvoider: { flex: 1 }, header: { minHeight: 60, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, action: { minWidth: 64, minHeight: 44, justifyContent: "center" }, actionText: { fontSize: 16, fontWeight: "600" }, heading: { fontSize: 17, fontWeight: "700" }, content: { padding: 20, paddingBottom: 36 }, input: { height: 58, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, fontSize: 17, fontWeight: "600" }, label: { marginTop: 24, marginBottom: 10, fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }, emojiPalette: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, emojiChoice: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" }, emoji: { fontSize: 21 }, emojiInputWrap: { height: 52, marginTop: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 9 }, emojiInput: { flex: 1, height: "100%", fontSize: 15 }, coverGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, coverOption: { width: "31%", borderRadius: 12, borderWidth: 2, overflow: "hidden" }, coverPreview: { minHeight: 54, paddingHorizontal: 8, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, coverLabel: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" }, pinRow: { minHeight: 60, marginTop: 14, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 10 }, pinCopy: { flex: 1 }, pinTitle: { fontSize: 15, fontWeight: "700" }, pinSub: { marginTop: 2, fontSize: 12 }, palette: { flexDirection: "row", gap: 12, flexWrap: "wrap" }, swatch: { width: 42, height: 42, borderRadius: 21, borderWidth: 3, alignItems: "center", justifyContent: "center" }, delete: { marginTop: 38, minHeight: 48, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }, deleteText: { fontSize: 15, fontWeight: "700" }, pressed: { opacity: 0.7 },
});
