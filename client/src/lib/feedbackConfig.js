/**
 * Feedback config: rating scale and categories so the model (or rule learner)
 * knows exactly what 1-5 means and what went wrong. Pick categories carefully.
 */

/** 1-5 scale with short, unambiguous labels for model training and display. */
export const RATING_SCALE = Object.freeze([
  { value: 1, label: 'Wrong / unusable', short: 'unusable' },
  { value: 2, label: 'Mostly wrong', short: 'mostly_wrong' },
  { value: 3, label: 'Okay but had issues', short: 'okay_issues' },
  { value: 4, label: 'Mostly right', short: 'mostly_right' },
  { value: 5, label: 'Perfect', short: 'perfect' },
]);

/** Categories: what went wrong (or right). Backend uses these to improve the right part of the model. */
export const FEEDBACK_CATEGORIES = Object.freeze({
  header_detection: {
    label: 'Wrong or missing header row',
    subcategories: {
      wrong_row: 'Header row detected in wrong row',
      missing: 'Headers not found',
      extra_rows: 'Extra rows above table',
    },
  },
  column_mapping: {
    label: 'Wrong columns (Account, Debit, Credit)',
    subcategories: {
      account: 'Account column (A, B, C...) wrong or missing',
      debit: 'Debit column wrong or missing',
      credit: 'Credit column wrong or missing',
    },
  },
  property_name: {
    label: 'Property name wrong or missing',
    subcategories: {},
  },
  dates: {
    label: 'Post month or journal date wrong',
    subcategories: {},
  },
  export_format: {
    label: 'Yardi export / Excel format',
    subcategories: {},
  },
  other: {
    label: 'Something else',
    subcategories: {},
  },
});

/** Score thresholds: low = we should learn from this feedback. */
export const LOW_SCORE_MAX = 2;
export const HIGH_SCORE_MIN = 4;

export function getCategoryOptions() {
  return Object.entries(FEEDBACK_CATEGORIES).map(([id, c]) => ({
    value: id,
    label: c.label,
    subcategories: c.subcategories,
  }));
}

export function getScoreLabel(score) {
  const s = Number(score);
  const item = RATING_SCALE.find((r) => r.value === s);
  return item ? item.short : s <= 2 ? 'low' : s >= 4 ? 'high' : 'mid';
}
