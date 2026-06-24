import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sql = getDb()
    const decodedId = decodeURIComponent(id)

    const rows = await sql`SELECT id FROM blocked_slots WHERE id = ${decodedId}`
    if (rows.length === 0) {
      return NextResponse.json({ error: "Blocked slot tidak ditemukan" }, { status: 404 })
    }

    await sql`DELETE FROM blocked_slots WHERE id = ${decodedId}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/blocked-slots/[id] error:", error)
    return NextResponse.json({ error: "Gagal menghapus blocked slot" }, { status: 500 })
  }
}
