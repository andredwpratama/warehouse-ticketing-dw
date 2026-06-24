import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import type { Ticket } from "@/lib/types"

const ADMIN_EMAIL = "andrepratamav15@gmail.com"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, subject, tickets, vendorName, pic, date, time } = body as {
      to: string
      subject: string
      tickets: Ticket[]
      vendorName: string
      pic: string
      date: string
      time: string
    }

    if (!to || !subject) {
      return NextResponse.json({ error: "to and subject required" }, { status: 400 })
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("SMTP not configured, skipping email for tickets:", tickets?.map((t) => t.id).join(", "))
      return NextResponse.json({ skipped: true, message: "SMTP not configured" })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const poRows = (tickets ?? []).map((t, i) => `
      <tr style="border-bottom: 1px solid #e8eaed; background-color: ${i % 2 === 0 ? "#ffffff" : "#f9fafb"};">
        <td style="padding: 10px 8px; color: #e65100; font-weight: bold;">PO ${i + 1} — ${t.slot}</td>
        <td style="padding: 10px 8px; color: #111;">${t.nomorPO || "-"}</td>
        <td style="padding: 10px 8px; color: #111;">${t.deskripsiBarang || "-"}</td>
        <td style="padding: 10px 8px; color: #111;">${t.jumlahKoli} koli / ${t.jumlahItem} item / ${t.jumlahQuantity} qty</td>
        <td style="padding: 10px 8px; color: #111;">${t.butuhForklift ? "✓ Ya" : "Tidak"}</td>
      </tr>
    `).join("")

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <div style="background-color: #e65100; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; letter-spacing: 3px;">TRIATRA</h1>
          <p style="color: #ffcc80; margin: 4px 0 0; font-size: 12px;">member of ASTRA</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff;">
          <h2 style="color: #111; margin-top: 0;">Tiket Pengiriman Berhasil Dibuat</h2>
          <p style="color: #555;">Berikut detail pengiriman Anda:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr style="border-bottom: 1px solid #e8eaed;">
              <td style="padding: 10px 0; color: #555; width: 40%;">Vendor</td>
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
            <tr>
              <td style="padding: 10px 0; color: #555;">Waktu</td>
              <td style="padding: 10px 0; color: #111;">${time}</td>
            </tr>
          </table>

          <h3 style="color: #111; margin-top: 24px; margin-bottom: 8px;">Detail PO (${tickets?.length ?? 0} PO)</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background-color: #f4f6f9;">
                <th style="padding: 8px; text-align: left; color: #333;">No. Tiket / Slot</th>
                <th style="padding: 8px; text-align: left; color: #333;">Nomor PO</th>
                <th style="padding: 8px; text-align: left; color: #333;">Deskripsi Barang</th>
                <th style="padding: 8px; text-align: left; color: #333;">Jumlah</th>
                <th style="padding: 8px; text-align: left; color: #333;">Forklift</th>
              </tr>
            </thead>
            <tbody>${poRows}</tbody>
          </table>

          <p style="margin-top: 20px; color: #555; font-size: 13px;">
            Simpan nomor tiket untuk pelacakan. Reschedule/pembatalan dapat dilakukan &gt; 48 jam sebelum jadwal.
          </p>
        </div>
        <div style="background-color: #f4f6f9; padding: 16px; text-align: center; font-size: 12px; color: #555;">
          &copy; 2026 Triatra Depo Jakarta &mdash; Hak Cipta Dilindungi
        </div>
      </div>
    `

    const from = process.env.SMTP_FROM || process.env.SMTP_USER
    const recipients = Array.from(new Set([to, ADMIN_EMAIL].filter(Boolean)))

    const info = await transporter.sendMail({ from, to: recipients, subject, html })
    return NextResponse.json({ success: true, id: info.messageId })
  } catch (error) {
    console.error("POST /api/send-email error:", error)
    return NextResponse.json({ error: "Gagal mengirim email" }, { status: 500 })
  }
}
