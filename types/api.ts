export type ApiError = {
  message: string;
  status: number | null;
  data: unknown;
};

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    "status" in value
  );
}
