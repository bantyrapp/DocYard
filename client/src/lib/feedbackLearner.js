/**
 * Feedback learner: interprets user feedback and updates learned parsing rules
 * so the parser improves over time. Merges client (localStorage) + server-learned
 * rules so the backend "catches up" and everyone benefits.
 */

const STORAGE_KEY = 'docyard_learned_rules';
const MAX_LEARNED_PER_TYPE = 50;
const API = '/api';

/** Server-learned rules cache; populated by loadServerLearnedRules() or on first getMergedTrialBalanceHeaders. */
let serverRulesCache = null;
let serverFetchStarted = false;

/** Call on app load so server rules are ready when user parses. */
export function loadServerLearnedRules() {
  if (serverFetchStarted) return Promise.resolve();
  serverFetchStarted = true;
  return fetch(`${API}/feedback/learned-rules`)
    .then((r) => r.json())
    .then((d) => {
      if (d?.success && d?.data) serverRulesCache = d.data;
    })
    .catch(() => {});
}

function normalize(s) {
  return String(s ?? '').trim().toUpperCase().replace(/\s+/g, '');
}

export function getLearnedRules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultLearned();
    const data = JSON.parse(raw);
    return {
      accountHeaders: Array.isArray(data.accountHeaders) ? data.accountHeaders : [],
      debitHeaders: Array.isArray(data.debitHeaders) ? data.debitHeaders : [],
      creditHeaders: Array.isArray(data.creditHeaders) ? data.creditHeaders : [],
    };
  } catch {
    return defaultLearned();
  }
}

function defaultLearned() {
  return { accountHeaders: [], debitHeaders: [], creditHeaders: [] };
}

function saveLearned(rules) {
  try {
    const payload = {
      ...rules,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (_) {}
}

/** Extract header-like tokens from feedback message for "bad" feedback. */
function extractFromMessage(message) {
  const text = String(message ?? '').trim();
  if (!text.length) return { account: [], debit: [], credit: [] };

  const account = [];
  const debit = [];
  const credit = [];

  // Quoted strings: "Account Code", 'GL Number'
  const quoted = text.matchAll(/["']([^"']+)["']/g);
  for (const m of quoted) {
    const word = m[1].trim();
    if (word.length >= 2 && word.length <= 40) account.push(normalize(word));
  }

  // "account (column/header) is X" or "account: X" or "use X for account"
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

  // If user pasted a header row (comma- or tab-separated), take first few tokens
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

/** Add header row cells as learned account column candidates (when feedback is bad). */
function extractFromHeaderRow(headerRow) {
  if (!headerRow || !Array.isArray(headerRow)) return { account: [], debit: [], credit: [] };
  const cells = headerRow.map((c) => String(c ?? '').trim()).filter((s) => s.length >= 2 && s.length <= 40);
  const account = cells.map(normalize).filter(Boolean);
  return { account, debit: [], credit: [] };
}

/**
 * Call when user submits feedback. For "bad" + message (or headerRow), extracts
 * hints and merges into learned rules. Optional headerRow = array of header cell values.
 */
export function addLearnedFromFeedback({ type, message, headerRow }) {
  if (type !== 'bad' && type !== 'down') return;
  const learned = getLearnedRules();

  const fromMessage = extractFromMessage(message);
  const fromRow = headerRow ? extractFromHeaderRow(headerRow) : { account: [], debit: [], credit: [] };

  const merge = (existing, incoming) => {
    const set = new Set(existing);
    incoming.forEach((x) => set.add(x));
    return [...set].slice(-MAX_LEARNED_PER_TYPE);
  };

  learned.accountHeaders = merge(learned.accountHeaders, fromMessage.account.concat(fromRow.account));
  learned.debitHeaders = merge(learned.debitHeaders, fromMessage.debit.concat(fromRow.debit));
  learned.creditHeaders = merge(learned.creditHeaders, fromMessage.credit.concat(fromRow.credit));

  saveLearned(learned);
}

/**
 * Return merged static + client-learned + server-learned headers for trial balance detection.
 * Pass the static TRIAL_BALANCE object from parsingRules. Kicks off a one-time fetch
 * for server rules so the next parse can use them if not already loaded.
 */
export function getMergedTrialBalanceHeaders(staticRules) {
  if (!serverFetchStarted) loadServerLearnedRules();
  const learned = getLearnedRules();
  const server = serverRulesCache || { accountHeaders: [], debitHeaders: [], creditHeaders: [] };
  return {
    accountHeaders: [...(staticRules.accountHeaders || []), ...learned.accountHeaders, ...(server.accountHeaders || [])],
    debitHeaders: [...(staticRules.debitHeaders || []), ...learned.debitHeaders, ...(server.debitHeaders || [])],
    creditHeaders: [...(staticRules.creditHeaders || []), ...learned.creditHeaders, ...(server.creditHeaders || [])],
  };
}
