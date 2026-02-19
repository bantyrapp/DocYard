/**
 * Saved documents (parsed + Yardi metadata). Stored in localStorage.
 * Each doc: { id, label, type, parsedRows, docType, postMonth, journalDate, detectedType, pinned, createdAt, updatedAt }
 */

const STORAGE_KEY = 'docyard_documents';

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Documents save failed', e);
  }
}

export function getDocuments() {
  return loadAll();
}

export function getDocument(id) {
  return loadAll().find((d) => d.id === id) || null;
}

export function saveDocument(entry) {
  const list = loadAll();
  const now = new Date().toISOString();
  const id = entry.id || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const existing = list.findIndex((d) => d.id === id);
  const doc = {
    id,
    label: entry.label || 'Untitled',
    type: entry.type === 'yardi' || entry.type === 'parsed' || entry.type === 'both' ? entry.type : 'both',
    parsedRows: entry.parsedRows,
    docType: entry.docType || 'auto',
    postMonth: entry.postMonth || '',
    journalDate: entry.journalDate || '',
    detectedType: entry.detectedType || null,
    pinned: existing >= 0 ? list[existing].pinned : !!entry.pinned,
    createdAt: entry.createdAt || now,
    updatedAt: now,
  };
  if (existing >= 0) {
    doc.createdAt = list[existing].createdAt;
    list[existing] = doc;
  } else {
    list.unshift(doc);
  }
  saveAll(list);
  return doc;
}

/** Partial update (label, pinned, etc.). Sets updatedAt. */
export function updateDocument(id, updates) {
  const list = loadAll();
  const i = list.findIndex((d) => d.id === id);
  if (i < 0) return null;
  const now = new Date().toISOString();
  list[i] = { ...list[i], ...updates, updatedAt: now };
  saveAll(list);
  return list[i];
}

/** Create a new document from an existing one (new id, optional new label). */
export function duplicateDocument(id, newLabel) {
  const doc = getDocument(id);
  if (!doc) return null;
  return saveDocument({
    ...doc,
    id: undefined,
    label: newLabel || `${doc.label} (copy)`,
    pinned: false,
    createdAt: undefined,
    updatedAt: undefined,
  });
}

export function deleteDocument(id) {
  const list = loadAll().filter((d) => d.id !== id);
  saveAll(list);
}

export function formatDocType(type) {
  if (type === 'yardi') return 'Yardi export';
  if (type === 'parsed') return 'Parsed view';
  return 'Both';
}

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

/** Relative time for "what changed" clarity: "2 min ago", "Yesterday", "Jan 5, 2025" */
export function formatRelativeTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const sec = Math.floor((now - d) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400 && d.getDate() === now.getDate()) return 'Today';
  if (sec < 172800 && d.getDate() === now.getDate() - 1) return 'Yesterday';
  if (sec < 604800) return `${Math.floor(sec / 86400)} days ago`;
  return formatDateTime(iso);
}
