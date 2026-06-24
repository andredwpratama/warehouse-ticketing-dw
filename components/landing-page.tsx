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
  Building2,
  ChevronDown,
  ChevronUp,
  StickyNote,
} from "lucide-react"
import { TriatraLogo } from "./triatra-logo"
import { fetchTicketById, fetchTicketsByVendor, canReschedule, updateTicketApi } from "@/lib/storage"
import type { Ticket as TicketType, AppView } from "@/lib/types"
import { RescheduleModal } from "./reschedule-modal"

interface LandingPageProps {
  onNavigate: (view: AppView) => void
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const [searchMode, setSearchMode] = useState<"id" | "vendor">("id")
  const [trackId, setTrackId] = useState("")
  const [trackedTicket, setTrackedTicket] = useState<TicketType | null>(null)
  const [vendorTickets, setVendorTickets] = useState<TicketType[]>([])
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null)
  const [trackError, setTrackError] = useState("")
  const [showReschedule, setShowReschedule] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleTrack() {
    setTrackError("")
    setTrackedTicket(null)
    setVendorTickets([])
    setExpandedTicketId(null)
    if (!trackId.trim()) {
      setTrackError(searchMode === "id" ? "Masukkan Ticket ID terlebih dahulu." : "Masukkan nama vendor terlebih dahulu.")
      return
    }
    setLoading(true)
    try {
      if (searchMode === "id") {
        const ticket = await fetchTicketById(trackId.trim())
        if (ticket) {
          setTrackedTicket(ticket)
        } else {
          setTrackError("Tiket tidak ditemukan. Pastikan ID tiket benar.")
        }
      } else {
        const tickets = await fetchTicketsByVendor(trackId.trim())
        if (tickets.length > 0) {
          setVendorTickets(tickets)
        } else {
          setTrackError("Tidak ada tiket ditemukan untuk vendor tersebut.")
        }
      }
    } catch {
      setTrackError("Terjadi kesalahan. Coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(ticket: TicketType) {
    setLoading(true)
    try {
      await updateTicketApi(ticket.id, { status: "cancelled", cancelledBy: "vendor" })
      if (searchMode === "id") {
        setTrackedTicket(null)
        setTrackId("")
      } else {
        // Refresh vendor tickets list
        const updated = await fetchTicketsByVendor(trackId.trim())
        setVendorTickets(updated)
      }
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

  const placeholder = searchMode === "id"
    ? "Masukkan Ticket ID (contoh: WHS-JKT/0001/IV/2026)"
    : "Masukkan nama vendor (contoh: PT Maju Jaya)"

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

          {/* Search mode toggle */}
          <div className="mb-3 flex rounded-lg border overflow-hidden" style={{ borderColor: "#d1d5db" }}>
            <button
              onClick={() => { setSearchMode("id"); setTrackId(""); setTrackedTicket(null); setVendorTickets([]); setTrackError("") }}
              className="flex-1 py-2 text-sm font-medium transition-colors"
              style={searchMode === "id"
                ? { backgroundColor: "#e65100", color: "#ffffff" }
                : { backgroundColor: "#ffffff", color: "#555555" }
              }
            >
              <Ticket className="h-3.5 w-3.5 inline mr-1.5" />
              Cari by ID Tiket
            </button>
            <button
              onClick={() => { setSearchMode("vendor"); setTrackId(""); setTrackedTicket(null); setVendorTickets([]); setTrackError("") }}
              className="flex-1 py-2 text-sm font-medium transition-colors"
              style={searchMode === "vendor"
                ? { backgroundColor: "#e65100", color: "#ffffff" }
                : { backgroundColor: "#ffffff", color: "#555555" }
              }
            >
              <Building2 className="h-3.5 w-3.5 inline mr-1.5" />
              Cari by Nama Vendor
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder={placeholder}
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

          {/* Single ticket result (ID search) */}
          {trackedTicket && searchMode === "id" && (
            <TicketDetail
              ticket={trackedTicket}
              onCancel={() => handleCancel(trackedTicket)}
              onReschedule={() => setShowReschedule(true)}
              loading={loading}
            />
          )}

          {/* Vendor ticket list */}
          {vendorTickets.length > 0 && searchMode === "vendor" && (
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-sm font-medium" style={{ color: "#555555" }}>
                Ditemukan {vendorTickets.length} tiket untuk &quot;{trackId}&quot;
              </p>
              {vendorTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-lg border overflow-hidden"
                  style={{ borderColor: "#d1d5db" }}
                >
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors"
                    style={{ backgroundColor: expandedTicketId === ticket.id ? "#fff3e0" : "#f9fafb" }}
                    onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold" style={{ color: "#e65100" }}>{ticket.id}</span>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={
                          ticket.status === "active"
                            ? { backgroundColor: "#dcfce7", color: "#166534" }
                            : { backgroundColor: "#fee2e2", color: "#991b1b" }
                        }
                      >
                        {ticket.status === "active" ? "Aktif" : "Dibatalkan"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: "#555555" }}>
                      <span>{ticket.date}</span>
                      {expandedTicketId === ticket.id
                        ? <ChevronUp className="h-3.5 w-3.5" />
                        : <ChevronDown className="h-3.5 w-3.5" />
                      }
                    </div>
                  </button>

                  {expandedTicketId === ticket.id && (
                    <div style={{ backgroundColor: "#ffffff" }}>
                      <TicketDetail
                        ticket={ticket}
                        onCancel={() => handleCancel(ticket)}
                        loading={loading}
                        compact
                      />
                    </div>
                  )}
                </div>
              ))}
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

function TicketDetail({
  ticket,
  onCancel,
  onReschedule,
  loading,
  compact = false,
}: {
  ticket: TicketType
  onCancel: () => void
  onReschedule?: () => void
  loading: boolean
  compact?: boolean
}) {
  const rescheduleAllowed = canReschedule(ticket)

  return (
    <div
      className={`rounded-lg border ${compact ? "mx-4 mb-4 mt-3" : "mt-4"} p-4`}
      style={{ borderColor: "#d1d5db", backgroundColor: "#f4f6f9" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold" style={{ color: "#111111" }}>
          {ticket.id}
        </h3>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={
            ticket.status === "active"
              ? { backgroundColor: "#dcfce7", color: "#166534" }
              : { backgroundColor: "#fee2e2", color: "#991b1b" }
          }
        >
          {ticket.status === "active" ? "Aktif" : "Dibatalkan"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
          <span style={{ color: "#555555" }}>Vendor:</span>
          <span className="font-medium" style={{ color: "#111111" }}>{ticket.vendorName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
          <span style={{ color: "#555555" }}>Email:</span>
          <span className="font-medium truncate" style={{ color: "#111111" }}>{ticket.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
          <span style={{ color: "#555555" }}>PIC:</span>
          <span className="font-medium" style={{ color: "#111111" }}>{ticket.pic}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
          <span style={{ color: "#555555" }}>Tanggal:</span>
          <span className="font-medium" style={{ color: "#111111" }}>{ticket.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
          <span style={{ color: "#555555" }}>Waktu:</span>
          <span className="font-medium" style={{ color: "#111111" }}>{ticket.time}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
          <span style={{ color: "#555555" }}>Slot:</span>
          <span className="font-medium" style={{ color: "#111111" }}>{ticket.slot}</span>
        </div>
        <div className="flex items-center gap-2">
          <Package className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
          <span style={{ color: "#555555" }}>Nomor PO:</span>
          <span className="font-medium" style={{ color: "#111111" }}>{ticket.nomorPO || "-"}</span>
        </div>
        {ticket.deskripsiBarang && (
          <div className="flex items-center gap-2 sm:col-span-2">
            <Package className="h-3.5 w-3.5 shrink-0" style={{ color: "#e65100" }} />
            <span style={{ color: "#555555" }}>Deskripsi:</span>
            <span className="font-medium" style={{ color: "#111111" }}>{ticket.deskripsiBarang}</span>
          </div>
        )}
        {ticket.catatanKhusus && (
          <div className="flex items-center gap-2 sm:col-span-2">
            <StickyNote className="h-3.5 w-3.5 shrink-0" style={{ color: "#e65100" }} />
            <span style={{ color: "#555555" }}>Catatan Khusus:</span>
            <span className="font-medium" style={{ color: "#111111" }}>{ticket.catatanKhusus}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Package className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
          <span style={{ color: "#555555" }}>Koli/Item/Qty:</span>
          <span className="font-medium" style={{ color: "#111111" }}>
            {ticket.jumlahKoli}/{ticket.jumlahItem}/{ticket.jumlahQuantity}
          </span>
        </div>
      </div>

      {ticket.status === "active" && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
            style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
          >
            <X className="h-4 w-4" />
            Batalkan
          </button>
          {onReschedule && (
            <>
              <button
                onClick={onReschedule}
                disabled={!rescheduleAllowed}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                style={{ backgroundColor: "#0056b3", color: "#ffffff" }}
              >
                <CalendarClock className="h-4 w-4" />
                Reschedule
              </button>
              {!rescheduleAllowed && (
                <span className="text-xs" style={{ color: "#555555" }}>
                  Reschedule hanya bisa dilakukan &gt; 48 jam sebelum jadwal.
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
