import * as XLSX from 'xlsx';

/** Detect statement type from sheet name and first rows (Yardi-style reports) */
function detectStatementType(rows, sheetName) {
  const name = (sheetName || '').toLowerCase();
  const flat = rows.slice(0, 20).flat().map((c) => String(c ?? '').toLowerCase());

  if (/trial\s*balance|report1|^tb\b/.test(name)) return 'trial_balance';
  if (/income|p&l|profit\s*and\s*loss|^is\b/.test(name)) return 'income_statement';
  if (/balance\s*sheet|^bs\b/.test(name)) return 'balance_sheet';
  if (/general\s*ledger|^gl\b|journal/.test(name)) return 'general_ledger';

  const text = flat.join(' ');
  if (/trial\s*balance/.test(text)) return 'trial_balance';
  if (/\baccount\b.*\b(debit|credit|balance)\b/.test(text) && /beginning|ending\s*balance/.test(text)) return 'trial_balance';
  if (/\baccount\b/.test(text) && (/\bdebit\b/.test(text) || /\bcredit\b/.test(text)) && !/income\s*statement|balance\s*sheet/.test(text)) return 'trial_balance';

  if (/revenue|income\s*statement|expenses|net\s*income|operating\s*income/.test(text)) return 'income_statement';
  if (/assets|liabilities|equity|balance\s*sheet/.test(text)) return 'balance_sheet';
  if (/tran_seq|journal\s*entry|general\s*ledger/.test(text)) return 'general_ledger';

  return 'general';
}

/** Extract period (e.g. 01/2025) from title rows */
function extractPeriod(rows) {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i] || [];
    const cell = String((Array.isArray(row) ? row[0] : row) ?? '').trim();
    const monthMatch = cell.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})\b/i);
    const shortMatch = cell.match(/\b(\d{1,2})[\/\-]\s*(\d{4})\b/);
    if (monthMatch) {
      const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
      const m = months.indexOf(monthMatch[1].toLowerCase().slice(0, 3)) + 1;
      return `${String(m).padStart(2, '0')}/${monthMatch[2]}`;
    }
    if (shortMatch) return `${String(parseInt(shortMatch[1], 10)).padStart(2, '0')}/${shortMatch[2]}`;
  }
  return null;
}

export function parseExcel(buffer, options = {}) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const result = { sheets: [], sheetNames: workbook.SheetNames, detectedType: null, detectedPeriod: null };

  for (let si = 0; si < workbook.SheetNames.length; si++) {
    const name = workbook.SheetNames[si];
    const sheet = workbook.Sheets[name];
    let rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    rows = rows.map((row) => (Array.isArray(row) ? row : [row]).map((c) => (c == null ? '' : String(c))));

    if (si === 0) {
      result.detectedType = detectStatementType(rows, name);
      result.detectedPeriod = extractPeriod(rows);
    }

    result.sheets.push({ name: name || 'Sheet1', data: rows });
  }

  return result;
}
