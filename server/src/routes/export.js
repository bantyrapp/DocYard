import { Router } from 'express';
import * as XLSX from 'xlsx';
import { recordExport } from '../lib/stats.js';

const router = Router();

/** Yardi JE (Journal Entry) import template – column order must match JE Template.xlsx */
const YARDI_JE_HEADERS = [
  'Tran_Seq_Number',
  'JournalDate',
  'PostMonth',
  'Property_Name',
  'Account',
  'Reference',
  'Notes',
  'Debit',
  'Credit',
  'DetailNotes',
  'Book',
  'Unit',
];

const YARDI_JE_SHEET_NAME = 'TemplateFile';

/** Normalize header for matching (lowercase, no spaces/underscores) */
function norm(h) {
  return String(h ?? '').toLowerCase().replace(/[\s_]/g, '');
}

/** Aliases: user header norm -> Yardi column name (for mapping) */
const YARDI_ALIASES = {
  tran_seq_number: ['transeq', 'seq', 'sequence', 'trans#'],
  journaldate: ['date', 'journal date', 'transdate'],
  postmonth: ['post month', 'postmonth', 'period', 'month'],
  property_name: ['property', 'propertyname', 'entity', 'property name'],
  account: ['account', 'gl account', 'account number'],
  reference: ['reference', 'ref', 'source'],
  notes: ['notes', 'description', 'memo'],
  debit: ['debit', 'debits'],
  credit: ['credit', 'credits'],
  detailnotes: ['detail notes', 'detailnotes', 'detail'],
  book: ['book'],
  unit: ['unit', 'unit number'],
};

function findYardiColForUserHeader(userHeaderNorm) {
  const n = userHeaderNorm;
  for (const yardi of YARDI_JE_HEADERS) {
    if (norm(yardi) === n) return yardi;
    const aliases = YARDI_ALIASES[norm(yardi)];
    if (aliases && aliases.some((a) => a === n || n.includes(a) || a.includes(n))) return yardi;
  }
  return null;
}

/** Build rows for Yardi JE export: first row = Yardi headers, rest = data mapped by header name or by position */
function buildYardiJeRows(rows) {
  const out = [YARDI_JE_HEADERS];
  if (!rows || !rows.length) return out;

  const rawHeaders = (rows[0] || []).map((c) => String(c ?? '').trim());
  const isYardiHeader = rawHeaders.length >= 12 && norm(rawHeaders[0]) === 'tran_seq_number';
  const dataRows = isYardiHeader ? rows.slice(1) : rows;

  // Map each Yardi column to user column index: by header name/alias match, else by position
  const colIndex = {};
  YARDI_JE_HEADERS.forEach((h, i) => {
    const n = norm(h);
    let idx = rawHeaders.findIndex((r) => norm(r) === n);
    if (idx < 0) {
      idx = rawHeaders.findIndex((r) => findYardiColForUserHeader(norm(r)) === h);
    }
    colIndex[h] = idx >= 0 ? idx : (i < rawHeaders.length ? i : -1);
  });

  const pad = (arr) => {
    const a = [...arr];
    while (a.length < 12) a.push('');
    return a.slice(0, 12);
  };

  dataRows.forEach((row) => {
    const arr = YARDI_JE_HEADERS.map((h) => {
      const idx = colIndex[h];
      if (idx >= 0 && row[idx] !== undefined && row[idx] !== null) return String(row[idx]);
      return '';
    });
    out.push(pad(arr));
  });

  return out;
}

/** Find the ACCOUNT header row index in a full trial balance sheet (so we don't cut off title rows) */
function findTrialBalanceHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i] || [];
    const cells = (Array.isArray(row) ? row : [row]).map((c) => String(c ?? '').toUpperCase());
    const hasAccount = cells.some((c) => c.replace(/\s/g, '') === 'ACCOUNT');
    const hasDebit = cells.some((c) => c.replace(/\s/g, '') === 'DEBIT');
    const hasCredit = cells.some((c) => c.replace(/\s/g, '') === 'CREDIT');
    if (hasAccount && (hasDebit || hasCredit)) return i;
  }
  return -1;
}

/** Yardi Trial Balance template – matches trialbalance.xlsx (Report1) */
const YARDI_TB_SHEET_NAME = 'Report1';
const YARDI_TB_DATA_HEADERS = ['ACCOUNT', '', 'BALANCE', 'DEBIT', 'CREDIT', 'BALANCE'];

function buildYardiTrialBalanceRows(rows, titleRowsFromClient = null) {
  let titleRows = titleRowsFromClient;
  let tableRows = rows;

  // If full sheet was uploaded (title rows + ACCOUNT row + data), detect and split so we don't lose top rows
  if (rows?.length && findTrialBalanceHeaderRow(rows) >= 0) {
    const idx = findTrialBalanceHeaderRow(rows);
    titleRows = rows.slice(0, idx);
    tableRows = rows.slice(idx);
  }

  const out = [];
  out.push(['Trial Balance', '', '', '', '', '']);
  out.push([titleRows?.[1]?.[0] ?? '', '', '', '', '', '']);
  out.push([titleRows?.[2]?.[0] ?? '', '', '', '', '', '']);
  out.push([titleRows?.[3]?.[0] ?? '', '', '', '', '', '']);
  out.push(['', '', 'BEGINNING', '', '', 'ENDING']);
  out.push(YARDI_TB_DATA_HEADERS);

  if (!tableRows || !tableRows.length) {
    out.push(['', '', '', '', '', '']);
    return out;
  }

  const rawHeaders = (tableRows[0] || []).map((c) => String(c ?? '').trim().toUpperCase());
  const isTbHeader = rawHeaders[0] === 'ACCOUNT' && (rawHeaders.includes('DEBIT') || rawHeaders.includes('CREDIT'));
  const dataRows = isTbHeader ? tableRows.slice(1) : tableRows;

  const colMap = {};
  ['ACCOUNT', 'DEBIT', 'CREDIT'].forEach((h, i) => {
    let idx = rawHeaders.findIndex((r) => r.replace(/\s/g, '') === h.replace(/\s/g, ''));
    if (idx < 0 && h === 'ACCOUNT') idx = rawHeaders.findIndex((r) => /ACCOUNT|ACCT|CODE/.test(r));
    if (idx < 0 && (h === 'DEBIT' || h === 'CREDIT')) idx = rawHeaders.findIndex((r) => r.includes(h));
    colMap[h] = idx >= 0 ? idx : (h === 'ACCOUNT' ? 0 : h === 'DEBIT' ? 3 : 4);
  });
  const colAccountName = rawHeaders.findIndex((r) => /NAME|DESC|DESCRIPTION/.test(r)) >= 0
    ? rawHeaders.findIndex((r) => /NAME|DESC|DESCRIPTION/.test(r)) : 1;

  const pad6 = (arr) => {
    const a = [...arr];
    while (a.length < 6) a.push('');
    return a.slice(0, 6);
  };

  let sumDebit = 0;
  let sumCredit = 0;

  dataRows.forEach((row) => {
    const isTotalRow = String(row[1] ?? '').toUpperCase().trim() === 'TOTAL';
    if (isTotalRow) return;

    const account = row[colMap['ACCOUNT']] ?? row[0] ?? '';
    const name = row[colAccountName] ?? row[1] ?? '';
    const begBal = row[2] ?? '';
    const debit = row[colMap['DEBIT']] ?? row[3] ?? '';
    const credit = row[colMap['CREDIT']] ?? row[4] ?? '';
    const endBal = row[5] ?? '';
    const d = Number(debit) || 0;
    const c = Number(credit) || 0;
    sumDebit += d;
    sumCredit += c;
    out.push(pad6([String(account), String(name), String(begBal), String(debit), String(credit), String(endBal)]));
  });

  // TOTAL row – same layout as template (empty, TOTAL, 0, sum debit, sum credit, 0)
  out.push(['', 'TOTAL', 0, sumDebit, sumCredit, 0]);
  return out;
}

/** Parse "Month = Jan 2026" or "Month = 01/2026" → { postMonth: "01/2026", journalDate: "01/31/2026" } */
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

/** Extract "Accrual" from "Book = Accrual ; Tree = YSI Standard Trial Balance" */
function parseBookRow(bookStr) {
  const s = String(bookStr ?? '').trim();
  const match = s.match(/Book\s*=\s*([^;]+)/i);
  return match ? match[1].trim() : s || 'Accrual';
}

/** Build Yardi JE rows from a trial balance sheet: F = date + G description, K = Both, L = 101 */
/** options: { postMonth?, journalDate? } override dates (e.g. from user picker); otherwise parsed from sheet */
function buildYardiJeRowsFromTrialBalance(rows, options = {}) {
  const out = [YARDI_JE_HEADERS];
  const idx = findTrialBalanceHeaderRow(rows);
  if (idx < 0) return buildYardiJeRows(rows);

  const titleRows = rows.slice(0, idx);
  const tableRows = rows.slice(idx);
  const dataRows = tableRows.slice(1);

  const propertyName = String(titleRows?.[1]?.[0] ?? '').trim();
  const parsed = parseMonthRow(titleRows?.[2]?.[0]);
  const postMonth = options.postMonth != null && String(options.postMonth).trim() ? String(options.postMonth).trim() : parsed.postMonth;
  const journalDate = options.journalDate != null && String(options.journalDate).trim() ? String(options.journalDate).trim() : parsed.journalDate;
  const book = 'Both';
  const unit = '101';

  const pad12 = (arr) => {
    const a = [...arr];
    while (a.length < 12) a.push('');
    return a.slice(0, 12);
  };

  dataRows.forEach((row) => {
    const account = row[0] ?? '';
    const name = String(row[1] ?? '').trim();
    const debit = row[3] ?? '';
    const credit = row[4] ?? '';
    const isTotalRow = String(row[1] ?? '').toUpperCase().trim() === 'TOTAL';
    if (isTotalRow) return;

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

function safeSheetName(n) {
  return String(n ?? 'Sheet1').replace(/[\\/*?:\[\]]/g, '').slice(0, 31) || 'Sheet1';
}

router.post('/excel', (req, res) => {
  try {
    const { rows: rawRows, sheetName = 'Sheet1', format = 'standard', titleRows, postMonth, journalDate } = req.body;
    if (!rawRows || !Array.isArray(rawRows)) return res.status(400).json({ error: 'rows array required' });

    const rows = rawRows.map((r) => (Array.isArray(r) ? r : [r]).map((c) => (c == null ? '' : c)));

    let exportRows = rows;
    let name = safeSheetName(sheetName);
    let filename = `${(sheetName || 'export').replace(/[^a-z0-9_.-]/gi, '_')}.xlsx`;

    const isTrialBalanceSheet = findTrialBalanceHeaderRow(rows) >= 0;
    const dateOverrides = (postMonth != null || journalDate != null) ? { postMonth: postMonth || undefined, journalDate: journalDate || undefined } : undefined;

    if (format === 'yardi_je' || format === 'yardi') {
      if (isTrialBalanceSheet) {
        exportRows = buildYardiJeRowsFromTrialBalance(rows, dateOverrides);
      } else {
        exportRows = buildYardiJeRows(rows);
      }
      name = YARDI_JE_SHEET_NAME;
      filename = 'yardi_je_import.xlsx';
    } else if (format === 'yardi_trial_balance' || format === 'yardi_tb') {
      exportRows = buildYardiTrialBalanceRows(rows, Array.isArray(titleRows) ? titleRows : null);
      name = YARDI_TB_SHEET_NAME;
      filename = 'yardi_trial_balance.xlsx';
    }

    const ws = XLSX.utils.aoa_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, name);
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    if (format === 'yardi_je' || format === 'yardi' || format === 'yardi_trial_balance' || format === 'yardi_tb') {
      try { recordExport(); } catch (_) { /* ignore */ }
    }
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Export failed' });
  }
});

router.post('/csv', (req, res) => {
  try {
    const { rows, delimiter = ',' } = req.body;
    if (!rows || !Array.isArray(rows)) return res.status(400).json({ error: 'rows array required' });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws, { FS: delimiter });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="export.csv"');
    res.send(csv);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Export failed' });
  }
});

export const exportRouter = router;
