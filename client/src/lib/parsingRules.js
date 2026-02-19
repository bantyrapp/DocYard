/**
 * Parsing rules — everything we've learned to look for when detecting
 * trial balance / balance sheet and building Yardi JE output.
 * Update this file to "train" the parser on new patterns.
 */

// —— Trial balance header detection ——
// We need: an account-like column + (debit or credit).
export const TRIAL_BALANCE = {
  /** Exact header matches (normalized: uppercase, no spaces). */
  accountHeaders: ['ACCOUNT', 'GL', 'GLACCOUNT', 'ACCOUNT#', 'ACCT', 'ACCTNO', 'ACCOUNTNO', 'ACCOUNTNUMBER'],
  debitHeaders: ['DEBIT', 'DEBITS'],
  creditHeaders: ['CREDIT', 'CREDITS'],
  /** Trial balance data row columns (0-based): 0=account, 1=name/description, 2=often blank or sub-account, 3=debit, 4=credit. */
  defaultColAccount: 0,
  defaultColName: 1,
  defaultColDebit: 3,
  defaultColCredit: 4,
};

// —— Balance sheet header detection ——
// We need: account-like + (debit or credit or balance).
export const BALANCE_SHEET = {
  accountPattern: /ACCOUNT|GL|CODE|ACCOUNT#|ACCT|ACCT\s*NO/i,
  namePattern: /NAME|DESCRIPTION|DESC|ACCOUNTNAME/i,
  debitPattern: /DEBIT|DEBITS/i,
  creditPattern: /CREDIT|CREDITS/i,
  balancePattern: /BALANCE|ENDING|AMOUNT|CURRENT/i,
  /** Column header regexes for mapping. */
  debitHeaderPattern: /^DEBIT|DEBITS$/i,
  creditHeaderPattern: /^CREDIT|CREDITS$/i,
  balanceHeaderPattern: /CURRENT\s*BALANCE|BALANCE|ENDING|AMOUNT|CURRENT/i,
};

// —— Rows to skip (totals / subtotals) ——
export const SKIP_ROW = {
  totalPattern: /TOTAL|SUBTOTAL/i,
};

// —— Property name: from sheet row 4 ——
// Many Palomar/management exports use "Properties: Fitz - 3625 16th St NW..."
export const PROPERTY_FROM_SHEET = {
  /** 1-based row index (row 4 = index 3). */
  rowIndex: 3,
  /** Extract property name before " - " (address follows). */
  pattern: /Properties:\s*([^-]+?)\s*-\s*/i,
};

// —— Property name: do NOT use sheet value if it looks like ——
export const PROPERTY_IGNORE_PATTERNS = [
  /^Exported\s+On:/i,
  /^\d{1,2}\/\d{1,2}\/\d{2,4}/,
  /^\d{4}-\d{2}-\d{2}/,
];

// —— Property name: from filename ——
// e.g. "01.25 JE Fitz.xlsx" or "1.2025 Fitz TB.xlsx" → "Fitz"
export const PROPERTY_FROM_FILENAME = {
  /** Words we never use as property name (abbreviations). */
  excludeWords: new Set(['JE', 'TB', 'GL', 'Trial', 'Balance', 'Sheet', 'Upload', 'Import', 'Export']),
  /** Property name: letters/numbers, min 2 chars, not in exclude list. */
  validWordPattern: /^[A-Za-z][A-Za-z0-9&]*$/,
  minLength: 2,
};

// —— Post month from filename ——
// "1.2025 Fitz TB.xlsx" → 01/2025; "01.25 JE Fitz.xlsx" → 01/2025
export const FILENAME_MONTH = {
  /** M.YYYY or MM.YYYY */
  patternFullYear: /(\d{1,2})\.(\d{4})\b/,
  /** MM.YY → 20YY */
  patternShortYear: /(\d{1,2})\.(\d{2})\b/,
  shortYearBase: 2000,
};

// —— Period (post month) from sheet cells ——
// Look in first ~10 rows for "Jan 2025", "01/2025", etc.
export const PERIOD_IN_CELL = {
  maxRowsToScan: 10,
  monthNamePattern: /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})\b/i,
  monthNamesShort: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
  shortPattern: /\b(\d{1,2})[\/\-]\s*(\d{4})\b/,
};

// —— parseMonthRow: date string in a title cell ——
export const MONTH_ROW = {
  longPattern: /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})\b/i,
  shortPattern: /\b(\d{1,2})[\/\-]\s*(\d{4})\b/,
  monthNamesShort: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
};

// —— Numeric values in cells ——
export const NUMERIC = {
  /** Strip these before parseFloat. */
  stripFromNumber: /[,$]/g,
};

// —— Yardi JE output defaults ——
export const YARDI_DEFAULTS = {
  book: 'Both',
  unit: '101',
};
