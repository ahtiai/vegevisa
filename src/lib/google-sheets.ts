export interface RawQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct: "a" | "b" | "c" | "d";
  difficulty: string;
  category: string;
  active: string;
}

export async function fetchQuestionsFromSheets(): Promise<RawQuestion[]> {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || "Questions";

  if (!apiKey || !spreadsheetId) {
    throw new Error("Google Sheets credentials not configured");
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}?key=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min

  if (!res.ok) {
    throw new Error(`Google Sheets API error: ${res.status}`);
  }

  const data = await res.json();
  const rows: string[][] = data.values;

  if (!rows || rows.length < 2) {
    throw new Error("No question data found in sheet");
  }

  const headers = rows[0].map((h: string) => h.toLowerCase().trim());
  const questions: RawQuestion[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj: Record<string, string> = {};
    headers.forEach((header: string, idx: number) => {
      obj[header] = row[idx] || "";
    });

    if (obj.active?.toUpperCase() === "FALSE") continue;

    questions.push({
      id: obj.id || `q${i}`,
      question: obj.question,
      option_a: obj.option_a,
      option_b: obj.option_b,
      option_c: obj.option_c,
      option_d: obj.option_d,
      correct: obj.correct?.toLowerCase() as RawQuestion["correct"],
      difficulty: obj.difficulty || "medium",
      category: obj.category || "",
      active: obj.active || "TRUE",
    });
  }

  return questions;
}
