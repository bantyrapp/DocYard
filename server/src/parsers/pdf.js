import pdf from 'pdf-parse';

/**
 * Parse PDF into rows and columns by detecting column boundaries and section titles.
 * Uses consistent spacing/tabs across lines to align columns; preserves section headers.
 */
export async function parsePdf(buffer, options = {}) {
  const { orientation = 'portrait', format = 'general' } = options;
  const data = await pdf(buffer);
  const text = data.text || '';
  const numPages = data.numpages || 0;

  const lines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

  const isLikelyImage = numPages > 0 && text.length < 50 * numPages;

  const { rows, sectionTitles } = parsePdfToRowsAndColumns(lines);

  const bankStatement = tryParseBankStatement(lines, rows, format);

  return {
    text,
    numPages,
    orientation,
    format,
    isLikelyImage,
    summary: summarizePdfText(text),
    tableLike: rows,
    sectionTitles,
    bankStatement: bankStatement.parsed ? bankStatement : { parsed: false, rows, message: bankStatement.message },
  };
}

function summarizePdfText(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const lineCount = text.split(/\r?\n/).filter((l) => l.trim()).length;
  return {
    totalWords: words.length,
    totalLines: lineCount,
    preview: text.slice(0, 500) + (text.length > 500 ? '...' : ''),
  };
}

/**
 * Find column boundaries: positions (in character index) where we split, so columns align across rows.
 * We look for runs of 2+ spaces or tabs in each line and collect "split positions" (start of each run).
 * Then we cluster positions that are within a few chars of each other across lines to get global boundaries.
 */
function findColumnBoundaries(lines) {
  const allPositions = new Set();
  for (const line of lines) {
    let i = 0;
    const len = line.length;
    while (i < len) {
      const ch = line[i];
      if (ch === '\t') {
        allPositions.add(i);
        i++;
        continue;
      }
      if (ch === ' ') {
        let runStart = i;
        while (i < len && line[i] === ' ') i++;
        if (i - runStart >= 2) allPositions.add(runStart);
        continue;
      }
      i++;
    }
  }
  const sorted = [...allPositions].sort((a, b) => a - b);
  if (sorted.length === 0) return [];
  const clustered = [];
  let last = sorted[0];
  const threshold = 3;
  for (let k = 1; k < sorted.length; k++) {
    if (sorted[k] - last <= threshold) last = sorted[k];
    else {
      clustered.push(last);
      last = sorted[k];
    }
  }
  clustered.push(last);
  return clustered;
}

/**
 * Slice a line into cells at given column boundaries. Boundaries are character positions.
 */
function sliceLineAtBoundaries(line, boundaries) {
  if (boundaries.length === 0) return [line.trim()];
  const cells = [];
  let start = 0;
  for (const pos of boundaries) {
    cells.push(line.slice(start, pos).trim());
    start = pos;
    while (start < line.length && line[start] === ' ') start++;
  }
  cells.push(line.slice(start).trim());
  return cells;
}

/**
 * Detect if a line looks like a section title: short, or mostly one "cell", or all caps.
 */
function isLikelySectionTitle(cells, line) {
  const nonEmpty = cells.filter((c) => c.length > 0);
  if (nonEmpty.length <= 1 && line.length > 0) return true;
  if (line.length <= 60 && line === line.toUpperCase() && line.replace(/\s/g, '').length > 2) return true;
  if (nonEmpty.length === 1 && nonEmpty[0].length > 40) return true;
  return false;
}

/**
 * Parse lines into a grid of rows with aligned columns. Preserve section titles as rows.
 */
function parsePdfToRowsAndColumns(lines) {
  if (lines.length === 0) return { rows: [], sectionTitles: [] };

  const boundaries = findColumnBoundaries(lines);
  const sectionTitles = [];
  const rows = [];
  let maxCols = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let cells = boundaries.length > 0 ? sliceLineAtBoundaries(line, boundaries) : line.split(/\s{2,}|\t/).map((s) => s.trim()).filter((s, _, arr) => arr.length !== 1 || s.length > 0);
    if (cells.length === 0) cells = [line.trim()];

    if (isLikelySectionTitle(cells, line)) {
      sectionTitles.push(line.trim());
      rows.push([line.trim()]);
      maxCols = Math.max(maxCols, 1);
    } else {
      rows.push(cells);
      maxCols = Math.max(maxCols, cells.length);
    }
  }

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    while (row.length < maxCols) row.push('');
  }

  return { rows, sectionTitles };
}

function headerKeywordsForFormat(format) {
  const base = ['date', 'description', 'debit', 'credit', 'balance', 'amount', 'transaction'];
  if (format === 'property_accounting') return [...base, 'property', 'unit', 'tenant', 'rent', 'lease'];
  if (format === 'project_accounting') return [...base, 'project', 'cost code', 'budget', 'variance', 'job'];
  return base;
}

function tryParseBankStatement(lines, tableLike, format = 'general') {
  const rows = [];
  const keywords = headerKeywordsForFormat(format);
  let headerIndex = -1;
  const normalized = lines.map((l) => l.toLowerCase());

  for (let i = 0; i < Math.min(normalized.length, 30); i++) {
    const line = normalized[i];
    const hasDate = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(line);
    const hasKeyword = keywords.some((kw) => line.includes(kw));
    if (hasDate && hasKeyword) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex >= 0 && tableLike[headerIndex]) {
    const headerRow = Array.isArray(tableLike[headerIndex]) ? tableLike[headerIndex].map((c) => String(c).trim()) : [String(tableLike[headerIndex])];
    rows.push(headerRow);
    const maxCols = headerRow.length;
    for (let j = headerIndex + 1; j < Math.min(tableLike.length, headerIndex + 500); j++) {
      const row = tableLike[j];
      if (!row) continue;
      const arr = Array.isArray(row) ? row.map((c) => String(c ?? '').trim()) : [String(row)];
      if (arr.some((c) => c.length > 0)) {
        while (arr.length < maxCols) arr.push('');
        rows.push(arr.slice(0, maxCols));
      }
    }
  } else {
    const withDates = tableLike.filter((row) => {
      const r = Array.isArray(row) ? row : [row];
      return r.some((c) => /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(String(c)));
    });
    if (withDates.length) {
      const maxCols = Math.max(...withDates.map((r) => (Array.isArray(r) ? r : [r]).length), 1);
      withDates.forEach((row) => {
        const arr = Array.isArray(row) ? [...row] : [row];
        while (arr.length < maxCols) arr.push('');
        rows.push(arr.slice(0, maxCols).map((c) => String(c ?? '')));
      });
    }
  }

  return rows.length ? { parsed: true, rows } : { parsed: false, message: 'No clear bank-style table found.' };
}
