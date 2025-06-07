/* eslint-disable @typescript-eslint/no-explicit-any */
export function sanitizeMetadata(
  metadata: Record<string, any>
): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const key in metadata) {
    const value = metadata[key];
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      (Array.isArray(value) && value.every((v) => typeof v === "string"))
    ) {
      sanitized[key] = value;
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = JSON.stringify(value);
    } else {
      sanitized[key] = String(value);
    }
  }
  return sanitized;
}
