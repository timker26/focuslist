import { describe, expect, it } from "vitest";

import { formatAttachmentSize, isImageAttachment, normalizeTaskAttachments } from "../lib/task-attachment-utils";

describe("task attachment utilities", () => {
  it("normalizes stored attachments and rejects malformed data", () => {
    const attachments = normalizeTaskAttachments([
      { id: "a", name: "photo.jpg", uri: "file:///photo.jpg", kind: "image", addedAt: "2026-08-19T00:00:00.000Z", size: 1024 },
      { id: 4, name: "bad", uri: "file:///bad" },
    ]);
    expect(attachments).toHaveLength(1);
    expect(attachments[0]?.name).toBe("photo.jpg");
  });

  it("detects images and formats file sizes", () => {
    expect(isImageAttachment({ kind: "file", name: "receipt.PNG" })).toBe(true);
    expect(isImageAttachment({ kind: "file", name: "plan.pdf" })).toBe(false);
    expect(formatAttachmentSize(1536)).toBe("1.5 KB");
    expect(formatAttachmentSize(2 * 1024 * 1024)).toBe("2 MB");
  });
});
