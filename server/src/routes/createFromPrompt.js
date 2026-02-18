import { Router } from 'express';
import { generateTableFromPrompt } from '../parsers/createFromPrompt.js';

const router = Router();

router.post('/', (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'prompt string required' });
    const { rows, sheetName } = generateTableFromPrompt(prompt.trim());
    res.json({ rows, sheetName });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Create failed' });
  }
});

export const createFromPromptRouter = router;
