const cell = (v: unknown) => {
  let s = String(v ?? "");
  // Names and notes are typed by guests; stop Sheets/Excel running them as formulas.
  if (/^[=+\-@\t\r]/.test(s) && typeof v === "string" && !/^[+-]?[\d.]+$/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (rows: unknown[][]) => rows.map((r) => r.map(cell).join(",")).join("\n");
