import { describe, expect, it } from "vitest";

import {
  defaultPlayReadiness,
  normalizePlayReadiness,
} from "../lib/play-readiness";

describe("play readiness", () => {
  it("creates a complete false checklist from missing or invalid storage", () => {
    expect(normalizePlayReadiness(undefined)).toEqual(defaultPlayReadiness);
    expect(normalizePlayReadiness("invalid")).toEqual(defaultPlayReadiness);
  });

  it("keeps only valid boolean checklist entries", () => {
    expect(
      normalizePlayReadiness({ listing: true, privacy: "yes", testing: 1 }),
    ).toEqual({
      listing: true,
      privacy: false,
      content: false,
      testing: false,
      release: false,
    });
  });
});
