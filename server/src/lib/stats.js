import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATS_FILE = path.join(__dirname, '../../data/export-stats.json');
const MAX_RECENT = 50;

function read() {
  try {
    const raw = fs.readFileSync(STATS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { exportCount: 0, recent: [] };
  }
}

function write(data) {
  try {
    const dir = path.dirname(STATS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Could not write export stats', e);
  }
}

/** Call when a user successfully downloads an export (e.g. Yardi JE). */
export function recordExport() {
  const data = read();
  data.exportCount = (data.exportCount || 0) + 1;
  data.recent = data.recent || [];
  data.recent.unshift({ at: new Date().toISOString() });
  data.recent = data.recent.slice(0, MAX_RECENT);
  write(data);
}

export function getStats() {
  return read();
}
