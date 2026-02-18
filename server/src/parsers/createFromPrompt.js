export function generateTableFromPrompt(prompt) {
  const lower = prompt.toLowerCase();
  const rows = [];
  let sheetName = 'Sheet1';

  if (lower.includes('invoice') || lower.includes('bill')) {
    sheetName = 'Invoice';
    rows.push(['Item', 'Description', 'Quantity', 'Unit Price', 'Amount']);
    const match = prompt.match(/(\d+)\s*rows?/i);
    const n = match ? Math.min(parseInt(match[1], 10), 50) : 5;
    for (let i = 1; i <= n; i++) {
      rows.push([`Item ${i}`, `Description ${i}`, 1, '0.00', '0.00']);
    }
    return { rows, sheetName };
  }

  if (lower.includes('expense') || lower.includes('budget')) {
    sheetName = 'Expenses';
    rows.push(['Date', 'Category', 'Description', 'Amount']);
    const match = prompt.match(/(\d+)\s*rows?/i);
    const n = match ? Math.min(parseInt(match[1], 10), 100) : 10;
    for (let i = 1; i <= n; i++) {
      rows.push(['', 'Category', '', '0.00']);
    }
    return { rows, sheetName };
  }

  if (lower.includes('bank') || lower.includes('statement') || lower.includes('transaction')) {
    sheetName = 'Bank Statement';
    rows.push(['Date', 'Description', 'Debit', 'Credit', 'Balance']);
    const match = prompt.match(/(\d+)\s*rows?/i);
    const n = match ? Math.min(parseInt(match[1], 10), 200) : 20;
    for (let i = 1; i <= n; i++) {
      rows.push(['', '', '', '', '']);
    }
    return { rows, sheetName };
  }

  const rowMatch = prompt.match(/(\d+)\s*rows?/i);
  const colMatch = prompt.match(/(\d+)\s*col(?:umn)?s?/i) || prompt.match(/columns?:\s*([^.\n]+)/i);
  const nRows = rowMatch ? Math.min(parseInt(rowMatch[1], 10), 100) : 10;
  let headers = ['Column A', 'Column B', 'Column C', 'Column D', 'Column E'];
  if (colMatch) {
    if (colMatch[1] && isNaN(Number(colMatch[1]))) {
      headers = colMatch[1].split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    } else {
      const n = parseInt(colMatch[1], 10) || 5;
      headers = Array.from({ length: n }, (_, i) => `Column ${String.fromCharCode(65 + i)}`);
    }
  }
  rows.push(headers);
  for (let i = 0; i < nRows; i++) {
    rows.push(headers.map(() => ''));
  }
  return { rows, sheetName };
}
