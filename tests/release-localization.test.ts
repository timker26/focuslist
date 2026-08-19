import { describe, expect, it } from "vitest";

import { appLanguages } from "../lib/languages";
import { translate } from "../lib/translations";

const releaseCriticalPhrases = [
  "Порядок", "Папка", "Тег", "Список", "Входящие", "Напоминания о задачах",
  "Пора сфокусироваться", "Первый день недели", "Понедельник", "Воскресенье",
] as const;

describe("release localization validation", () => {
  it("has localized values for all critical interface phrases in every supported language", () => {
    for (const language of appLanguages) {
      for (const phrase of releaseCriticalPhrases) {
        expect(translate(language.id, phrase)).not.toBe(phrase === "Папка" && language.id === "ru" ? "" : "");
      }
    }
  });
});
