import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sql = getDb()
    const decodedId = decodeURIComponent(id)
    const rows = await sql`SELECT * FROM tickets WHERE id = ${decodedId}`

    if (rows.length === 0) {
      return NextResponse.json({ error: "Tiket tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(mapRow(rows[0]))
  } catch (error) {
    console.error("GET /api/tickets/[id] error:", error)
    return NextResponse.json({ error: "Gagal mengambil tiket" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sql = getDb()
    const decodedId = decodeURIComponent(id)
    const body = await request.json()

    const rows = await sql`SELECT * FROM tickets WHERE id = ${decodedId}`
    if (rows.length === 0) {
      return NextResponse.json({ error: "Tiket tidak ditemukan" }, { status: 404 })
    }

    const current = rows[0]

    const vendorName = body.vendorName ?? current.vendor_name
    const email = body.email ?? current.email
    const pic = body.pic ?? current.pic
    const jumlahPO = body.jumlahPO ?? current.jumlah_po
    const jumlahKoli = body.jumlahKoli ?? current.jumlah_koli
    const jumlahItem = body.jumlahItem ?? current.jumlah_item
    const jumlahQuantity = body.jumlahQuantity ?? current.jumlah_quantity
    const date = body.date ?? current.date
    const time = body.time ?? current.time
    const slot = body.slot ?? current.slot
    const status = body.status ?? current.status

    // If date/time/slot changed, check availability
    if (date !== current.date || time !== current.time || slot !== current.slot) {
      const existing = await sql`
        SELECT id FROM tickets 
        WHERE date = ${date} AND time = ${time} AND slot = ${slot} AND status != 'cancelled' AND id != ${decodedId}
      `
      if (existing.length > 0) {
        return NextResponse.json({ error: "Slot sudah terisi" }, { status: 409 })
      }
    }

    await sql`
      UPDATE tickets SET
        vendor_name = ${vendorName},
        email = ${email},
        pic = ${pic},
        jumlah_po = ${jumlahPO},
        jumlah_koli = ${jumlahKoli},
        jumlah_item = ${jumlahItem},
        jumlah_quantity = ${jumlahQuantity},
        date = ${date},
        time = ${time},
        slot = ${slot},
        status = ${status}
      WHERE id = ${decodedId}
    `

    const updated = await sql`SELECT * FROM tickets WHERE id = ${decodedId}`
    return NextResponse.json(mapRow(updated[0]))
  } catch (error) {
    console.error("PATCH /api/tickets/[id] error:", error)
    return NextResponse.json({ error: "Gagal mengupdate tiket" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sql = getDb()
    const decodedId = decodeURIComponent(id)

    const rows = await sql`SELECT * FROM tickets WHERE id = ${decodedId}`
    if (rows.length === 0) {
      return NextResponse.json({ error: "Tiket tidak ditemukan" }, { status: 404 })
    }

    await sql`DELETE FROM tickets WHERE id = ${decodedId}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/tickets/[id] error:", error)
    return NextResponse.json({ error: "Gagal menghapus tiket" }, { status: 500 })
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
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  }
}
