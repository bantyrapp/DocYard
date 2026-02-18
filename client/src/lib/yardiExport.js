/**
 * Client-side Yardi trial balance / balance sheet → journal entry conversion.
 * Runs entirely in the browser so the app works offline.
 */
import * as XLSX from 'xlsx';

const YARDI_JE_HEADERS = [
  'Tran_Seq_Number', 'JournalDate', 'PostMonth', 'Property_Name', 'Account',
  'Reference', 'Notes', 'Debit', 'Credit', 'DetailNotes', 'Book', 'Unit',
];
const YARDI_JE_SHEET_NAME = 'TemplateFile';

function norm(s) {
  return String(s ?? '').trim().toUpperCase().replace(/\s/g, '');
}

function findTrialBalanceHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i] || [];
    const cells = (Array.isArray(row) ? row : [row]).map((c) => norm(c));
    const hasAccount = cells.some((c) => c === 'ACCOUNT' || c === 'GL' || c === 'ACCOUNT#');
    const hasDebit = cells.some((c) => c === 'DEBIT' || c === 'DEBITS');
    const hasCredit = cells.some((c) => c === 'CREDIT' || c === 'CREDITS');
    if (hasAccount && (hasDebit || hasCredit)) return i;
  }
  return -1;
}

/** Detect balance sheet / alternate layout: Account (or GL/Code) + Debit/Credit or Balance. */
function findBalanceSheetHeaderRow(rows) {
  const accountLike = /ACCOUNT|GL|CODE|ACCOUNT#|ACCT/i;
  const nameLike = /NAME|DESCRIPTION|DESC|ACCOUNTNAME/i;
  const debitLike = /DEBIT|DEBITS/i;
  const creditLike = /CREDIT|CREDITS/i;
  const balanceLike = /BALANCE|ENDING|AMOUNT|CURRENT/i;

  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const row = rows[i] || [];
    const cells = (Array.isArray(row) ? row : [row]).map((c) => String(c ?? '').trim());
    const hasAccount = cells.some((c) => accountLike.test(c));
    const hasDebit = cells.some((c) => debitLike.test(c));
    const hasCredit = cells.some((c) => creditLike.test(c));
    const hasBalance = cells.some((c) => balanceLike.test(c));
    if (hasAccount && (hasDebit || hasCredit || hasBalance)) return i;
  }
  return -1;
}

/** Return column indices for balance sheet: account, name, debit, credit, balance (optional). */
function getBalanceSheetColumnMap(headerRow) {
  const row = Array.isArray(headerRow) ? headerRow : [headerRow];
  const map = { colAccount: -1, colName: -1, colDebit: -1, colCredit: -1, colBalance: -1 };

  const accountLike = /ACCOUNT|GL|CODE|ACCOUNT#|ACCT/i;
  const nameLike = /NAME|DESCRIPTION|DESC|ACCOUNTNAME/i;
  const debitLike = /^DEBIT|DEBITS$/i;
  const creditLike = /^CREDIT|CREDITS$/i;
  const balanceLike = /CURRENT\s*BALANCE|BALANCE|ENDING|AMOUNT|CURRENT/i;

  row.forEach((cell, idx) => {
    const s = String(cell ?? '').trim();
    if (accountLike.test(s) && map.colAccount < 0) map.colAccount = idx;
    if (nameLike.test(s) && map.colName < 0) map.colName = idx;
    if (debitLike.test(s)) map.colDebit = idx;
    if (creditLike.test(s)) map.colCredit = idx;
    if (balanceLike.test(s) && map.colBalance < 0) map.colBalance = idx;
  });

  if (map.colAccount < 0) map.colAccount = 0;
  if (map.colName < 0) map.colName = map.colAccount + 1;
  return map;
}

function parseMonthRow(monthStr) {
  const s = String(monthStr ?? '').trim();
  const matchLong = s.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})\b/i);
  const matchShort = s.match(/\b(\d{1,2})[/\-]\s*(\d{4})\b/);
  let monthNum = 1;
  let year = new Date().getFullYear();
  if (matchLong) {
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    monthNum = months.indexOf(matchLong[1].toLowerCase().slice(0, 3)) + 1;
    year = parseInt(matchLong[2], 10);
  } else if (matchShort) {
    monthNum = parseInt(matchShort[1], 10);
    year = parseInt(matchShort[2], 10);
  }
  if (monthNum < 1 || monthNum > 12) monthNum = 1;
  const postMonth = `${String(monthNum).padStart(2, '0')}/${year}`;
  const lastDay = new Date(year, monthNum, 0);
  const journalDate = `${String(lastDay.getMonth() + 1).padStart(2, '0')}/${String(lastDay.getDate()).padStart(2, '0')}/${lastDay.getFullYear()}`;
  return { postMonth, journalDate };
}

/** YYYY-MM-DD → MM/DD/YYYY */
export function ymdToMmDdYyyy(ymd) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return '';
  const [y, m, d] = ymd.split('-');
  return `${m}/${d}/${y}`;
}

/** Extract period MM/YYYY from first rows (for pre-filling post month). */
export function extractPeriod(rows) {
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

function buildYardiJeRowsFromTrialBalance(rows, options = {}) {
  const out = [YARDI_JE_HEADERS];
  const idx = findTrialBalanceHeaderRow(rows);
  if (idx < 0) throw new Error('Could not find trial balance header (ACCOUNT, DEBIT, CREDIT).');

  const titleRows = rows.slice(0, idx);
  const tableRows = rows.slice(idx);
  const dataRows = tableRows.slice(1);

  const propertyName = String(titleRows?.[1]?.[0] ?? '').trim();
  const parsed = parseMonthRow(titleRows?.[2]?.[0]);
  const postMonth = options.postMonth && String(options.postMonth).trim() ? String(options.postMonth).trim() : parsed.postMonth;
  const journalDate = options.journalDate && String(options.journalDate).trim() ? String(options.journalDate).trim() : parsed.journalDate;
  const book = 'Both';
  const unit = '101';

  const pad12 = (arr) => {
    const a = [...arr];
    while (a.length < 12) a.push('');
    return a.slice(0, 12);
  };

  const numVal = (s) => {
    const n = parseFloat(String(s).replace(/[,$]/g, ''), 10);
    return isNaN(n) ? 0 : n;
  };

  dataRows.forEach((row) => {
    const account = row[0] ?? '';
    const name = String(row[1] ?? '').trim();
    const debit = row[3] ?? '';
    const credit = row[4] ?? '';
    const isTotalRow = /TOTAL|SUBTOTAL/i.test(name) || /TOTAL|SUBTOTAL/i.test(String(account));
    if (isTotalRow) return;

    const d = numVal(debit);
    const c = numVal(credit);
    if (d === 0 && c === 0) return;

    const reference = name ? `${postMonth} ${name}` : postMonth;

    out.push(pad12([
      '1',
      journalDate,
      postMonth,
      propertyName,
      String(account),
      reference,
      name,
      String(debit),
      String(credit),
      name,
      book,
      unit,
    ]));
  });

  return out;
}

function buildYardiJeRowsFromBalanceSheet(rows, options = {}) {
  const out = [YARDI_JE_HEADERS];
  const idx = findBalanceSheetHeaderRow(rows);
  if (idx < 0) throw new Error('Could not find balance sheet header (ACCOUNT and CURRENT BALANCE or Debit/Credit).');

  const titleRows = rows.slice(0, idx);
  const tableRows = rows.slice(idx);
  const headerRow = tableRows[0];
  const dataRows = tableRows.slice(1);
  const map = getBalanceSheetColumnMap(headerRow);

  const propertyName = String(titleRows?.[1]?.[0] ?? titleRows?.[0]?.[0] ?? '').trim();
  const parsed = parseMonthRow(titleRows?.[2]?.[0] ?? titleRows?.[1]?.[0] ?? '');
  const postMonth = options.postMonth && String(options.postMonth).trim() ? String(options.postMonth).trim() : parsed.postMonth;
  const journalDate = options.journalDate && String(options.journalDate).trim() ? String(options.journalDate).trim() : parsed.journalDate;
  const book = 'Both';
  const unit = '101';

  const pad12 = (arr) => {
    const a = [...arr];
    while (a.length < 12) a.push('');
    return a.slice(0, 12);
  };

  const getCell = (row, col) => (row && col >= 0 ? String(row[col] ?? '').trim() : '');
  const num = (s) => {
    const n = parseFloat(String(s).replace(/[,$]/g, ''), 10);
    return isNaN(n) ? 0 : n;
  };

  dataRows.forEach((row) => {
    const account = getCell(row, map.colAccount);
    const name = getCell(row, map.colName);
    let debit = '';
    let credit = '';

    if (map.colDebit >= 0 && map.colCredit >= 0) {
      debit = getCell(row, map.colDebit);
      credit = getCell(row, map.colCredit);
      const d = num(debit);
      const c = num(credit);
      if (d === 0 && c === 0) return;
    } else if (map.colBalance >= 0) {
      const bal = num(getCell(row, map.colBalance));
      if (bal > 0) debit = String(bal);
      else if (bal < 0) credit = String(-bal);
      else return;
    } else {
      return;
    }

    const isTotalRow = /TOTAL|SUBTOTAL/i.test(name) || /TOTAL|SUBTOTAL/i.test(account);
    if (isTotalRow) return;
    if (!account && !name) return;

    const reference = name ? `${postMonth} ${name}` : postMonth;
    const acc = account || '';

    out.push(pad12([
      '1',
      journalDate,
      postMonth,
      propertyName,
      acc,
      reference,
      name,
      debit,
      credit,
      name,
      book,
      unit,
    ]));
  });

  return out;
}

/** Detect document type from rows: 'trial_balance' | 'balance_sheet' | null. */
export function detectDocumentType(rows) {
  if (findTrialBalanceHeaderRow(rows) >= 0) return 'trial_balance';
  if (findBalanceSheetHeaderRow(rows) >= 0) return 'balance_sheet';
  return null;
}

/**
 * Parse Excel file in the browser and return { rows, sheetName, detectedPeriod } from first sheet.
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        let rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
        rows = rows.map((row) => (Array.isArray(row) ? row : [row]).map((c) => (c == null ? '' : String(c))));
        const detectedPeriod = extractPeriod(rows);
        const detectedType = detectDocumentType(rows);
        resolve({ rows, sheetName: firstSheetName || 'Sheet1', detectedPeriod, detectedType });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Get Yardi JE rows (2D array) for preview or export. Same options as buildYardiJeExcel.
 */
export function getYardiJeRows(rows, options = {}) {
  const { postMonth, journalDate, docType = 'auto' } = options;
  const journalDateMmDdYyyy = journalDate ? ymdToMmDdYyyy(journalDate) : null;
  const opts = { postMonth: postMonth || undefined, journalDate: journalDateMmDdYyyy || undefined };

  const useTrialBalance = docType === 'trial_balance' || (docType === 'auto' && findTrialBalanceHeaderRow(rows) >= 0);
  const useBalanceSheet = docType === 'balance_sheet' || (docType === 'auto' && findBalanceSheetHeaderRow(rows) >= 0);

  if (useTrialBalance) return buildYardiJeRowsFromTrialBalance(rows, opts);
  if (useBalanceSheet) return buildYardiJeRowsFromBalanceSheet(rows, opts);
  throw new Error('Could not detect trial balance or balance sheet layout. Need columns like Account, Debit/Credit (or Balance).');
}

/**
 * Build Yardi JE rows and return an Excel file as a Blob (runs in browser, no server).
 * options.docType: 'trial_balance' | 'balance_sheet' | 'auto' (default: auto-detect).
 */
export function buildYardiJeExcel(rows, options = {}) {
  const exportRows = getYardiJeRows(rows, options);
  const ws = XLSX.utils.aoa_to_sheet(exportRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, YARDI_JE_SHEET_NAME);
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Download a blob as a file.
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Generate and download a blank Yardi JE template (headers + one sample row). */
export function downloadYardiJeTemplate() {
  const headers = YARDI_JE_HEADERS;
  const sampleRow = ['1', '01/31/2025', '01/2025', 'Property Name', '1000', '01/2025 Sample', 'Sample line', '100', '0', 'Sample', 'Both', '101'];
  const rows = [headers, sampleRow];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'TemplateFile');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, 'yardi_je_template.xlsx');
}

/** Generate and download a blank trial balance-style template. */
export function downloadTrialBalanceTemplate() {
  const rows = [
    ['Trial Balance', '', '', '', '', ''],
    ['Property Name', '', '', '', '', ''],
    ['Month = 01/2025', '', '', '', '', ''],
    ['', '', 'BEGINNING', '', '', 'ENDING'],
    ['ACCOUNT', 'NAME', 'BALANCE', 'DEBIT', 'CREDIT', 'BALANCE'],
    ['1000', 'Cash', '0', '100', '0', '100'],
    ['', 'TOTAL', '0', '100', '0', '100'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report1');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, 'yardi_trial_balance_template.xlsx');
}

/** Generate and download a blank balance sheet-style template (Yardi-style: ACCOUNT, name, CURRENT BALANCE). */
export function downloadBalanceSheetTemplate() {
  const rows = [
    ['Balance Sheet', '', ''],
    ['Property Name', '', ''],
    ['Month = Dec 2025', '', ''],
    ['Book = Cash ; Tree = YSI Standard Balance Sheet', '', ''],
    ['ACCOUNT', '', 'CURRENT BALANCE'],
    ['100000', 'Assets', ''],
    ['102000', 'Cash', ''],
    ['110000', '  Cash - Operating', '0'],
    ['142000', 'Due from Others', ''],
    ['170000', 'Fixed Assets', ''],
    ['171100', '   Land - Acquisition', '0'],
    ['172100', '   Buildings', '0'],
    ['200000', 'Liabilities', ''],
    ['300000', 'Equity', ''],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report1');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, 'balance_sheet_template.xlsx');
}

/** Real estate property accounting: typical GL ranges and account names (Yardi-style). */
const REAL_ESTATE_GL_REFERENCE = [
  ['Real Estate Property – Chart of Accounts Reference', '', ''],
  ['Use this as a guide to GL codes and account types. Debits = Credits.', '', ''],
  ['', '', ''],
  ['Range', 'Type', 'Examples'],
  ['100000–199999', 'ASSETS', ''],
  ['101000–129999', '  Current Assets', 'Cash, operating accounts, petty cash'],
  ['102000', '    Cash', ''],
  ['110000', '    Cash - Operating', ''],
  ['120000–149999', '  Receivables / Due from', 'Tenant receivables, due from affiliates'],
  ['142000', '    Due from Others', ''],
  ['150000–159999', '  Prepaids / Other current', 'Prepaid insurance, deposits'],
  ['170000–179999', '  Fixed Assets', 'Land, buildings, improvements'],
  ['171100', '    Land - Acquisition', ''],
  ['172100', '    Buildings', ''],
  ['178000', '  Other Assets', 'Acquisition & closing costs, intangibles'],
  ['', '', ''],
  ['200000–299999', 'LIABILITIES', ''],
  ['201000–219999', '  Current Liabilities', 'A/P, accrued expenses, security deposits'],
  ['220000–249999', '  Long-term debt', 'Mortgage payable, notes'],
  ['250000–279999', '  Other Liabilities', 'Due to affiliates, deferred revenue'],
  ['', '', ''],
  ['300000–399999', 'EQUITY', 'Owner equity, retained earnings, distributions'],
  ['', '', ''],
  ['400000–499999', 'REVENUE', 'Rental income, other income, bad debt recovery'],
  ['500000–599999', 'EXPENSES', 'Operating expenses, utilities, repairs, admin'],
  ['', '', ''],
  ['Balance sheet from Yardi: ACCOUNT, (name), CURRENT BALANCE. Positive = debit, negative = credit.', '', ''],
];

/** Download real estate GL reference (all accounts / COA guide for understanding accounting). */
export function downloadRealEstateGLReference() {
  const ws = XLSX.utils.aoa_to_sheet(REAL_ESTATE_GL_REFERENCE);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'GL Reference');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, 'real_estate_GL_reference.xlsx');
}
