export type InvitationSettings = { enabled: boolean; names: string; date: string; message: string; button: string; emblem: "initials" | "flower" | "none" };

export function invitationSettings(value: unknown): InvitationSettings {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const text = (key: string, max: number, fallback = "") => typeof data[key] === "string" ? data[key].trim().slice(0, max) : fallback;
  return { enabled: data.enabled === true, names: text("names", 120), date: text("date", 100), message: text("message", 240, "Together with our families, we invite you to celebrate with us."), button: text("button", 40, "Open invitation") || "Open invitation", emblem: data.emblem === "flower" || data.emblem === "none" ? data.emblem : "initials" };
}

export function invitationDate(date: string | null) {
  return date ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)) : "Date to be confirmed";
}
