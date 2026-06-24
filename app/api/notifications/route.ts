import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { mapTicketRow } from "@/lib/mappers"

export async function GET(request: Request) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const since = searchParams.get("since")

    if (!since) {
      return NextResponse.json({ error: "since parameter required" }, { status: 400 })
    }

    const [newRows, rescheduledRows, cancelledRows] = await Promise.all([
      sql`
        SELECT * FROM tickets
        WHERE created_at > ${since}::timestamptz AND status = 'active'
        ORDER BY created_at DESC
      `,
      sql`
        SELECT * FROM tickets
        WHERE updated_at > ${since}::timestamptz
          AND created_at <= ${since}::timestamptz
          AND status = 'active'
        ORDER BY updated_at DESC
      `,
      sql`
        SELECT * FROM tickets
        WHERE updated_at > ${since}::timestamptz AND status = 'cancelled'
        ORDER BY updated_at DESC
      `,
    ])

    return NextResponse.json({
      newTickets: newRows.map(mapTicketRow),
      rescheduledTickets: rescheduledRows.map(mapTicketRow),
      cancelledTickets: cancelledRows.map(mapTicketRow),
    })
  } catch (error) {
    console.error("GET /api/notifications error:", error)
    return NextResponse.json({ error: "Gagal mengambil notifikasi" }, { status: 500 })
  }
}
