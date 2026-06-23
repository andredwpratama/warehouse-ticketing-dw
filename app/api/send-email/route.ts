import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, subject, ticketId, vendorName, pic, date, time, slot } = body

    if (!to || !subject) {
      return NextResponse.json({ error: "to and subject required" }, { status: 400 })
    }

    // If Resend is not configured, skip silently
    if (!process.env.RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured, skipping email for ticket:", ticketId)
      return NextResponse.json({ skipped: true, message: "Resend not configured" })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #e65100; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; letter-spacing: 3px;">TRIATRA</h1>
          <p style="color: #ffcc80; margin: 4px 0 0; font-size: 12px;">member of ASTRA</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff;">
          <h2 style="color: #111; margin-top: 0;">Tiket Pengiriman Berhasil Dibuat</h2>
          <p style="color: #555;">Berikut detail tiket pengiriman Anda:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr style="border-bottom: 1px solid #e8eaed;">
              <td style="padding: 10px 0; color: #555; width: 40%;">No. Tiket</td>
              <td style="padding: 10px 0; color: #e65100; font-weight: bold;">${ticketId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e8eaed;">
              <td style="padding: 10px 0; color: #555;">Vendor</td>
              <td style="padding: 10px 0; color: #111; font-weight: 600;">${vendorName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e8eaed;">
              <td style="padding: 10px 0; color: #555;">PIC</td>
              <td style="padding: 10px 0; color: #111;">${pic}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e8eaed;">
              <td style="padding: 10px 0; color: #555;">Tanggal</td>
              <td style="padding: 10px 0; color: #111;">${date}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e8eaed;">
              <td style="padding: 10px 0; color: #555;">Waktu</td>
              <td style="padding: 10px 0; color: #111;">${time}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #555;">Slot</td>
              <td style="padding: 10px 0; color: #111;">${slot}</td>
            </tr>
          </table>
          <p style="margin-top: 20px; color: #555; font-size: 13px;">
            Simpan nomor tiket ini untuk pelacakan. Anda dapat mengecek status tiket di website kami.
          </p>
        </div>
        <div style="background-color: #f4f6f9; padding: 16px; text-align: center; font-size: 12px; color: #555;">
          &copy; 2026 Triatra Depo Jakarta &mdash; Hak Cipta Dilindungi
        </div>
      </div>
    `

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || "onboarding@resend.dev",
      to,
      subject,
      html,
    })

    if (error) {
      console.error("Resend send error:", error)
      return NextResponse.json({ error: "Gagal mengirim email" }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (error) {
    console.error("POST /api/send-email error:", error)
    return NextResponse.json({ error: "Gagal mengirim email" }, { status: 500 })
  }
}
