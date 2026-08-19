import type { TaskAttachment } from "@/lib/tasks-context";

const IMAGE_EXTENSIONS = new Set(["apng", "avif", "bmp", "gif", "heic", "heif", "jpeg", "jpg", "png", "webp"]);

export function normalizeTaskAttachments(value: unknown): TaskAttachment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((attachment) => {
    if (!attachment || typeof attachment !== "object") return [];
    const candidate = attachment as Partial<TaskAttachment>;
    if (typeof candidate.id !== "string" || typeof candidate.name !== "string" || typeof candidate.uri !== "string") return [];
    return [{
      id: candidate.id,
      name: candidate.name,
      uri: candidate.uri,
      mimeType: typeof candidate.mimeType === "string" ? candidate.mimeType : undefined,
      size: typeof candidate.size === "number" && Number.isFinite(candidate.size) ? candidate.size : undefined,
      kind: candidate.kind === "image" ? "image" : "file",
      addedAt: typeof candidate.addedAt === "string" ? candidate.addedAt : new Date(0).toISOString(),
    }];
  });
}

export function isImageAttachment(attachment: Pick<TaskAttachment, "kind" | "mimeType" | "name">) {
  if (attachment.kind === "image" || attachment.mimeType?.startsWith("image/")) return true;
  const extension = attachment.name.split(".").pop()?.toLowerCase();
  return Boolean(extension && IMAGE_EXTENSIONS.has(extension));
}

export function formatAttachmentSize(size?: number) {
  if (!size || size <= 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 102.4) / 10} KB`;
  return `${Math.round(size / (1024 * 102.4)) / 10} MB`;
}
