"use client"

import { useState } from "react"
import {
  Search,
  Ticket,
  CalendarDays,
  Clock,
  MapPin,
  User,
  Mail,
  Package,
  X,
  CalendarClock,
  Loader2,
} from "lucide-react"
import { TriatraLogo } from "./triatra-logo"
import { fetchTicketById, canReschedule, deleteTicketApi, updateTicketApi } from "@/lib/storage"
import type { Ticket as TicketType, AppView } from "@/lib/types"
import { RescheduleModal } from "./reschedule-modal"

interface LandingPageProps {
  onNavigate: (view: AppView) => void
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const [trackId, setTrackId] = useState("")
  const [trackedTicket, setTrackedTicket] = useState<TicketType | null>(null)
  const [trackError, setTrackError] = useState("")
  const [showReschedule, setShowReschedule] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleTrack() {
    setTrackError("")
    setTrackedTicket(null)
    if (!trackId.trim()) {
      setTrackError("Masukkan Ticket ID terlebih dahulu.")
      return
    }
    setLoading(true)
    try {
      const ticket = await fetchTicketById(trackId.trim())
      if (ticket) {
        setTrackedTicket(ticket)
      } else {
        setTrackError("Tiket tidak ditemukan. Pastikan ID tiket benar.")
      }
    } catch {
      setTrackError("Terjadi kesalahan. Coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (!trackedTicket) return
    setLoading(true)
    try {
      await updateTicketApi(trackedTicket.id, { status: "cancelled" } as Partial<TicketType>)
      setTrackedTicket(null)
      setTrackId("")
    } catch {
      setTrackError("Gagal membatalkan tiket.")
    } finally {
      setLoading(false)
    }
  }

  async function handleRescheduleDone() {
    setShowReschedule(false)
    if (trackedTicket) {
      const updated = await fetchTicketById(trackedTicket.id)
      if (updated) setTrackedTicket(updated)
    }
  }

  const rescheduleAllowed = trackedTicket ? canReschedule(trackedTicket) : false

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between border-b px-4 py-2 shadow-sm md:px-8"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <TriatraLogo />
        <nav className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("booking")}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
            style={{ backgroundColor: "#e65100", color: "#ffffff" }}
          >
            Buat Tiket
          </button>
          <button
            onClick={() => onNavigate("admin-login")}
            className="rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
            style={{ borderColor: "#e65100", color: "#e65100", backgroundColor: "#ffffff" }}
          >
            Admin
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center px-4 pt-10 pb-10 md:pt-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "#fff3e0" }}
          >
            <Ticket className="h-7 w-7" style={{ color: "#e65100" }} />
          </div>
          <h1
            className="text-2xl font-bold tracking-tight text-balance md:text-4xl"
            style={{ color: "#111111" }}
          >
            Ticket Pengiriman
          </h1>
          <p
            className="max-w-lg text-sm leading-relaxed md:text-base"
            style={{ color: "#555555" }}
          >
            Jadwalkan pengiriman Anda dengan mudah menggunakan sistem pemesanan kami.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
          <button
            onClick={() => onNavigate("booking")}
            className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold shadow-md transition-all hover:shadow-lg"
            style={{ backgroundColor: "#e65100", color: "#ffffff" }}
          >
            <CalendarDays className="h-4 w-4" />
            Buat Tiket Pengiriman
          </button>
        </div>

        {/* Track Ticket */}
        <div
          className="mt-8 w-full max-w-xl rounded-xl border p-5 shadow-sm"
          style={{ backgroundColor: "#ffffff", borderColor: "#d1d5db" }}
        >
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold" style={{ color: "#111111" }}>
            <Search className="h-5 w-5" style={{ color: "#e65100" }} />
            Lacak Tiket
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Masukkan Ticket ID (contoh: WHS-JKT/0001/IV/2026)"
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              className="flex-1 rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
              style={{ borderColor: "#d1d5db", color: "#111111" }}
            />
            <button
              onClick={handleTrack}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
              style={{ backgroundColor: "#e65100", color: "#ffffff" }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Cari
            </button>
          </div>
          {trackError && (
            <p className="mt-3 text-sm font-medium" style={{ color: "#dc2626" }}>
              {trackError}
            </p>
          )}

          {/* Ticket Details */}
          {trackedTicket && (
            <div
              className="mt-4 rounded-lg border p-4"
              style={{ borderColor: "#d1d5db", backgroundColor: "#f4f6f9" }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold" style={{ color: "#111111" }}>
                  {trackedTicket.id}
                </h3>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={
                    trackedTicket.status === "active"
                      ? { backgroundColor: "#dcfce7", color: "#166534" }
                      : { backgroundColor: "#fee2e2", color: "#991b1b" }
                  }
                >
                  {trackedTicket.status === "active" ? "Aktif" : "Dibatalkan"}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
                  <span style={{ color: "#555555" }}>Vendor:</span>
                  <span className="font-medium" style={{ color: "#111111" }}>
                    {trackedTicket.vendorName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
                  <span style={{ color: "#555555" }}>Email:</span>
                  <span className="font-medium" style={{ color: "#111111" }}>
                    {trackedTicket.email}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
                  <span style={{ color: "#555555" }}>PIC:</span>
                  <span className="font-medium" style={{ color: "#111111" }}>
                    {trackedTicket.pic}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
                  <span style={{ color: "#555555" }}>Tanggal:</span>
                  <span className="font-medium" style={{ color: "#111111" }}>
                    {trackedTicket.date}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
                  <span style={{ color: "#555555" }}>Waktu:</span>
                  <span className="font-medium" style={{ color: "#111111" }}>
                    {trackedTicket.time}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
                  <span style={{ color: "#555555" }}>Slot:</span>
                  <span className="font-medium" style={{ color: "#111111" }}>
                    {trackedTicket.slot}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Package className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
                  <span style={{ color: "#555555" }}>PO/Koli/Item/Qty:</span>
                  <span className="font-medium" style={{ color: "#111111" }}>
                    {trackedTicket.jumlahPO}/{trackedTicket.jumlahKoli}/{trackedTicket.jumlahItem}/{trackedTicket.jumlahQuantity}
                  </span>
                </div>
              </div>

              {trackedTicket.status === "active" && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
                    style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
                  >
                    <X className="h-4 w-4" />
                    Batalkan
                  </button>
                  <button
                    onClick={() => setShowReschedule(true)}
                    disabled={!rescheduleAllowed}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ backgroundColor: "#0056b3", color: "#ffffff" }}
                  >
                    <CalendarClock className="h-4 w-4" />
                    Reschedule
                  </button>
                  {!rescheduleAllowed && (
                    <span className="text-xs" style={{ color: "#555555" }}>
                      Reschedule hanya bisa dilakukan {'>'} 48 jam sebelum jadwal.
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t px-4 py-3 text-center text-xs"
        style={{ borderColor: "#d1d5db", color: "#555555", backgroundColor: "#ffffff" }}
      >
        &copy; 2026 Triatra Depo Jakarta. Hak Cipta Dilindungi. andre &amp; diva
      </footer>

      {/* Reschedule Modal */}
      {showReschedule && trackedTicket && (
        <RescheduleModal
          ticket={trackedTicket}
          onClose={() => setShowReschedule(false)}
          onDone={handleRescheduleDone}
        />
      )}
    </div>
  )
}
