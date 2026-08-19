export const PLAY_READINESS_KEYS = [
  "listing",
  "privacy",
  "content",
  "testing",
  "release",
] as const;

export type PlayReadinessKey = (typeof PLAY_READINESS_KEYS)[number];
export type PlayReadiness = Record<PlayReadinessKey, boolean>;

export const defaultPlayReadiness: PlayReadiness = {
  listing: false,
  privacy: false,
  content: false,
  testing: false,
  release: false,
};

export function normalizePlayReadiness(value: unknown): PlayReadiness {
  const candidate =
    value && typeof value === "object" ? (value as Partial<PlayReadiness>) : {};
  return PLAY_READINESS_KEYS.reduce<PlayReadiness>(
    (result, key) => {
      result[key] = candidate[key] === true;
      return result;
    },
    { ...defaultPlayReadiness },
  );
}
