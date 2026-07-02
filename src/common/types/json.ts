export function toJson<T>(value: T): Record<string, unknown> {
  return value as unknown as Record<string, unknown>;
}
