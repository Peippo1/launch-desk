export type CsvRow = Record<string, string>;

export interface CsvParseResult {
  rows: CsvRow[];
  errors: { row: number; reason: string }[];
}

function parseLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (quoted) throw new Error("Unclosed quoted field.");
  values.push(current.trim());
  return values;
}

export function parseCsv(input: string): CsvParseResult {
  const lines = input.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) return { rows: [], errors: [{ row: 1, reason: "CSV is empty." }] };

  let headers: string[];
  try {
    headers = parseLine(lines[0]).map((header) => header.trim().toLowerCase());
  } catch (error) {
    return { rows: [], errors: [{ row: 1, reason: error instanceof Error ? error.message : "Invalid header row." }] };
  }

  if (!headers.includes("name")) return { rows: [], errors: [{ row: 1, reason: "Missing required name header." }] };

  const rows: CsvRow[] = [];
  const errors: CsvParseResult["errors"] = [];

  for (const [index, line] of lines.slice(1).entries()) {
    const rowNumber = index + 2;
    try {
      const values = parseLine(line);
      if (values.length > headers.length) {
        errors.push({ row: rowNumber, reason: "Row has more fields than headers." });
        continue;
      }
      rows.push(Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""])));
    } catch (error) {
      errors.push({ row: rowNumber, reason: error instanceof Error ? error.message : "Invalid CSV row." });
    }
  }

  return { rows, errors };
}
