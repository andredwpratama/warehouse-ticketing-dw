-- Iterasi 2: Add new columns to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS nomor_po TEXT NOT NULL DEFAULT '';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS deskripsi_barang TEXT NOT NULL DEFAULT '';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS catatan_khusus TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS cancelled_by TEXT; -- 'vendor' | 'admin'
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE tickets SET updated_at = created_at WHERE updated_at IS NULL;
