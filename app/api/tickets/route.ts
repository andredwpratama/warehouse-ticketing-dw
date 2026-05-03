import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { ROMAN_MONTHS } from "@/lib/types"

export async function GET() {
  try {
    const sql = getDb()
    const rows = await sql`SELECT * FROM tickets ORDER BY created_at DESC`
    const tickets = rows.map(mapRow)
    return NextResponse.json(tickets)
  } catch (error) {
    console.error("GET /api/tickets error:", error)
    return NextResponse.json({ error: "Gagal mengambil data tiket" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const sql = getDb()
    const body = await request.json()

    const { vendorName, email, pic, jumlahPO, jumlahKoli, jumlahItem, jumlahQuantity, date, time, slot } = body

    if (!vendorName || !email || !pic || !date || !time || !slot) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 })
    }

    // Generate ticket ID
    const countResult = await sql`SELECT COUNT(*) as count FROM tickets`
    const count = Number(countResult[0].count) + 1
    const now = new Date()
    const month = ROMAN_MONTHS[now.getMonth()]
    const year = now.getFullYear()
    const ticketId = `WHS-JKT/${String(count).padStart(4, "0")}/${month}/${year}`

    // Check slot availability
    const existing = await sql`
      SELECT id FROM tickets 
      WHERE date = ${date} AND time = ${time} AND slot = ${slot} AND status != 'cancelled'
    `
    if (existing.length > 0) {
      return NextResponse.json({ error: "Slot sudah terisi" }, { status: 409 })
    }

    await sql`
      INSERT INTO tickets (id, vendor_name, email, pic, jumlah_po, jumlah_koli, jumlah_item, jumlah_quantity, date, time, slot, status)
      VALUES (${ticketId}, ${vendorName}, ${email}, ${pic}, ${jumlahPO || 0}, ${jumlahKoli || 0}, ${jumlahItem || 0}, ${jumlahQuantity || 0}, ${date}, ${time}, ${slot}, 'active')
    `

    const newRow = await sql`SELECT * FROM tickets WHERE id = ${ticketId}`
    const ticket = mapRow(newRow[0])

    // Send email notification (fire-and-forget)
    try {
      await fetch(new URL("/api/send-email", request.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: `Tiket Pengiriman ${ticketId} - Berhasil Dibuat`,
          ticketId,
          vendorName,
          pic,
          date,
          time,
          slot,
        }),
      })
    } catch {
      // email failure should not block ticket creation
    }

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error("POST /api/tickets error:", error)
    return NextResponse.json({ error: "Gagal membuat tiket" }, { status: 500 })
  }
}

function mapRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    vendorName: row.vendor_name as string,
    email: row.email as string,
    pic: row.pic as string,
    jumlahPO: Number(row.jumlah_po),
    jumlahKoli: Number(row.jumlah_koli),
    jumlahItem: Number(row.jumlah_item),
    jumlahQuantity: Number(row.jumlah_quantity),
    date: row.date as string,
    time: row.time as string,
    slot: row.slot as string,
    status: row.status as string,
    createdAt: (row.created_at as Date).toISOString(),
  }
}
