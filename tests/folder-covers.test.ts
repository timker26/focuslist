import { describe, expect, it } from "vitest";

import { folderCoverIds, folderCovers, isFolderCoverId } from "../lib/folder-covers";

describe("folder covers", () => {
  it("provides a named two-color gradient for every selectable cover", () => {
    expect(folderCoverIds).toHaveLength(6);
    for (const id of folderCoverIds) {
      expect(folderCovers[id].label.length).toBeGreaterThan(0);
      expect(folderCovers[id].colors).toHaveLength(2);
    }
  });

  it("validates known cover IDs", () => {
    expect(isFolderCoverId("ocean")).toBe(true);
    expect(isFolderCoverId("not-a-cover")).toBe(false);
  });
});
