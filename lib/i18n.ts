import { useTasks } from "@/lib/tasks-context";
import { translate, type TranslationKey } from "./translations";

export type { TranslationKey } from "./translations";
export { translate } from "./translations";

export function useI18n() {
  const { settings } = useTasks();
  return { language: settings.language, t: (key: TranslationKey | string) => translate(settings.language, key) };
}
