/**
 * Run from client folder: node scripts/inspect-xlsx.js "path/to/file1.xlsx" "path/to/file2.xlsx"
 * Prints first 40 rows of each sheet so we can see structure for balance sheet / Yardi template.
 * Requires: npm install xlsx (already in client)
 */
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const files = process.argv.slice(2).filter(Boolean);
const maxRows = 40;

if (!files.length) {
  console.log('Usage: node scripts/inspect-xlsx.js "path/to/JE Upload.xlsx" "path/to/balance-sheet.xlsx"');
  process.exit(1);
}

for (const filePath of files) {
  console.log('\n' + '='.repeat(60));
  console.log('FILE:', filePath);
  console.log('='.repeat(60));
  try {
    const buf = readFileSync(filePath);
    const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      let rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      rows = rows.slice(0, maxRows);
      console.log('\n--- Sheet:', sheetName, '---');
      rows.forEach((row, i) => {
        const cells = Array.isArray(row) ? row : [row];
        console.log(i + ':', JSON.stringify(cells.map((c) => (c == null ? '' : String(c).slice(0, 80)))));
      });
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}
