import { useEffect } from "react";
import { useColorScheme } from "react-native";

import { useThemeContext } from "@/lib/theme-provider";
import { useTasks } from "@/lib/tasks-context";

export function ThemeSettingsBridge() {
  const systemScheme = useColorScheme() ?? "light";
  const { settings } = useTasks();
  const { setColorScheme } = useThemeContext();

  useEffect(() => {
    setColorScheme(settings.themeMode === "system" ? systemScheme : settings.themeMode);
  }, [setColorScheme, settings.themeMode, systemScheme]);

  return null;
}
