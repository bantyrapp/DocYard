import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadRouter } from './routes/upload.js';
import { exportRouter } from './routes/export.js';
import { createFromPromptRouter } from './routes/createFromPrompt.js';
import { feedbackRouter } from './routes/feedback.js';
import { healthRouter } from './routes/health.js';
import { stripeRouter } from './routes/stripe.js';
import { adminRouter } from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/upload', uploadRouter);
app.use('/api/export', exportRouter);
app.use('/api/create', createFromPromptRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/health', healthRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/admin', adminRouter);

if (process.env.NODE_ENV !== 'development') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
