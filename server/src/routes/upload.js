import { Router } from 'express';
import multer from 'multer';
import { parsePdf } from '../parsers/pdf.js';
import { parseExcel } from '../parsers/excel.js';
import { parseCsv } from '../parsers/csv.js';
import { describeTable } from '../parsers/describe.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

export const uploadRouter = Router();

uploadRouter.post('/pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const orientation = req.body?.orientation || 'portrait';
    const format = req.body?.format || 'general';
    const result = await parsePdf(req.file.buffer, { orientation, format });
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Failed to parse PDF' });
  }
});

uploadRouter.post('/excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const documentType = req.body?.documentType || 'general';
    const result = await parseExcel(req.file.buffer, { documentType });
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Failed to parse Excel' });
  }
});

uploadRouter.post('/csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const result = await parseCsv(req.file.buffer, req.body?.delimiter);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Failed to parse CSV' });
  }
});

uploadRouter.post('/describe', (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows)) return res.status(400).json({ error: 'rows array required' });
    const description = describeTable(rows);
    res.json({ description });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Failed to describe' });
  }
});
