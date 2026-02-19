/**
 * Test that feedback learning works: applyFeedback updates learned_rules.json.
 * Run from server: node scripts/test-feedback-learning.js
 */
import { applyFeedback, getLearnedRules } from '../src/lib/feedbackModel.js';

console.log('1. Initial learned rules:', JSON.stringify(getLearnedRules(), null, 2));

// Simulate user giving low score (2) with category column_mapping and a message + header row
applyFeedback({
  score: 2,
  scoreLabel: 'mostly_wrong',
  category: 'column_mapping',
  subcategory: 'account',
  message: 'Account column was labeled "Account Code" and debit was "Debits"',
  context: 'parse_preview',
  headerRow: ['Account Code', 'Description', 'Sub', 'Debits', 'Credits'],
});

console.log('2. After applyFeedback (message + headerRow):', JSON.stringify(getLearnedRules(), null, 2));

// Second feedback: header only
applyFeedback({
  score: 1,
  category: 'header_detection',
  message: undefined,
  headerRow: ['GL Number', 'Name', 'Debit', 'Credit'],
});

console.log('3. After second applyFeedback (header row):', JSON.stringify(getLearnedRules(), null, 2));

console.log('Done. Learned rules file should now include ACCOUNTCODE, DEBITS, CREDITS, GLNUMBER, etc.');
