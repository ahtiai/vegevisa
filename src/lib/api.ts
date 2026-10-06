import { NextResponse } from "next/server";
import { AppError } from "./errors";
export const noStore = { "Cache-Control": "private, no-store" };
export function json(value: unknown) {
  return NextResponse.json(value, { headers: noStore });
}
export function apiError(error: unknown, operation: string) {
  if (error instanceof AppError)
    return NextResponse.json(
      { error: error.message, field: error.field },
      {
        status: error.status,
        headers: {
          ...noStore,
          ...(error.status === 429 ? { "Retry-After": "900" } : {}),
        },
      },
    );
  console.error(`${operation} failed`);
  return NextResponse.json(
    { error: "Palvelu ei ole juuri nyt käytettävissä. Yritä uudelleen." },
    { status: 503, headers: noStore },
  );
}
export async function readBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new AppError(400, "Virheellinen pyyntö.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16384) {
      await reader.cancel();
      throw new AppError(400, "Pyyntö on liian suuri.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new AppError(400, "Virheellinen pyyntö.");
  }
}
