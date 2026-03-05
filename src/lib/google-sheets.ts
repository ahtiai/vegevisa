export interface RawQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct: "a" | "b" | "c" | "d";
  difficulty: string;
  active: string;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(current);
        current = "";
      } else if (ch === "\n" || (ch === "\r" && text[i + 1] === "\n")) {
        row.push(current);
        current = "";
        if (row.some((cell) => cell.trim())) rows.push(row);
        row = [];
        if (ch === "\r") i++;
      } else {
        current += ch;
      }
    }
  }
  row.push(current);
  if (row.some((cell) => cell.trim())) rows.push(row);

  return rows;
}

export async function fetchQuestionsFromSheets(): Promise<RawQuestion[]> {
  const csvUrl = process.env.GOOGLE_SHEETS_CSV_URL;

  if (!csvUrl) {
    throw new Error("GOOGLE_SHEETS_CSV_URL not configured");
  }

  const url = csvUrl;
  const res = await fetch(url, { next: { revalidate: 300 } });

  if (!res.ok) {
    throw new Error(`Google Sheets CSV fetch error: ${res.status}`);
  }

  const text = await res.text();
  const rows = parseCSV(text);

  if (rows.length < 2) {
    throw new Error("No question data found in sheet");
  }

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const questions: RawQuestion[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      obj[header] = (row[idx] || "").trim();
    });

    if (obj.active?.toUpperCase() === "FALSE") continue;
    if (!obj.question) continue;

    questions.push({
      id: obj.id || `q${i}`,
      question: obj.question,
      option_a: obj.option_a,
      option_b: obj.option_b,
      option_c: obj.option_c,
      option_d: obj.option_d,
      correct: obj.correct?.toLowerCase() as RawQuestion["correct"],
      difficulty: obj.difficulty || "medium",
      active: obj.active || "TRUE",
    });
  }

  return questions;
}
