import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";
import { getWeeklyCompletions, getWeeklySummary } from "@/lib/task-analytics";
import { useTasks } from "@/lib/tasks-context";

export default function StatisticsScreen() {
  const colors = useColors();
  const { language, t } = useI18n();
  const { tasks, settings } = useTasks();
  const completions = useMemo(() => getWeeklyCompletions(tasks, new Date(), language, settings.firstDayOfWeek), [language, settings.firstDayOfWeek, tasks]);
  const summary = useMemo(() => getWeeklySummary(completions), [completions]);
  const maxCount = Math.max(1, ...completions.map((day) => day.count));
  const bestCopy = summary.best?.count ? `${summary.best.label}, ${summary.best.count} ${t("tasks")}` : t("Пока нет выполненных задач");
  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><ScrollView contentContainerStyle={styles.content}><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-back" size={23} color={colors.foreground} /></Pressable><Text style={[styles.title, { color: colors.foreground }]}>{t("Статистика")}</Text></View><Text style={[styles.subtitle, { color: colors.muted }]}>{t("Последние 7 дней")}</Text>
    <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.summaryIcon, { backgroundColor: `${colors.success}18` }]}><MaterialIcons name="insights" size={24} color={colors.success} /></View><View style={styles.summaryCopy}><Text style={[styles.summaryValue, { color: colors.foreground }]}>{summary.total}</Text><Text style={[styles.summaryLabel, { color: colors.muted }]}>{t("выполнено за неделю")}</Text></View></View>
    <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.chartHeader}><View><Text style={[styles.chartTitle, { color: colors.foreground }]}>{t("Динамика выполнения")}</Text><Text style={[styles.chartSub, { color: colors.muted }]}>{t("Количество завершённых задач")}</Text></View></View><View style={styles.chart}>{completions.map((day) => { const height = day.count ? Math.max(14, Math.round((day.count / maxCount) * 138)) : 4; return <View key={day.key} style={styles.dayColumn}><Text style={[styles.count, { color: day.count ? colors.primary : colors.muted }]}>{day.count || ""}</Text><View style={styles.barTrack}><View style={[styles.bar, { height, backgroundColor: day.count ? colors.primary : colors.border }]} /></View><Text style={[styles.dayLabel, { color: colors.muted }]}>{day.label}</Text><Text style={[styles.dateLabel, { color: colors.foreground }]}>{day.dayNumber}</Text></View>; })}</View></View>
    <View style={[styles.bestCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><MaterialIcons name="emoji-events" size={21} color={colors.warning} /><View style={styles.bestCopy}><Text style={[styles.bestTitle, { color: colors.foreground }]}>{t("Лучший день")}</Text><Text style={[styles.bestText, { color: colors.muted }]}>{bestCopy}</Text></View></View>
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 36 }, header: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8 }, back: { width: 42, height: 42, alignItems: "center", justifyContent: "center", marginLeft: -10 }, title: { fontSize: 29, fontWeight: "800", letterSpacing: -0.6 }, subtitle: { marginTop: 9, fontSize: 15 }, summaryCard: { marginTop: 24, minHeight: 96, borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 18, flexDirection: "row", alignItems: "center", gap: 13 }, summaryIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" }, summaryCopy: { flex: 1 }, summaryValue: { fontSize: 28, fontWeight: "800", lineHeight: 33 }, summaryLabel: { marginTop: 2, fontSize: 14 }, chartCard: { marginTop: 15, borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 18 }, chartHeader: { marginBottom: 18 }, chartTitle: { fontSize: 17, fontWeight: "700" }, chartSub: { marginTop: 3, fontSize: 13 }, chart: { height: 202, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 5 }, dayColumn: { flex: 1, alignItems: "center", justifyContent: "flex-end" }, count: { height: 19, fontSize: 11, fontWeight: "700" }, barTrack: { height: 142, width: "100%", justifyContent: "flex-end", alignItems: "center" }, bar: { width: "62%", minWidth: 10, borderRadius: 8 }, dayLabel: { marginTop: 8, fontSize: 10, fontWeight: "700" }, dateLabel: { marginTop: 2, fontSize: 12, fontWeight: "700" }, bestCard: { marginTop: 15, minHeight: 72, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 11 }, bestCopy: { flex: 1 }, bestTitle: { fontSize: 15, fontWeight: "700" }, bestText: { marginTop: 3, fontSize: 13 }, });
