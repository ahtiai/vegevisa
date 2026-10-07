export async function requestJSON<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new Error("Yhteys katkesi. Yritä uudelleen.");
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Palvelu ei vastannut. Yritä uudelleen.");
  }
  if (!response.ok)
    throw new Error(data.error || "Pyyntö epäonnistui. Yritä uudelleen.");
  return data as T;
}
