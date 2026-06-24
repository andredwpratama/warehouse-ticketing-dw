import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { mapTicketRow } from "@/lib/mappers"

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

    return NextResponse.json(mapTicketRow(rows[0]))
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
    const nomorPO = body.nomorPO ?? current.nomor_po
    const jumlahKoli = body.jumlahKoli ?? current.jumlah_koli
    const jumlahItem = body.jumlahItem ?? current.jumlah_item
    const jumlahQuantity = body.jumlahQuantity ?? current.jumlah_quantity
    const deskripsiBarang = body.deskripsiBarang ?? current.deskripsi_barang
    const catatanKhusus = body.catatanKhusus !== undefined ? body.catatanKhusus : current.catatan_khusus
    const notes = body.notes !== undefined ? body.notes : current.notes
    const cancelledBy = body.cancelledBy !== undefined ? body.cancelledBy : current.cancelled_by
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
        nomor_po = ${nomorPO},
        jumlah_koli = ${jumlahKoli},
        jumlah_item = ${jumlahItem},
        jumlah_quantity = ${jumlahQuantity},
        deskripsi_barang = ${deskripsiBarang},
        catatan_khusus = ${catatanKhusus},
        notes = ${notes},
        cancelled_by = ${cancelledBy},
        date = ${date},
        time = ${time},
        slot = ${slot},
        status = ${status},
        updated_at = NOW()
      WHERE id = ${decodedId}
    `

    const updated = await sql`SELECT * FROM tickets WHERE id = ${decodedId}`
    return NextResponse.json(mapTicketRow(updated[0]))
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
