CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  vendor_name TEXT NOT NULL,
  email TEXT NOT NULL,
  pic TEXT NOT NULL,
  jumlah_po INTEGER NOT NULL DEFAULT 0,
  jumlah_koli INTEGER NOT NULL DEFAULT 0,
  jumlah_item INTEGER NOT NULL DEFAULT 0,
  jumlah_quantity INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_date_time ON tickets(date, time);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
