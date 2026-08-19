import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/use-colors";
import { appLanguages, type AppLanguage } from "@/lib/languages";
import { useI18n } from "@/lib/i18n";

type Props = { visible: boolean; value: AppLanguage; onChange: (language: AppLanguage) => void; onClose: () => void };

export function LanguagePickerSheet({ visible, value, onChange, onClose }: Props) {
  const colors = useColors();
  const { t } = useI18n();
  return <Modal animationType="slide" transparent={Platform.OS === "web"} visible={visible} onRequestClose={onClose} presentationStyle="pageSheet" statusBarTranslucent={false}><View style={[styles.backdrop, Platform.OS === "web" && styles.webBackdrop]}><View style={[styles.sheet, { backgroundColor: colors.background }]}><SafeAreaView edges={["top"]} style={[styles.safeHeader, { backgroundColor: colors.background }]}><View style={styles.header}><Pressable onPress={onClose} style={styles.close}><Text style={[styles.closeText, { color: colors.primary }]}>{t("done")}</Text></Pressable><Text style={[styles.heading, { color: colors.foreground }]}>{t("languageTitle")}</Text><View style={styles.close} /></View></SafeAreaView><ScrollView contentContainerStyle={styles.content}>{appLanguages.map((language) => <Pressable key={language.id} onPress={() => { onChange(language.id); onClose(); }} style={({ pressed }) => [styles.row, { borderColor: colors.border, backgroundColor: language.id === value ? `${colors.primary}12` : colors.surface }, pressed && styles.pressed]}><Text style={styles.flag}>{language.flag}</Text><View style={styles.copy}><Text style={[styles.label, { color: colors.foreground }]}>{language.nativeLabel}</Text><Text style={[styles.subLabel, { color: colors.muted }]}>{language.label}</Text></View>{language.id === value ? <MaterialIcons name="check" size={21} color={colors.primary} /> : null}</Pressable>)}</ScrollView></View></View></Modal>;
}

const styles = StyleSheet.create({ backdrop: { flex: 1 }, webBackdrop: { justifyContent: "flex-end", backgroundColor: "rgba(7, 12, 26, 0.36)" }, sheet: { flex: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28 }, safeHeader: { flexShrink: 0 }, header: { minHeight: 60, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, close: { minWidth: 64, minHeight: 44, justifyContent: "center" }, closeText: { fontSize: 16, fontWeight: "700" }, heading: { fontSize: 17, fontWeight: "800" }, content: { padding: 20, gap: 9 }, row: { minHeight: 62, paddingHorizontal: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 12 }, flag: { fontSize: 24 }, copy: { flex: 1 }, label: { fontSize: 16, fontWeight: "700" }, subLabel: { marginTop: 2, fontSize: 12.5 }, pressed: { opacity: 0.7 } });
