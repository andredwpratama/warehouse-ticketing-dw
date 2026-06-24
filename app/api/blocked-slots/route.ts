import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { mapBlockedSlotRow } from "@/lib/mappers"

export async function GET(request: Request) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json({ error: "date required" }, { status: 400 })
    }

    const rows = await sql`SELECT * FROM blocked_slots WHERE date = ${date} ORDER BY time, slot`
    return NextResponse.json(rows.map(mapBlockedSlotRow))
  } catch (error) {
    console.error("GET /api/blocked-slots error:", error)
    return NextResponse.json({ error: "Gagal mengambil blocked slots" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const sql = getDb()
    const body = await request.json()
    const { date, time, slot, reason } = body

    if (!date || !time || !slot) {
      return NextResponse.json({ error: "date, time, dan slot wajib diisi" }, { status: 400 })
    }

    // Check for duplicate
    const existing = await sql`
      SELECT id FROM blocked_slots WHERE date = ${date} AND time = ${time} AND slot = ${slot}
    `
    if (existing.length > 0) {
      return NextResponse.json({ error: "Slot ini sudah diblokir" }, { status: 409 })
    }

    const id = `BLOCKED-${date}-${time.replace(/[^0-9]/g, "")}-${slot}`
    await sql`
      INSERT INTO blocked_slots (id, date, time, slot, reason)
      VALUES (${id}, ${date}, ${time}, ${slot}, ${reason ?? null})
    `

    const rows = await sql`SELECT * FROM blocked_slots WHERE id = ${id}`
    return NextResponse.json(mapBlockedSlotRow(rows[0]), { status: 201 })
  } catch (error) {
    console.error("POST /api/blocked-slots error:", error)
    return NextResponse.json({ error: "Gagal memblokir slot" }, { status: 500 })
  }
}
