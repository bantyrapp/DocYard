/**
 * Creates a minimal trial balance Excel for testing. Run from server: node scripts/create-test-tb.js
 * Output: server/data/test-trial-balance.xlsx
 */
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../data/test-trial-balance.xlsx');

const rows = [
  ['Properties: Fitz - Test Property'],
  ['Exported On: ' + new Date().toISOString().slice(0, 10)],
  ['Period: 01/2025'],
  [],
  ['ACCOUNT', 'Description', '', 'DEBIT', 'CREDIT'],
  ['1150', 'Cash – Operating', '', 1000, 0],
  ['1200', 'Accounts Receivable', '', 500, 0],
  ['2100', 'Accounts Payable', '', 0, 300],
  ['3100', 'Equity', '', 0, 1200],
];

const ws = XLSX.utils.aoa_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Trial Balance');

const dir = path.dirname(outPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
XLSX.writeFile(wb, outPath);
console.log('Created:', outPath);
