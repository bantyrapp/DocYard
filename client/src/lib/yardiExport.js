/**
 * Client-side Yardi trial balance / balance sheet → journal entry conversion.
 * Runs entirely in the browser so the app works offline.
 * Uses xlsx-js-style for left alignment and styling in the Yardi export.
 * Detection and parsing rules live in parsingRules.js (single source of truth).
 */
import * as XLSX from 'xlsx-js-style';
import {
  TRIAL_BALANCE,
  BALANCE_SHEET,
  SKIP_ROW,
  PROPERTY_FROM_SHEET,
  PROPERTY_IGNORE_PATTERNS,
  PROPERTY_FROM_FILENAME,
  FILENAME_MONTH,
  PERIOD_IN_CELL,
  MONTH_ROW,
  NUMERIC,
  YARDI_DEFAULTS,
} from './parsingRules.js';
import { getMergedTrialBalanceHeaders } from './feedbackLearner.js';

const YARDI_JE_HEADERS = [
  'Tran_Seq_Number', 'JournalDate', 'PostMonth', 'Property_Name', 'Account',
  'Reference', 'Notes', 'Debit', 'Credit', 'DetailNotes', 'Book', 'Unit',
];
const YARDI_JE_SHEET_NAME = 'TemplateFile';

function norm(s) {
  return String(s ?? '').trim().toUpperCase().replace(/\s/g, '');
}

function findTrialBalanceHeaderRow(rows) {
  const merged = getMergedTrialBalanceHeaders(TRIAL_BALANCE);
  const accountSet = new Set(merged.accountHeaders.map((h) => norm(h)));
  const debitSet = new Set(merged.debitHeaders.map((h) => norm(h)));
  const creditSet = new Set(merged.creditHeaders.map((h) => norm(h)));
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i] || [];
    const cells = (Array.isArray(row) ? row : [row]).map((c) => norm(c));
    const hasAccount = cells.some((c) => accountSet.has(c));
    const hasDebit = cells.some((c) => debitSet.has(c));
    const hasCredit = cells.some((c) => creditSet.has(c));
    if (hasAccount && (hasDebit || hasCredit)) return i;
  }
  return -1;
}

/** Map header row to column indices for trial balance (account, name, debit, credit). */
function getTrialBalanceColumnMap(headerRow) {
  const merged = getMergedTrialBalanceHeaders(TRIAL_BALANCE);
  const accountSet = new Set(merged.accountHeaders.map((h) => norm(h)));
  const debitSet = new Set(merged.debitHeaders.map((h) => norm(h)));
  const creditSet = new Set(merged.creditHeaders.map((h) => norm(h)));
  const row = Array.isArray(headerRow) ? headerRow : [headerRow];
  let colAccount = -1;
  let colName = -1;
  let colDebit = -1;
  let colCredit = -1;
  row.forEach((cell, idx) => {
    const c = norm(cell);
    if (accountSet.has(c) && colAccount < 0) colAccount = idx;
    if (debitSet.has(c)) colDebit = idx;
    if (creditSet.has(c)) colCredit = idx;
  });
  if (colAccount < 0) colAccount = 0;
  if (colName < 0) colName = colAccount + 1 <= row.length - 1 ? colAccount + 1 : colAccount;
  if (colDebit < 0) colDebit = TRIAL_BALANCE.defaultColDebit;
  if (colCredit < 0) colCredit = TRIAL_BALANCE.defaultColCredit;
  return { colAccount, colName, colDebit, colCredit };
}

function findBalanceSheetHeaderRow(rows) {
  const { accountPattern, debitPattern, creditPattern, balancePattern } = BALANCE_SHEET;
  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const row = rows[i] || [];
    const cells = (Array.isArray(row) ? row : [row]).map((c) => String(c ?? '').trim());
    const hasAccount = cells.some((c) => accountPattern.test(c));
    const hasDebit = cells.some((c) => debitPattern.test(c));
    const hasCredit = cells.some((c) => creditPattern.test(c));
    const hasBalance = cells.some((c) => balancePattern.test(c));
    if (hasAccount && (hasDebit || hasCredit || hasBalance)) return i;
  }
  return -1;
}

function getBalanceSheetColumnMap(headerRow) {
  const row = Array.isArray(headerRow) ? headerRow : [headerRow];
  const map = { colAccount: -1, colName: -1, colDebit: -1, colCredit: -1, colBalance: -1 };
  const { accountPattern, namePattern, debitHeaderPattern, creditHeaderPattern, balanceHeaderPattern } = BALANCE_SHEET;

  row.forEach((cell, idx) => {
    const s = String(cell ?? '').trim();
    if (accountPattern.test(s) && map.colAccount < 0) map.colAccount = idx;
    if (namePattern.test(s) && map.colName < 0) map.colName = idx;
    if (debitHeaderPattern.test(s)) map.colDebit = idx;
    if (creditHeaderPattern.test(s)) map.colCredit = idx;
    if (balanceHeaderPattern.test(s) && map.colBalance < 0) map.colBalance = idx;
  });

  if (map.colAccount < 0) map.colAccount = 0;
  if (map.colName < 0) map.colName = map.colAccount + 1;
  return map;
}

function parseMonthRow(monthStr) {
  const s = String(monthStr ?? '').trim();
  const matchLong = s.match(MONTH_ROW.longPattern);
  const matchShort = s.match(MONTH_ROW.shortPattern);
  let monthNum = 1;
  let year = new Date().getFullYear();
  if (matchLong) {
    monthNum = MONTH_ROW.monthNamesShort.indexOf(matchLong[1].toLowerCase().slice(0, 3)) + 1;
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

/** Infer post month MM/YYYY from filename (see parsingRules.FILENAME_MONTH). */
export function getPostMonthFromFilename(filename) {
  const name = String(filename ?? '');
  let match = name.match(FILENAME_MONTH.patternFullYear);
  if (match) {
    const month = Math.min(12, Math.max(1, parseInt(match[1], 10)));
    const year = parseInt(match[2], 10);
    if (!Number.isNaN(year)) return `${String(month).padStart(2, '0')}/${year}`;
  }
  match = name.match(FILENAME_MONTH.patternShortYear);
  if (match) {
    const month = Math.min(12, Math.max(1, parseInt(match[1], 10)));
    const yy = parseInt(match[2], 10);
    if (!Number.isNaN(yy)) {
      const year = yy >= 0 && yy <= 99 ? FILENAME_MONTH.shortYearBase + yy : yy;
      return `${String(month).padStart(2, '0')}/${year}`;
    }
  }
  return null;
}

/** Extract property name from filename (see parsingRules.PROPERTY_FROM_FILENAME). */
export function getPropertyNameFromFilename(filename) {
  const name = String(filename ?? '').replace(/\.xlsx?$/i, '');
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  const { excludeWords, validWordPattern, minLength } = PROPERTY_FROM_FILENAME;
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (validWordPattern.test(p) && p.length >= minLength && !excludeWords.has(p)) return p;
  }
  return null;
}

function parseNum(v) {
  if (v === undefined || v === null || v === '') return 0;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const n = parseFloat(String(v).replace(NUMERIC.stripFromNumber, ''), 10);
  return Number.isNaN(n) ? 0 : n;
}

const LEFT_ALIGN = { alignment: { horizontal: 'left', vertical: 'center' } };

/** Apply formats: col A = number (Tran_Seq), col H/I = number (Debit/Credit); rest = text; all cells left-aligned. */
function applyYardiCellFormats(ws, rowCount, colCount = 12) {
  const DEBIT_COL = 7;
  const CREDIT_COL = 8;
  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      const cell = ws[ref];
      if (!cell) continue;
      const raw = cell.v;
      if (c === 0 && r > 0) {
        const num = typeof raw === 'number' && !Number.isNaN(raw) ? raw : parseInt(String(raw).replace(/^'/, ''), 10);
        cell.t = 'n';
        cell.v = Number.isNaN(num) ? 1 : num;
        delete cell.z;
        cell.w = String(cell.v);
        cell.s = LEFT_ALIGN;
        continue;
      }
      if ((c === DEBIT_COL || c === CREDIT_COL) && r > 0) {
        const num = parseNum(raw);
        cell.t = 'n';
        cell.v = num;
        cell.z = '#,##0.00';
        cell.w = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        cell.s = LEFT_ALIGN;
        continue;
      }
      const asText = raw === undefined || raw === null ? '' : String(raw);
      cell.t = 's';
      cell.v = asText;
      cell.z = '@';
      cell.w = asText;
      cell.s = LEFT_ALIGN;
    }
  }
}

/** Compute column widths from sheet content so nothing gets cut off (auto-fit). */
function getAutoFitColWidths(ws, rowCount, colCount) {
  const widths = Array(colCount).fill(8);
  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      const cell = ws[ref];
      if (!cell) continue;
      const len = (cell.w != null ? String(cell.w) : String(cell.v ?? '')).length;
      widths[c] = Math.max(widths[c], Math.min(len + 1, 60));
    }
  }
  return widths.map((wch) => ({ wch: Math.max(8, Math.min(60, wch)) }));
}

/** Build Excel blob from pre-built Yardi JE rows (header + data). Left-aligned, auto-fit columns. */
export function buildExcelFromYardiRows(yardiRows) {
  if (!yardiRows?.length) throw new Error('No rows');
  const ws = XLSX.utils.aoa_to_sheet(yardiRows);
  const rowCount = yardiRows.length;
  const colCount = Math.max(...yardiRows.map((row) => (Array.isArray(row) ? row.length : 0)), 12);
  applyYardiCellFormats(ws, rowCount, colCount);
  ws['!cols'] = getAutoFitColWidths(ws, rowCount, colCount);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, YARDI_JE_SHEET_NAME);
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/** Extract property name from sheet (row 4: "Properties: Fitz - ..."). */
function extractPropertyNameFromRow4(rows) {
  const row = rows && rows[PROPERTY_FROM_SHEET.rowIndex];
  if (!row) return null;
  const cell = String((Array.isArray(row) ? row[0] : row) ?? '').trim();
  const match = cell.match(PROPERTY_FROM_SHEET.pattern);
  return match ? match[1].trim() || null : null;
}

function looksLikeTimestampOrDate(str) {
  return PROPERTY_IGNORE_PATTERNS.some((re) => re.test(String(str ?? '').trim()));
}

/** Extract period MM/YYYY from first rows (for pre-filling post month). */
export function extractPeriod(rows) {
  const { maxRowsToScan, monthNamePattern, monthNamesShort, shortPattern } = PERIOD_IN_CELL;
  for (let i = 0; i < Math.min(rows.length, maxRowsToScan); i++) {
    const row = rows[i] || [];
    const cell = String((Array.isArray(row) ? row[0] : row) ?? '').trim();
    const monthMatch = cell.match(monthNamePattern);
    const shortMatch = cell.match(shortPattern);
    if (monthMatch) {
      const m = monthNamesShort.indexOf(monthMatch[1].toLowerCase().slice(0, 3)) + 1;
      return `${String(m).padStart(2, '0')}/${monthMatch[2]}`;
    }
    if (shortMatch) return `${String(parseInt(shortMatch[1], 10)).padStart(2, '0')}/${shortMatch[2]}`;
  }
  return null;
}

function buildYardiJeRowsFromTrialBalance(rows, options = {}) {
  const out = [YARDI_JE_HEADERS];
  const idx = findTrialBalanceHeaderRow(rows);
  if (idx < 0) throw new Error('Could not find a trial balance header row. The sheet should have column headers like Account, Debit, and Credit.');

  const titleRows = rows.slice(0, idx);
  const tableRows = rows.slice(idx);
  const headerRow = tableRows[0];
  const dataRows = tableRows.slice(1);
  const colMap = getTrialBalanceColumnMap(headerRow);

  const fromSheet = String(titleRows?.[1]?.[0] ?? '').trim();
  const propertyFromRow4 = extractPropertyNameFromRow4(rows);
  const propertyName = (options.propertyName && String(options.propertyName).trim()) || propertyFromRow4 || (!looksLikeTimestampOrDate(fromSheet) && fromSheet) || '';
  const parsed = parseMonthRow(titleRows?.[2]?.[0]);
  const postMonth = options.postMonth && String(options.postMonth).trim() ? String(options.postMonth).trim() : parsed.postMonth;
  const journalDate = options.journalDate && String(options.journalDate).trim() ? String(options.journalDate).trim() : parsed.journalDate;
  const book = YARDI_DEFAULTS.book;
  const unit = YARDI_DEFAULTS.unit;

  const pad12 = (arr) => {
    const a = [...arr];
    while (a.length < 12) a.push('');
    return a.slice(0, 12);
  };

  const numVal = (s) => {
    const n = parseFloat(String(s).replace(NUMERIC.stripFromNumber, ''), 10);
    return isNaN(n) ? 0 : n;
  };

  dataRows.forEach((row) => {
    const account = row[colMap.colAccount] ?? '';
    const name = String(row[colMap.colName] ?? '').trim();
    const debit = row[colMap.colDebit] ?? '';
    const credit = row[colMap.colCredit] ?? '';
    const isTotalRow = SKIP_ROW.totalPattern.test(name) || SKIP_ROW.totalPattern.test(String(account));
    if (isTotalRow) return;

    const d = numVal(debit);
    const c = numVal(credit);
    if (d === 0 && c === 0) return;

    const accountVal = String(account ?? '');
    const displayVal = postMonth ? `${postMonth} - ${accountVal}` : accountVal;

    out.push(pad12([
      1,
      journalDate,
      postMonth,
      propertyName,
      displayVal,
      displayVal,
      displayVal,
      String(debit),
      String(credit),
      displayVal,
      book,
      unit,
    ]));
  });

  return out;
}

function buildYardiJeRowsFromBalanceSheet(rows, options = {}) {
  const out = [YARDI_JE_HEADERS];
  const idx = findBalanceSheetHeaderRow(rows);
  if (idx < 0) throw new Error('Could not find a balance sheet header row. The sheet should have Account and either Debit/Credit or a Balance column.');

  const titleRows = rows.slice(0, idx);
  const tableRows = rows.slice(idx);
  const headerRow = tableRows[0];
  const dataRows = tableRows.slice(1);
  const map = getBalanceSheetColumnMap(headerRow);

  const fromSheet = String(titleRows?.[1]?.[0] ?? titleRows?.[0]?.[0] ?? '').trim();
  const propertyFromRow4 = extractPropertyNameFromRow4(rows);
  const propertyName = (options.propertyName && String(options.propertyName).trim()) || propertyFromRow4 || (!looksLikeTimestampOrDate(fromSheet) && fromSheet) || '';
  const parsed = parseMonthRow(titleRows?.[2]?.[0] ?? titleRows?.[1]?.[0] ?? '');
  const postMonth = options.postMonth && String(options.postMonth).trim() ? String(options.postMonth).trim() : parsed.postMonth;
  const journalDate = options.journalDate && String(options.journalDate).trim() ? String(options.journalDate).trim() : parsed.journalDate;
  const book = YARDI_DEFAULTS.book;
  const unit = YARDI_DEFAULTS.unit;

  const pad12 = (arr) => {
    const a = [...arr];
    while (a.length < 12) a.push('');
    return a.slice(0, 12);
  };

  const getCell = (row, col) => (row && col >= 0 ? String(row[col] ?? '').trim() : '');
  const num = (s) => {
    const n = parseFloat(String(s).replace(NUMERIC.stripFromNumber, ''), 10);
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

    const isTotalRow = SKIP_ROW.totalPattern.test(name) || SKIP_ROW.totalPattern.test(account);
    if (isTotalRow) return;
    if (!account && !name) return;

    const acc = account || '';
    const displayVal = postMonth ? `${postMonth} - ${acc}` : acc;

    out.push(pad12([
      1,
      journalDate,
      postMonth,
      propertyName,
      displayVal,
      displayVal,
      displayVal,
      debit,
      credit,
      displayVal,
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

/** Return the detected header row (ACCOUNT, DEBIT, CREDIT etc.) for feedback learning, or undefined. */
export function getDetectedHeaderRow(rows) {
  const tbIdx = findTrialBalanceHeaderRow(rows);
  if (tbIdx >= 0) {
    const row = rows[tbIdx];
    return Array.isArray(row) ? row : [row];
  }
  const bsIdx = findBalanceSheetHeaderRow(rows);
  if (bsIdx >= 0) {
    const row = rows[bsIdx];
    return Array.isArray(row) ? row : [row];
  }
  return undefined;
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
  const { postMonth, journalDate, docType = 'auto', propertyName } = options;
  const journalDateMmDdYyyy = journalDate ? ymdToMmDdYyyy(journalDate) : null;
  const opts = {
    postMonth: postMonth || undefined,
    journalDate: journalDateMmDdYyyy || undefined,
    propertyName: propertyName || undefined,
  };

  const useTrialBalance = docType === 'trial_balance' || (docType === 'auto' && findTrialBalanceHeaderRow(rows) >= 0);
  const useBalanceSheet = docType === 'balance_sheet' || (docType === 'auto' && findBalanceSheetHeaderRow(rows) >= 0);

  if (useTrialBalance) return buildYardiJeRowsFromTrialBalance(rows, opts);
  if (useBalanceSheet) return buildYardiJeRowsFromBalanceSheet(rows, opts);
  throw new Error('Could not detect trial balance or balance sheet. The sheet needs column headers such as Account, Debit, Credit (or Balance).');
}

/**
 * Build Yardi JE rows and return an Excel file as a Blob (runs in browser, no server).
 * options.docType: 'trial_balance' | 'balance_sheet' | 'auto' (default: auto-detect).
 */
export function buildYardiJeExcel(rows, options = {}) {
  const exportRows = getYardiJeRows(rows, options);
  return buildExcelFromYardiRows(exportRows);
}

/** Last day of month MM/YYYY as YYYY-MM-DD (for journalDate). */
function lastDayYmd(postMonth) {
  if (!postMonth || !/^\d{1,2}\/\d{4}$/.test(String(postMonth).trim())) return '';
  const [mm, yyyy] = String(postMonth).trim().split('/').map((n) => parseInt(n, 10));
  const d = new Date(yyyy, mm, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Parse multiple trial balance files (e.g. one per month), combine into one Yardi JE workbook.
 * Each file: post month inferred from filename (e.g. "1.2025 Fitz TB.xlsx" → 01/2025) or from sheet.
 * Returns { blob, suggestedName, months }.
 */
export async function combineMultipleTrialBalances(files, options = {}) {
  if (!files?.length) throw new Error('No files selected');
  const docType = options.docType === 'trial_balance' || options.docType === 'balance_sheet' ? options.docType : 'auto';

  const parsed = await Promise.all(
    Array.from(files).map(async (file) => {
      const { rows, detectedPeriod, detectedType } = await parseExcelFile(file);
      const postMonthFromName = getPostMonthFromFilename(file.name);
      const postMonth = postMonthFromName || (detectedPeriod ? String(detectedPeriod).trim() : null);
      const propertyName = getPropertyNameFromFilename(file.name);
      return { name: file.name, rows, postMonth, detectedType, propertyName };
    })
  );

  const withMonth = parsed
    .filter((p) => p.rows?.length)
    .map((p) => {
      const postMonth = p.postMonth || null;
      const sortKey = postMonth ? (() => {
        const [mm, yyyy] = postMonth.split('/').map(Number);
        return yyyy * 12 + mm;
      })() : 0;
      return { ...p, postMonth, sortKey };
    })
    .sort((a, b) => a.sortKey - b.sortKey);

  if (withMonth.length === 0) throw new Error('No valid data in the selected files. Each file should have a trial balance with a detectable month (e.g. in the filename).');

  const combined = [YARDI_JE_HEADERS];
  const propertyOverride = options.propertyNameOverride && String(options.propertyNameOverride).trim();

  const maxCols = Math.max(...withMonth.flatMap((m) => (m.rows || []).map((r) => (Array.isArray(r) ? r.length : 1))), 1);
  const padRow = (row) => {
    const arr = Array.isArray(row) ? [...row] : [row];
    while (arr.length < maxCols) arr.push('');
    return arr.slice(0, maxCols);
  };
  const combinedParsedRows = [];
  for (let i = 0; i < withMonth.length; i++) {
    const { rows, postMonth } = withMonth[i];
    if (i > 0) {
      combinedParsedRows.push(padRow(['']));
      combinedParsedRows.push(padRow([`——— ${postMonth || 'Month'} ———`]));
    }
    (rows || []).forEach((row) => combinedParsedRows.push(padRow(row)));
  }

  for (const { rows, postMonth, propertyName } of withMonth) {
    if (!postMonth) continue;
    const journalDateYmd = lastDayYmd(postMonth);
    const yardiRows = getYardiJeRows(rows, {
      postMonth,
      journalDate: journalDateYmd || undefined,
      docType,
      propertyName: propertyOverride || propertyName || undefined,
    });
    const dataRows = yardiRows.slice(1);
    const monthNum = parseInt(String(postMonth).split('/')[0], 10) || 1;
    for (const row of dataRows) {
      const arr = Array.isArray(row) ? [...row] : [row];
      arr[0] = monthNum;
      combined.push(arr);
    }
  }

  const blob = buildExcelFromYardiRows(combined);
  const firstMonth = withMonth[0]?.postMonth?.replace('/', '-') || 'year';
  const lastMonth = withMonth[withMonth.length - 1]?.postMonth?.replace('/', '-') || '';
  const suggestedName = `yardi_je_${firstMonth}_to_${lastMonth}.xlsx`.replace(/\/|\\/g, '-');
  return { blob, suggestedName, months: withMonth.map((m) => m.postMonth), combinedRows: combined, combinedParsedRows };
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

/** Escape a CSV cell (quotes and wrap in quotes if needed). */
function escapeCsvCell(val) {
  const s = String(val ?? '');
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Build CSV string from 2D rows (for Google Sheets import).
 * Uses comma delimiter and RFC 4180-style quoting.
 */
export function buildCsvFromRows(rows) {
  if (!rows?.length) return '';
  return rows
    .map((row) => {
      const arr = Array.isArray(row) ? row : [row];
      return arr.map(escapeCsvCell).join(',');
    })
    .join('\r\n');
}

/**
 * Download rows as CSV (for Google Sheets: File → Import → Upload).
 */
export function downloadCsv(rows, filename = 'export.csv') {
  const csv = buildCsvFromRows(rows);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, filename);
}

/** Generate and download a blank Yardi JE template (headers + one sample row). */
export function downloadYardiJeTemplate() {
  const headers = YARDI_JE_HEADERS;
  const sampleRow = [1, '01/31/2025', '01/2025', 'Property Name', '01/2025 - 1000', '01/2025 - 1000', '01/2025 - 1000', '100', '0', '01/2025 - 1000', YARDI_DEFAULTS.book, YARDI_DEFAULTS.unit];
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
