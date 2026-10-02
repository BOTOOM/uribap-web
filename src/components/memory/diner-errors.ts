export type DinerApiResult = {
  code?: unknown;
  detail?: unknown;
} | null;

type DetailRecord = Record<string, unknown>;

function isRecord(value: unknown): value is DetailRecord {
  return typeof value === "object" && value !== null;
}

function normalized(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, " ");
}

function detailMessages(detail: unknown): string[] {
  if (typeof detail === "string") {
    return detail.trim() ? [detail] : [];
  }
  if (Array.isArray(detail)) {
    return detail.flatMap(detailMessages);
  }
  if (isRecord(detail)) {
    const messages = [
      typeof detail.msg === "string" ? detail.msg : null,
      typeof detail.message === "string" ? detail.message : null,
    ].filter((message): message is string => message !== null);
    if (messages.length > 0) return messages;
    return "detail" in detail ? detailMessages(detail.detail) : [];
  }
  return [];
}

export function dinerErrorMessage(result: DinerApiResult, fallback: string): string {
  return detailMessages(result?.detail).join(" ") || fallback;
}

function mentionsDisplayName(value: unknown): boolean {
  if (typeof value === "string") {
    return normalized(value).includes("display name");
  }
  if (Array.isArray(value)) {
    return value.some(mentionsDisplayName);
  }
  if (isRecord(value)) {
    return Object.entries(value).some(([key, item]) => {
      if (key === "loc") return mentionsDisplayName(item);
      return typeof item === "string" && normalized(item).includes("display name");
    });
  }
  return false;
}

function codeMentionsDisplayName(code: unknown): boolean {
  return typeof code === "string" && mentionsDisplayName(code);
}

function isDuplicateDisplayName(result: DinerApiResult): boolean {
  const detail = normalized(dinerErrorMessage(result, ""));
  return (
    codeMentionsDisplayName(result?.code) ||
    mentionsDisplayName(result?.detail) ||
    (detail.includes("diner") &&
      detail.includes("name") &&
      /\b(conflict|duplicate|already exists)\b/.test(detail))
  );
}

export function dinerErrorField(
  status: number,
  result: DinerApiResult,
): "member" | "name" | null {
  if (result?.code === "invalid_member_link") return "member";
  if (status === 409 && isDuplicateDisplayName(result)) return "name";
  if (status === 422 && (codeMentionsDisplayName(result?.code) || mentionsDisplayName(result?.detail))) {
    return "name";
  }
  return null;
}
