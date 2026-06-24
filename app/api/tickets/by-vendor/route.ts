import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { mapTicketRow } from "@/lib/mappers"

export async function GET(request: Request) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const name = searchParams.get("name")

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "name parameter required" }, { status: 400 })
    }

    const searchTerm = `%${name.trim()}%`
    const rows = await sql`
      SELECT * FROM tickets
      WHERE LOWER(vendor_name) LIKE LOWER(${searchTerm})
      ORDER BY created_at DESC
    `

    return NextResponse.json(rows.map(mapTicketRow))
  } catch (error) {
    console.error("GET /api/tickets/by-vendor error:", error)
    return NextResponse.json({ error: "Gagal mencari tiket" }, { status: 500 })
  }
}
