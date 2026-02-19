import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { applyFeedback, getLearnedRules } from '../lib/feedbackModel.js';

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
  const full = {
    ...entry,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
  };
  list.push(full);
  ensureDataDir();
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(list, null, 0));
  return full;
}

export const feedbackRouter = Router();

/** POST /api/feedback – body: { score (1–5), scoreLabel?, category?, subcategory?, message?, context?, headerRow?, tags? } */
feedbackRouter.post('/', (req, res) => {
  try {
    const { score, scoreLabel, type, category, subcategory, tags, message, context, headerRow } = req.body;
    const s = score == null ? (type === 'good' ? 5 : type === 'bad' ? 1 : 3) : Math.min(5, Math.max(1, Number(score)));
    const entry = {
      score: s,
      scoreLabel: typeof scoreLabel === 'string' ? scoreLabel.slice(0, 32) : (s <= 2 ? 'low' : s >= 4 ? 'high' : 'mid'),
      type: type === 'good' ? 'good' : type === 'bad' ? 'bad' : s >= 4 ? 'good' : s <= 2 ? 'bad' : 'neutral',
      category: typeof category === 'string' ? category.slice(0, 64) : undefined,
      subcategory: typeof subcategory === 'string' ? subcategory.slice(0, 64) : undefined,
      tags: Array.isArray(tags) ? tags : [],
      message: typeof message === 'string' ? message.slice(0, 500) : undefined,
      context: typeof context === 'string' ? context.slice(0, 200) : undefined,
      headerRow: Array.isArray(headerRow) ? headerRow.slice(0, 20).map((c) => String(c).slice(0, 80)) : undefined,
    };
    const saved = appendFeedback(entry);
    applyFeedback(saved);
    res.status(201).json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message || 'Failed to save feedback' });
  }
});

/** GET /api/learned-rules – returns server-learned headers so client can merge and parser improves globally */
feedbackRouter.get('/learned-rules', (req, res) => {
  try {
    const rules = getLearnedRules();
    res.json({ success: true, data: rules });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message || 'Failed to read learned rules' });
  }
});

/** GET /api/feedback/stats – aggregate counts */
feedbackRouter.get('/stats', (req, res) => {
  try {
    const list = readFeedback();
    const good = list.filter((e) => e.score >= 4 || e.type === 'good').length;
    const bad = list.filter((e) => e.score <= 2 || e.type === 'bad').length;
    res.json({ success: true, data: { total: list.length, good, bad, recent: list.slice(-20) } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message || 'Failed to read feedback' });
  }
});
