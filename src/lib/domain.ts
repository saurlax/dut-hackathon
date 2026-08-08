export type ActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialActionState: ActionState = { ok: false, message: "" };

export function displayNumber(prefix: "P" | "T" | "C" | "S", value: number) {
  return `${prefix}${String(value).padStart(4, "0")}`;
}

export function normalizeParticipantNumber(value: string) {
  const normalized = value.trim().toUpperCase().replace(/^P/, "");
  if (/^\d+$/.test(normalized)) return String(Number(normalized));
  return normalized;
}

export function normalizeLoginEmail(value: string): string | null {
  const normalized = value.normalize("NFKC").toLowerCase().trim();
  if (!normalized || normalized.includes('"')) return null;
  const [local, ...domainParts] = normalized.split("@");
  if (!local || domainParts.length !== 1) return null;
  const domain = domainParts[0].split(",")[0];
  return domain ? `${local}@${domain}` : null;
}

export function eventDate(date = new Date()) {
  return new Date(date.getTime() + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

export function isRecruitmentOpen(deadline: string, date = new Date()) {
  return deadline >= eventDate(date);
}

export function isSafeHttpUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    const protocol = new URL(value.trim()).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function hasPublicContact(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasPublicContact);
  if (value && typeof value === "object")
    return Object.values(value).some(hasPublicContact);
  return false;
}

export type GatedPageState = "loading" | "login" | "blocked" | "error" | "form";

export function resolveGatedPageState(input: {
  profileReady: boolean;
  userId?: string | null;
  checkedUserId?: string | null;
  allowed?: boolean;
  failed?: boolean;
}): GatedPageState {
  if (!input.profileReady || input.checkedUserId !== input.userId)
    return "loading";
  if (!input.userId) return "login";
  if (input.failed) return "error";
  return input.allowed ? "form" : "blocked";
}
