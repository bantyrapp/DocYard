/**
 * One place that learns from feedback. Updates learned parsing rules when
 * users submit low scores (1–2) with categories like column_mapping or
 * header_detection. Structured so we can plug in a PyTorch (or other) model later.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const RULES_FILE = path.join(DATA_DIR, 'learned_rules.json');
const MAX_LEARNED_PER_TYPE = 50;

function normalize(s) {
  return String(s ?? '').trim().toUpperCase().replace(/\s+/g, '');
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function defaultRules() {
  return { accountHeaders: [], debitHeaders: [], creditHeaders: [], lastUpdated: null };
}

export function getLearnedRules() {
  ensureDataDir();
  if (!fs.existsSync(RULES_FILE)) return defaultRules();
  try {
    const raw = fs.readFileSync(RULES_FILE, 'utf8');
    const data = JSON.parse(raw);
    return {
      accountHeaders: Array.isArray(data.accountHeaders) ? data.accountHeaders : [],
      debitHeaders: Array.isArray(data.debitHeaders) ? data.debitHeaders : [],
      creditHeaders: Array.isArray(data.creditHeaders) ? data.creditHeaders : [],
      lastUpdated: data.lastUpdated || null,
    };
  } catch {
    return defaultRules();
  }
}

function saveRules(rules) {
  ensureDataDir();
  const payload = {
    ...rules,
    lastUpdated: new Date().toISOString(),
  };
  fs.writeFileSync(RULES_FILE, JSON.stringify(payload, null, 0));
}

/** Extract header-like tokens from message (same logic as client feedbackLearner). */
function extractFromMessage(message) {
  const text = String(message ?? '').trim();
  if (!text.length) return { account: [], debit: [], credit: [] };

  const account = [];
  const debit = [];
  const credit = [];

  const quoted = text.matchAll(/["']([^"']+)["']/g);
  for (const m of quoted) {
    const word = m[1].trim();
    if (word.length >= 2 && word.length <= 40) account.push(normalize(word));
  }

  const accountPhrases = text.matchAll(/\baccount\s*(?:column|header|#)?\s*(?:is|should be|:|=|was)\s*["']?([A-Za-z0-9\s#\-_]+?)["']?(?:\s|\.|,|$)/gi);
  for (const m of accountPhrases) {
    const w = m[1].trim();
    if (w.length >= 2) account.push(normalize(w));
  }
  const debitPhrases = text.matchAll(/\bdebit\s*(?:column|header)?\s*(?:is|should be|:|=|was)\s*["']?([A-Za-z0-9\s\-_]+?)["']?(?:\s|\.|,|$)/gi);
  for (const m of debitPhrases) {
    const w = m[1].trim();
    if (w.length >= 2) debit.push(normalize(w));
  }
  const creditPhrases = text.matchAll(/\bcredit\s*(?:column|header)?\s*(?:is|should be|:|=|was)\s*["']?([A-Za-z0-9\s\-_]+?)["']?(?:\s|\.|,|$)/gi);
  for (const m of creditPhrases) {
    const w = m[1].trim();
    if (w.length >= 2) credit.push(normalize(w));
  }

  const commaSplit = text.split(/[\t,]/).map((s) => s.trim()).filter(Boolean);
  if (commaSplit.length >= 3 && commaSplit.length <= 15) {
    commaSplit.forEach((s) => {
      if (s.length >= 2 && s.length <= 30) account.push(normalize(s));
    });
  }

  return {
    account: [...new Set(account)].filter(Boolean),
    debit: [...new Set(debit)].filter(Boolean),
    credit: [...new Set(credit)].filter(Boolean),
  };
}

function extractFromHeaderRow(headerRow) {
  if (!headerRow || !Array.isArray(headerRow)) return { account: [], debit: [], credit: [] };
  const cells = headerRow.map((c) => String(c ?? '').trim()).filter((s) => s.length >= 2 && s.length <= 40);
  const account = cells.map(normalize).filter(Boolean);
  return { account, debit: [], credit: [] };
}

/**
 * Apply one feedback entry: if score is low (1–2) and category is column/header related,
 * merge extracted headers into learned rules so the parser improves.
 */
export function applyFeedback(entry) {
  const score = Number(entry.score);
  if (score > 2) return;

  const category = entry.category || entry.subcategory || '';
  const isColumnOrHeader =
    category === 'column_mapping' ||
    category === 'header_detection' ||
    (entry.subcategory && ['account', 'debit', 'credit', 'wrong_row', 'missing', 'extra_rows'].includes(entry.subcategory));

  if (!isColumnOrHeader) return;

  const learned = getLearnedRules();
  const fromMessage = extractFromMessage(entry.message);
  const fromRow = Array.isArray(entry.headerRow) ? extractFromHeaderRow(entry.headerRow) : { account: [], debit: [], credit: [] };

  const merge = (existing, incoming) => {
    const set = new Set(existing);
    incoming.forEach((x) => set.add(x));
    return [...set].slice(-MAX_LEARNED_PER_TYPE);
  };

  learned.accountHeaders = merge(learned.accountHeaders, fromMessage.account.concat(fromRow.account));
  learned.debitHeaders = merge(learned.debitHeaders, fromMessage.debit.concat(fromRow.debit));
  learned.creditHeaders = merge(learned.creditHeaders, fromMessage.credit.concat(fromRow.credit));

  saveRules(learned);
}
