/** Quote separators/newlines and neutralise spreadsheet formula interpretation. */
export function csvCell(value: string | null | undefined): string {
  let text = value ?? "";
  if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
