import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readFeedback() {
  ensureDataDir();
  if (!fs.existsSync(FEEDBACK_FILE)) return [];
  try {
    const raw = fs.readFileSync(FEEDBACK_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function appendFeedback(entry) {
  const list = readFeedback();
  list.push({
    ...entry,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
  });
  ensureDataDir();
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(list, null, 0));
}

export const feedbackRouter = Router();

feedbackRouter.post('/', (req, res) => {
  try {
    const { score, type, tags, message, context } = req.body;
    const s = score == null ? (type === 'good' ? 5 : type === 'bad' ? 1 : 3) : Math.min(5, Math.max(1, Number(score)));
    appendFeedback({
      score: s,
      type: type === 'good' ? 'good' : type === 'bad' ? 'bad' : s >= 4 ? 'good' : s <= 2 ? 'bad' : 'neutral',
      tags: Array.isArray(tags) ? tags : [],
      message: typeof message === 'string' ? message.slice(0, 500) : undefined,
      context: typeof context === 'string' ? context.slice(0, 200) : undefined,
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Failed to save feedback' });
  }
});

feedbackRouter.get('/stats', (req, res) => {
  try {
    const list = readFeedback();
    const good = list.filter((e) => e.score >= 4 || e.type === 'good').length;
    const bad = list.filter((e) => e.score <= 2 || e.type === 'bad').length;
    res.json({ total: list.length, good, bad, recent: list.slice(-20) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Failed to read feedback' });
  }
});
