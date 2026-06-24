import type { Ticket, BlockedSlot } from "./types"

export function mapTicketRow(row: Record<string, unknown>): Ticket {
  return {
    id: row.id as string,
    vendorName: row.vendor_name as string,
    email: row.email as string,
    pic: row.pic as string,
    nomorPO: (row.nomor_po as string) ?? "",
    jumlahKoli: Number(row.jumlah_koli),
    jumlahItem: Number(row.jumlah_item),
    jumlahQuantity: Number(row.jumlah_quantity),
    deskripsiBarang: (row.deskripsi_barang as string) ?? "",
    catatanKhusus: (row.catatan_khusus as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    cancelledBy: (row.cancelled_by as "vendor" | "admin" | null) ?? null,
    date: row.date as string,
    time: row.time as string,
    slot: row.slot as string,
    status: row.status as "active" | "cancelled" | "completed",
    createdAt: new Date(row.created_at as string | Date).toISOString(),
    updatedAt: row.updated_at
      ? new Date(row.updated_at as string | Date).toISOString()
      : undefined,
  }
}

export function mapBlockedSlotRow(row: Record<string, unknown>): BlockedSlot {
  return {
    id: row.id as string,
    date: row.date as string,
    time: row.time as string,
    slot: row.slot as string,
    reason: (row.reason as string) ?? undefined,
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  }
}
