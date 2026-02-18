import { parse } from 'csv-parse/sync';

export function parseCsv(buffer, delimiter = '') {
  const text = buffer.toString('utf8');
  const options = { columns: false, skip_empty_lines: true, relax_column_count: true };
  if (delimiter) options.delimiter = delimiter;
  const rows = parse(text, options);
  const data = rows.map((row) => (Array.isArray(row) ? row : [row]).map((c) => (c == null ? '' : String(c).trim())));
  return { data, rowCount: data.length, colCount: data.length ? Math.max(...data.map((r) => r.length)) : 0 };
}
