# Postgres schema (Railway migration)

When you connect `DATABASE_URL` and migrate from file storage, use these shapes. Column names use `snake_case` for SQL.

## feedback

Stored today in `data/feedback.json`. Postgres equivalent:

| Column       | Type         | Notes                    |
|-------------|--------------|--------------------------|
| id          | uuid PRIMARY KEY DEFAULT gen_random_uuid() | |
| score       | smallint     | 1–5                      |
| type        | text         | 'good' \| 'bad' \| 'neutral' |
| tags        | text[]       | optional labels           |
| message     | text         | optional, max 500         |
| context     | text         | optional, max 200         |
| created_at  | timestamptz  | DEFAULT now()            |

```sql
CREATE TABLE feedback (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  score      smallint NOT NULL,
  type       text NOT NULL,
  tags       text[] DEFAULT '{}',
  message    text,
  context    text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## documents (future)

When documents move from client localStorage to server/Postgres:

| Column        | Type         | Notes                    |
|---------------|--------------|--------------------------|
| id            | uuid PRIMARY KEY |                      |
| user_id       | uuid         | FK to auth.users (Supabase) or your users table |
| label         | text         |                          |
| type          | text         | 'yardi' \| 'parsed' \| 'both' |
| doc_type      | text         | 'auto' \| 'trial_balance' \| 'balance_sheet' |
| post_month    | text         | e.g. '01/2025'           |
| journal_date  | date         |                          |
| detected_type | text         | nullable                 |
| pinned        | boolean      | DEFAULT false            |
| parsed_rows   | jsonb        | 2D array of cell values   |
| created_at   | timestamptz  |                          |
| updated_at   | timestamptz  |                          |

Parsed data is already a 2D array; store as JSONB for Postgres. No schema change needed for the shape of `parsed_rows`.

## API endpoints (current)

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | 200 + `{ ok, service, timestamp }` |
| POST | /api/feedback | Body: `{ type, message?, context?, tags? }` → 201 `{ success: true }` |
| GET | /api/feedback/stats | → 200 `{ success: true, data: { total, good, bad, recent } }` |
| POST | /api/export/excel | Body: `{ rows, format?, ... }` → Excel file |
| POST | /api/export/csv | Body: `{ rows, delimiter? }` → CSV file |

Errors: `{ success: false, error: "message" }` with appropriate HTTP status.
