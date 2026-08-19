import type { AppLanguage } from "./languages";

export type LayoutDirection = "ltr" | "rtl";

export function getLayoutDirection(language: AppLanguage): LayoutDirection {
  return language === "ar" ? "rtl" : "ltr";
}
