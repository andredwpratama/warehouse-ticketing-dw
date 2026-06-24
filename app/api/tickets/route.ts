import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { ROMAN_MONTHS, SLOT_LIST } from "@/lib/types"
import type { POEntry } from "@/lib/types"
import { mapTicketRow } from "@/lib/mappers"

export async function GET() {
  try {
    const sql = getDb()
    const rows = await sql`SELECT * FROM tickets ORDER BY created_at DESC`
    return NextResponse.json(rows.map(mapTicketRow))
  } catch (error) {
    console.error("GET /api/tickets error:", error)
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: "Gagal mengambil data tiket", detail },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const sql = getDb()
    const body = await request.json()

    const { vendorName, email, pic, poEntries, notes, date, time, startingSlot } = body as {
      vendorName: string
      email: string
      pic: string
      poEntries: POEntry[]
      notes?: string
      date: string
      time: string
      startingSlot: string
    }

    if (!vendorName || !email || !pic || !date || !time || !startingSlot) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 })
    }
    if (!Array.isArray(poEntries) || poEntries.length === 0) {
      return NextResponse.json({ error: "Minimal satu PO harus diisi" }, { status: 400 })
    }
    for (const entry of poEntries) {
      if (!entry.nomorPO?.trim() || !entry.deskripsiBarang?.trim()) {
        return NextResponse.json({ error: "Nomor PO dan Deskripsi Barang wajib diisi untuk setiap PO" }, { status: 400 })
      }
    }

    // Compute consecutive slots from starting slot
    const startingIndex = SLOT_LIST.indexOf(startingSlot as typeof SLOT_LIST[number])
    if (startingIndex === -1) {
      return NextResponse.json({ error: "Slot awal tidak valid" }, { status: 400 })
    }
    const requiredSlots = SLOT_LIST.slice(startingIndex, startingIndex + poEntries.length)
    if (requiredSlots.length < poEntries.length) {
      return NextResponse.json(
        { error: `Slot tidak cukup dari posisi ${startingSlot}. Butuh ${poEntries.length} slot berurutan.` },
        { status: 400 }
      )
    }

    // Check all required slots for conflicts (booked tickets + blocked slots)
    for (const slot of requiredSlots) {
      const existing = await sql`
        SELECT id FROM tickets
        WHERE date = ${date} AND time = ${time} AND slot = ${slot} AND status != 'cancelled'
      `
      if (existing.length > 0) {
        return NextResponse.json({ error: `Slot ${slot} sudah terisi` }, { status: 409 })
      }
      const blocked = await sql`
        SELECT id FROM blocked_slots WHERE date = ${date} AND time = ${time} AND slot = ${slot}
      `
      if (blocked.length > 0) {
        return NextResponse.json({ error: `Slot ${slot} diblokir oleh admin` }, { status: 409 })
      }
    }

    // Generate ticket IDs and insert all tickets
    const countResult = await sql`SELECT COUNT(*) as count FROM tickets`
    let baseCount = Number(countResult[0].count)

    const now = new Date()
    const month = ROMAN_MONTHS[now.getMonth()]
    const year = now.getFullYear()

    const createdTickets = []
    for (let i = 0; i < poEntries.length; i++) {
      baseCount++
      const ticketId = `WHS-JKT/${String(baseCount).padStart(4, "0")}/${month}/${year}`
      const entry = poEntries[i]
      const slot = requiredSlots[i]

      await sql`
        INSERT INTO tickets (
          id, vendor_name, email, pic,
          nomor_po, jumlah_koli, jumlah_item, jumlah_quantity,
          deskripsi_barang, catatan_khusus, notes,
          date, time, slot, status
        ) VALUES (
          ${ticketId}, ${vendorName}, ${email}, ${pic},
          ${entry.nomorPO.trim()}, ${entry.jumlahKoli || 0}, ${entry.jumlahItem || 0}, ${entry.jumlahQuantity || 0},
          ${entry.deskripsiBarang.trim()}, ${entry.catatanKhusus?.trim() ?? null}, ${notes ?? null},
          ${date}, ${time}, ${slot}, 'active'
        )
      `

      const newRow = await sql`SELECT * FROM tickets WHERE id = ${ticketId}`
      createdTickets.push(mapTicketRow(newRow[0]))
    }

    // Send email notification (fire-and-forget)
    try {
      await fetch(new URL("/api/send-email", request.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: `Tiket Pengiriman ${createdTickets.map(t => t.id).join(", ")} - Berhasil Dibuat`,
          tickets: createdTickets,
          vendorName,
          pic,
          date,
          time,
        }),
      })
    } catch {
      // email failure should not block ticket creation
    }

    return NextResponse.json(createdTickets, { status: 201 })
  } catch (error) {
    console.error("POST /api/tickets error:", error)
    return NextResponse.json({ error: "Gagal membuat tiket" }, { status: 500 })
  }
}
