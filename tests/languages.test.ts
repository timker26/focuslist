import { describe, expect, it } from "vitest";

import { appLanguages, getLanguage, isAppLanguage } from "../lib/languages";
import { getLayoutDirection } from "../lib/layout-direction";

describe("language settings", () => {
  it("includes a practical set of popular interface languages", () => {
    expect(appLanguages.map((language) => language.id)).toEqual(expect.arrayContaining(["ru", "en", "es", "fr", "de", "pt", "zh", "ar", "hi", "ja"]));
  });

  it("returns the Russian language as a safe fallback", () => {
    expect(getLanguage("ru").nativeLabel).toBe("Русский");
    expect(isAppLanguage("en")).toBe(true);
    expect(isAppLanguage("unsupported")).toBe(false);
  });

  it("uses RTL only for the Arabic interface", () => {
    expect(getLayoutDirection("ar")).toBe("rtl");
    expect(appLanguages.filter((language) => language.id !== "ar").every((language) => getLayoutDirection(language.id) === "ltr")).toBe(true);
  });
});
