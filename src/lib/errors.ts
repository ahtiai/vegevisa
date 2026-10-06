export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new AppError(400, "Virheellinen pyyntö.");
  return value as Record<string, unknown>;
}
export function integer(
  value: unknown,
  min: number,
  max: number,
  field: string,
): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  )
    throw new AppError(400, `Tarkista kenttä: ${field}.`, field);
  return value;
}
export function text(value: unknown, max: number, field: string): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new AppError(400, `Tarkista kenttä: ${field}.`, field);
  return value.trim();
}
