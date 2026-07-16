export function toNullableString(input: string | undefined): string | null {
  if (!input) {
    return null;
  }

  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const str = String(value).replaceAll('"', '""');
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str}"`;
  }

  return str;
}
