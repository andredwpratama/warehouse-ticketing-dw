-- Iterasi 2: Create blocked_slots table for admin force-block feature
CREATE TABLE IF NOT EXISTS blocked_slots (
  id         TEXT PRIMARY KEY,
  date       TEXT NOT NULL,
  time       TEXT NOT NULL,
  slot       TEXT NOT NULL,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocked_slots_date_time ON blocked_slots(date, time);
