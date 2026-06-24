import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const time = searchParams.get("time")

    if (!date || !time) {
      return NextResponse.json({ error: "date and time required" }, { status: 400 })
    }

    const [ticketRows, blockedRows] = await Promise.all([
      sql`SELECT slot FROM tickets WHERE date = ${date} AND time = ${time} AND status != 'cancelled'`,
      sql`SELECT slot FROM blocked_slots WHERE date = ${date} AND time = ${time}`,
    ])

    const bookedSlots = [
      ...ticketRows.map((r) => r.slot as string),
      ...blockedRows.map((r) => r.slot as string),
    ]
    return NextResponse.json(bookedSlots)
  } catch (error) {
    console.error("GET /api/slots error:", error)
    return NextResponse.json({ error: "Gagal mengambil slot" }, { status: 500 })
  }
}
