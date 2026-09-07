/** Minimal RFC 4180 reader/writer. Handles quoted fields, embedded commas, quotes and newlines. */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let sawAnyChar = false;

  const source = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      sawAnyChar = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      sawAnyChar = true;
      continue;
    }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      sawAnyChar = false;
      continue;
    }
    field += char;
    sawAnyChar = true;
  }

  if (field.length > 0 || sawAnyChar || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

export function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function toCsv(rows: Array<Array<string | number>>): string {
  return rows.map((row) => row.map((cell) => escapeCsvField(String(cell))).join(",")).join("\r\n");
}
