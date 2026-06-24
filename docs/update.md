# Iterasi 2 — Catatan Update

Tanggal: 2026-06-24

---

## Perubahan yang Diimplementasikan

### Database (Jalankan sebelum deploy)
- **`scripts/002-alter-tickets-add-fields.sql`** — Tambah kolom baru ke tabel `tickets`:
  - `nomor_po TEXT` — nomor PO spesifik per tiket (menggantikan `jumlah_po` integer)
  - `deskripsi_barang TEXT` — deskripsi material yang akan dibongkar (mandatory)
  - `butuh_forklift BOOLEAN` — flag forklift per PO
  - `notes TEXT` — catatan opsional per pengiriman
  - `cancelled_by TEXT` — siapa yang membatalkan: `'vendor'` atau `'admin'`
  - `updated_at TIMESTAMPTZ` — timestamp update terakhir
- **`scripts/003-create-blocked-slots.sql`** — Tabel baru `blocked_slots` untuk fitur force-block admin

### Backend
- **`lib/types.ts`** — Update interface `Ticket` (tambah 6 field baru), tambah `BlockedSlot`, `AdminNotification`, `POEntry`
- **`lib/mappers.ts`** — File baru: shared `mapTicketRow` dan `mapBlockedSlotRow` (konsolidasi dari duplikasi di kedua route)
- **`lib/storage.ts`** — Update `createTicket` (batch, return `Ticket[]`), tambah `fetchTicketsByVendor`, `fetchBlockedSlotsForDate`, `createBlockedSlot`, `deleteBlockedSlot`, `fetchNotifications`
- **`app/api/tickets/route.ts`** — POST sekarang batch: terima `poEntries[]` + `startingSlot`, generate N tiket dengan slot berurutan otomatis
- **`app/api/tickets/[id]/route.ts`** — PATCH update untuk field baru + `updated_at = NOW()` di setiap update
- **`app/api/slots/route.ts`** — GET sekarang gabungkan tiket terisi + blocked slots
- **`app/api/blocked-slots/route.ts`** — Baru: GET (by date) + POST (create block)
- **`app/api/blocked-slots/[id]/route.ts`** — Baru: DELETE (unblock)
- **`app/api/notifications/route.ts`** — Baru: GET notifikasi sejak timestamp tertentu
- **`app/api/tickets/by-vendor/route.ts`** — Baru: GET tiket by nama vendor (LIKE search)
- **`app/api/send-email/route.ts`** — Update template email: tampilkan semua PO dalam satu email

### Frontend
- **`components/booking-form.tsx`** — Redesign lengkap:
  - Section vendor info (email, nama, PIC, catatan opsional)
  - Multi-PO cards: tiap card punya Nomor PO, Deskripsi Barang, Jumlah Koli/Item/Qty, checkbox Butuh Forklift
  - Tombol "+ Tambah PO" (max 10)
  - Slot selector berubah menjadi "Slot Awal" — sistem auto-hitung slot berurutan
  - Preview "Slot yang akan dipesan: A01 → A02 → A03" secara real-time
  - Starting slots yang overflow atau ada konflik otomatis di-disable
  - Confirmation modal menampilkan semua detail PO beserta slot mapping
  - Success screen menampilkan semua tiket yang berhasil dibuat
- **`components/landing-page.tsx`** — Lacak Tiket:
  - Toggle "Cari by ID Tiket" vs "Cari by Nama Vendor"
  - Mode vendor: tampilkan list semua tiket dari vendor tersebut, expandable
  - Cancel oleh vendor menyimpan `cancelledBy: "vendor"` ke DB
- **`components/admin-notification-modal.tsx`** — File baru: pop-up notifikasi saat admin login pertama kali setelah ada aktivitas
- **`components/admin-dashboard.tsx`** — Update besar:
  - Toggle view "Tabel" / "Jadwal"
  - **Tabel**: filter diganti date range picker (Dari–Sampai), kolom PO berubah dari angka ke teks Nomor PO, tambah tombol "Batalkan" (admin) di samping Hapus
  - **Jadwal**: grid 4×10 (waktu × slot) untuk tanggal tertentu; slot terisi bisa diklik → ViewModal; slot kosong diklik → modal blokir; slot diblokir diklik → unblokir
  - Pie Chart Recharts: rasio pembatalan Vendor vs Admin (muncul jika ada data)
  - Notifikasi login: load aktivitas sejak `adminLastLogin` di localStorage, simpan timestamp baru saat modal ditutup
  - ViewModal: tampilkan `nomorPO`, `deskripsiBarang`, `butuhForklift`, `notes`, `cancelledBy`
  - EditModal: tambah field `nomorPO`, `deskripsiBarang`, `butuhForklift`

---

## Langkah Deploy

1. Jalankan migration SQL di Neon:
   ```
   scripts/002-alter-tickets-add-fields.sql
   scripts/003-create-blocked-slots.sql
   ```
2. Deploy ke Vercel (push ke branch, auto-deploy)
3. Verifikasi di browser:
   - Buat tiket dengan 2–3 PO → pastikan slot berurutan ter-generate
   - Admin login → cek notifikasi muncul
   - Admin → view Jadwal → coba blokir dan unblokir slot
   - Landing page → cari by nama vendor

---

## Catatan Teknis

- Kolom `jumlah_po` lama tidak dihapus (backward compat), tapi tidak lagi digunakan oleh aplikasi
- Tiket lama yang di-cancel sebelum iterasi ini akan memiliki `cancelled_by = NULL` dan tidak muncul di pie chart (atau muncul sebagai slice terpisah jika ditambahkan)
- `updated_at` di-set ke `created_at` untuk baris lama lewat script migration
