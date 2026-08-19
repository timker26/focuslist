import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";
import {
  PLAY_READINESS_KEYS,
  type PlayReadinessKey,
} from "@/lib/play-readiness";
import { useTasks } from "@/lib/tasks-context";

type ReadinessItem = {
  id: PlayReadinessKey;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  title: string;
  detail: string;
  color: "primary" | "success" | "warning";
};

const readinessItems: ReadinessItem[] = [
  {
    id: "listing",
    icon: "description",
    title: "Карточка приложения",
    detail: "Название, описание, иконка, скриншоты и контактный email.",
    color: "primary",
  },
  {
    id: "privacy",
    icon: "security",
    title: "Конфиденциальность и данные",
    detail: "Политика конфиденциальности, Data safety и разрешения приложения.",
    color: "warning",
  },
  {
    id: "content",
    icon: "groups",
    title: "Контент и аудитория",
    detail: "Возрастной рейтинг, целевая аудитория и декларация рекламы.",
    color: "primary",
  },
  {
    id: "testing",
    icon: "science",
    title: "Тестирование",
    detail: "Internal testing пройден и тестировщики получили доступ.",
    color: "success",
  },
  {
    id: "release",
    icon: "send",
    title: "Выпуск",
    detail: "Подписанный AAB, release notes и версия готовы.",
    color: "success",
  },
];

export default function PlayReadinessScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const { settings, updateSettings } = useTasks();
  const completed = PLAY_READINESS_KEYS.filter(
    (key) => settings.playReadiness[key],
  ).length;
  const isReady = completed === PLAY_READINESS_KEYS.length;
  const forwardChevron =
    settings.language === "ar" ? "chevron-left" : "chevron-right";

  const toggleItem = (key: PlayReadinessKey) => {
    updateSettings({
      playReadiness: {
        ...settings.playReadiness,
        [key]: !settings.playReadiness[key],
      },
    });
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t("Назад")}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <MaterialIcons
              name={settings.language === "ar" ? "arrow-forward" : "arrow-back"}
              size={23}
              color={colors.foreground}
            />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {t("Готовность к Google Play")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {t("Проверьте материалы перед отправкой AAB.")}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: `${colors.primary}12`,
              borderColor: `${colors.primary}42`,
            },
          ]}
        >
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: `${colors.primary}1D` },
            ]}
          >
            <MaterialIcons
              name={isReady ? "verified" : "playlist-add-check"}
              size={28}
              color={colors.primary}
            />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
              {isReady
                ? t("Готово к проверке")
                : `${completed}/${PLAY_READINESS_KEYS.length} ${t("пунктов выполнено")}`}
            </Text>
            <Text style={[styles.summaryText, { color: colors.muted }]}>
              {t(
                "Информационная проверка: отметьте пункт после того, как выполните его в Play Console.",
              )}
            </Text>
          </View>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: `${colors.primary}22` },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${(completed / PLAY_READINESS_KEYS.length) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <Text style={[styles.section, { color: colors.muted }]}>
          {t("CHECKLIST")}
        </Text>
        <View
          style={[
            styles.list,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {readinessItems.map((item, index) => {
            const complete = settings.playReadiness[item.id];
            const accent = colors[item.color];
            return (
              <Pressable
                key={item.id}
                onPress={() => toggleItem(item.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: complete }}
                style={({ pressed }) => [
                  styles.row,
                  index > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.rowIcon,
                    {
                      backgroundColor: complete
                        ? `${colors.success}18`
                        : `${accent}18`,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={20}
                    color={complete ? colors.success : accent}
                  />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]}>
                    {t(item.title)}
                  </Text>
                  <Text style={[styles.rowText, { color: colors.muted }]}>
                    {t(item.detail)}
                  </Text>
                </View>
                <MaterialIcons
                  name={complete ? "check-circle" : "radio-button-unchecked"}
                  size={23}
                  color={complete ? colors.success : colors.muted}
                />
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() =>
            void Linking.openURL(
              "https://play.google.com/console/u/0/developers",
            )
          }
          style={({ pressed }) => [
            styles.consoleButton,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name="open-in-new" size={19} color="#FFFFFF" />
          <Text style={styles.consoleButtonText}>
            {t("Открыть Play Console")}
          </Text>
          <MaterialIcons name={forwardChevron} size={20} color="#FFFFFF" />
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 36 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 22,
  },
  back: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -10,
  },
  headerCopy: { flex: 1 },
  title: { fontSize: 25, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { marginTop: 3, fontSize: 13 },
  summaryCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    padding: 17,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCopy: { flex: 1, minWidth: 210 },
  summaryTitle: { fontSize: 17, fontWeight: "800" },
  summaryText: { marginTop: 4, fontSize: 13, lineHeight: 18 },
  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  section: {
    marginTop: 25,
    marginBottom: 9,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.9,
  },
  list: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    overflow: "hidden",
  },
  row: {
    minHeight: 78,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "800" },
  rowText: { marginTop: 3, fontSize: 12.5, lineHeight: 17 },
  consoleButton: {
    minHeight: 52,
    marginTop: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  consoleButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  pressed: { opacity: 0.72 },
});
