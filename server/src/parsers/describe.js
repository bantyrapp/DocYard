export function describeTable(rows) {
  if (!rows || !rows.length) return 'Empty table.';
  const header = rows[0];
  const dataRows = rows.slice(1);
  const colCount = header.length;
  const rowCount = dataRows.length;
  const colLabels = header.map((h, i) => (h && String(h).trim() ? String(h).trim() : `Column ${i + 1}`)).join(', ');
  const numericCols = [];
  for (let c = 0; c < colCount; c++) {
    const values = dataRows.map((r) => r[c]).filter((v) => v !== '' && v != null);
    const numeric = values.filter((v) => !Number.isNaN(parseFloat(String(v).replace(/[,$]/g, ''))));
    if (values.length && numeric.length / values.length > 0.5) numericCols.push(colLabels.split(', ')[c] || `Column ${c + 1}`);
  }
  let summary = `Table has ${rowCount} data rows and ${colCount} columns. Column headers: ${colLabels}.`;
  if (numericCols.length) summary += ` Numeric-looking columns: ${numericCols.join(', ')}.`;
  return summary;
}
