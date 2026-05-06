export function unwrapList<T>(value: T[] | { data: T[] } | undefined | null): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "object" && "data" in value && Array.isArray(value.data)) {
    return value.data;
  }
  return [];
}

export function unwrapOne<T>(value: T | { data: T }): T {
  if (value && typeof value === "object" && "data" in (value as object)) {
    return (value as { data: T }).data;
  }
  return value as T;
}
