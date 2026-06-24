"use client"

import { useState, useMemo, useEffect } from "react"
import useSWR from "swr"
import {
  Eye,
  Pencil,
  Trash2,
  Search,
  LogOut,
  X,
  Ticket,
  Loader2,
  RefreshCw,
  LayoutGrid,
  Table,
  Lock,
  Unlock,
  Ban,
  StickyNote,
} from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { TriatraLogo } from "./triatra-logo"
import { AdminNotificationModal } from "./admin-notification-modal"
import type { Ticket as TicketType, BlockedSlot, AppView, AdminNotification } from "@/lib/types"
import { TIME_PERIODS, SLOT_LIST } from "@/lib/types"
import {
  deleteTicketApi,
  updateTicketApi,
  fetchBlockedSlotsForDate,
  createBlockedSlot,
  deleteBlockedSlot,
  fetchNotifications,
} from "@/lib/storage"

interface AdminDashboardProps {
  onNavigate: (view: AppView) => void
  onLogout: () => void
}

const fetcher = async (url: string): Promise<TicketType[]> => {
  const res = await fetch(url)
  if (!res.ok) {
    let message = "Gagal mengambil data tiket"
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch { /* ignore */ }
    throw new Error(message)
  }
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export function AdminDashboard({ onNavigate, onLogout }: AdminDashboardProps) {
  const { data, mutate, isLoading, error } = useSWR<TicketType[]>("/api/tickets", fetcher, {
    refreshInterval: 10000,
  })
  const tickets = Array.isArray(data) ? data : []

  const [searchQuery, setSearchQuery] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [viewMode, setViewMode] = useState<"table" | "schedule">("table")
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split("T")[0])
  const [viewTicket, setViewTicket] = useState<TicketType | null>(null)
  const [editTicket, setEditTicket] = useState<TicketType | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<AdminNotification | null>(null)

  // Blocked slots for schedule view
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([])
  const [blockModal, setBlockModal] = useState<{ date: string; time: string; slot: string } | null>(null)
  const [blockReason, setBlockReason] = useState("")
  const [blockLoading, setBlockLoading] = useState(false)

  // Load notifications on mount (R8)
  useEffect(() => {
    const lastLogin = localStorage.getItem("adminLastLogin") ??
      new Date(Date.now() - 86400000).toISOString()
    fetchNotifications(lastLogin)
      .then((n) => {
        const hasAny = n.newTickets.length + n.rescheduledTickets.length + n.cancelledTickets.length > 0
        if (hasAny) setNotifications(n)
      })
      .catch(() => {/* silent */})
  }, [])

  function handleCloseNotifications() {
    setNotifications(null)
    localStorage.setItem("adminLastLogin", new Date().toISOString())
  }

  // Load blocked slots when schedule date changes (R6)
  useEffect(() => {
    if (viewMode === "schedule") {
      fetchBlockedSlotsForDate(scheduleDate).then(setBlockedSlots)
    }
  }, [scheduleDate, viewMode])

  async function handleDelete(ticketId: string) {
    if (!confirm("Yakin ingin menghapus tiket ini secara permanen?")) return
    setDeleting(ticketId)
    try {
      await deleteTicketApi(ticketId)
      mutate()
    } catch {
      alert("Gagal menghapus tiket.")
    } finally {
      setDeleting(null)
    }
  }

  async function handleCancelByAdmin(ticketId: string) {
    if (!confirm("Yakin ingin membatalkan tiket ini?")) return
    setCancelling(ticketId)
    try {
      await updateTicketApi(ticketId, { status: "cancelled", cancelledBy: "admin" })
      mutate()
    } catch {
      alert("Gagal membatalkan tiket.")
    } finally {
      setCancelling(null)
    }
  }

  async function handleBlockSlot() {
    if (!blockModal) return
    setBlockLoading(true)
    try {
      const newBlocked = await createBlockedSlot({ ...blockModal, reason: blockReason || undefined })
      setBlockedSlots((prev) => [...prev, newBlocked])
      setBlockModal(null)
      setBlockReason("")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memblokir slot.")
    } finally {
      setBlockLoading(false)
    }
  }

  async function handleUnblockSlot(id: string) {
    if (!confirm("Unblokir slot ini?")) return
    try {
      await deleteBlockedSlot(id)
      setBlockedSlots((prev) => prev.filter((b) => b.id !== id))
    } catch {
      alert("Gagal membuka blokir slot.")
    }
  }

  const filteredTickets = useMemo(() => {
    let result = tickets
    if (dateFrom) result = result.filter((t) => t.date >= dateFrom)
    if (dateTo) result = result.filter((t) => t.date <= dateTo)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.vendorName.toLowerCase().includes(q) ||
          t.pic.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.nomorPO.toLowerCase().includes(q)
      )
    }
    return result
  }, [tickets, dateFrom, dateTo, searchQuery])

  // Pie chart data (R10)
  const cancellationData = useMemo(() => {
    const byVendor = tickets.filter((t) => t.status === "cancelled" && t.cancelledBy === "vendor").length
    const byAdmin = tickets.filter((t) => t.status === "cancelled" && t.cancelledBy === "admin").length
    const unknown = tickets.filter((t) => t.status === "cancelled" && !t.cancelledBy).length
    return { byVendor, byAdmin, unknown, total: byVendor + byAdmin + unknown }
  }, [tickets])

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "#f4f6f9" }}>
      {/* Notification Modal */}
      {notifications && (
        <AdminNotificationModal notifications={notifications} onClose={handleCloseNotifications} />
      )}

      {/* Header */}
      <header
        className="flex items-center justify-between border-b px-4 py-2 shadow-sm md:px-8"
        style={{ backgroundColor: "#ffffff", borderColor: "#d1d5db" }}
      >
        <div className="flex items-center gap-3">
          <TriatraLogo />
          <span
            className="hidden rounded-full px-2.5 py-0.5 text-xs font-semibold sm:inline-block"
            style={{ backgroundColor: "#fff3e0", color: "#e65100" }}
          >
            Admin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("landing")}
            className="rounded-lg px-3 py-1.5 text-sm font-medium"
            style={{ color: "#0056b3" }}
          >
            Beranda
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium"
            style={{ color: "#dc2626" }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Stats */}
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Total Tiket" value={tickets.length} color="#e65100" bgColor="#fff3e0" />
            <StatCard label="Aktif" value={tickets.filter((t) => t.status === "active").length} color="#16a34a" bgColor="#dcfce7" />
            <StatCard label="Dibatalkan" value={tickets.filter((t) => t.status === "cancelled").length} color="#dc2626" bgColor="#fee2e2" />
            <StatCard
              label="Bulan Ini"
              value={tickets.filter((t) => {
                const now = new Date(); const d = new Date(t.date)
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
              }).length}
              color="#0056b3"
              bgColor="#dbeafe"
            />
          </div>

          {/* Cancellation Pie Chart (R10) */}
          {cancellationData.total > 0 && (
            <div
              className="mb-4 rounded-xl border p-4 shadow-sm"
              style={{ backgroundColor: "#ffffff", borderColor: "#d1d5db" }}
            >
              <h3 className="mb-3 text-sm font-bold" style={{ color: "#111111" }}>
                Rasio Pembatalan Tiket
              </h3>
              <div className="flex flex-col items-center sm:flex-row sm:items-center sm:gap-8">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Dibatalkan Vendor", value: cancellationData.byVendor },
                        { name: "Dibatalkan Admin", value: cancellationData.byAdmin },
                        ...(cancellationData.unknown > 0 ? [{ name: "Tidak Diketahui", value: cancellationData.unknown }] : []),
                      ].filter((d) => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="value"
                    >
                      <Cell fill="#dc2626" />
                      <Cell fill="#f97316" />
                      <Cell fill="#9ca3af" />
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value} tiket`, ""]} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* View Mode Toggle + Filters */}
          <div
            className="mb-3 flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
            style={{ backgroundColor: "#ffffff", borderColor: "#d1d5db" }}
          >
            {/* View toggle */}
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "#d1d5db" }}>
                <button
                  onClick={() => setViewMode("table")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                  style={viewMode === "table"
                    ? { backgroundColor: "#e65100", color: "#ffffff" }
                    : { backgroundColor: "#ffffff", color: "#555555" }
                  }
                >
                  <Table className="h-3.5 w-3.5" />
                  Tabel
                </button>
                <button
                  onClick={() => setViewMode("schedule")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                  style={viewMode === "schedule"
                    ? { backgroundColor: "#e65100", color: "#ffffff" }
                    : { backgroundColor: "#ffffff", color: "#555555" }
                  }
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Jadwal
                </button>
              </div>
              <button
                onClick={() => mutate()}
                className="rounded-lg border p-1.5 transition-colors hover:bg-gray-50"
                style={{ borderColor: "#d1d5db" }}
                title="Refresh data"
              >
                <RefreshCw className="h-4 w-4" style={{ color: "#555555" }} />
              </button>
            </div>

            {viewMode === "table" ? (
              /* Date range filter (R7) */
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium" style={{ color: "#555555" }}>Dari</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="rounded-lg border px-2 py-1.5 text-xs outline-none"
                    style={{ borderColor: "#d1d5db", color: "#111111" }}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium" style={{ color: "#555555" }}>Sampai</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="rounded-lg border px-2 py-1.5 text-xs outline-none"
                    style={{ borderColor: "#d1d5db", color: "#111111" }}
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(""); setDateTo("") }}
                    className="text-xs px-2 py-1 rounded"
                    style={{ color: "#dc2626" }}
                  >
                    Reset
                  </button>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "#555555" }} />
                  <input
                    type="text"
                    placeholder="Cari vendor, tiket, PIC, PO..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-lg border py-1.5 pl-8 pr-4 text-xs outline-none"
                    style={{ borderColor: "#d1d5db", color: "#111111", width: "200px" }}
                  />
                </div>
              </div>
            ) : (
              /* Schedule date picker (R5) */
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium" style={{ color: "#555555" }}>Tanggal Jadwal</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="rounded-lg border px-2 py-1.5 text-xs outline-none"
                  style={{ borderColor: "#d1d5db", color: "#111111" }}
                />
              </div>
            )}
          </div>

          {/* Table View */}
          {viewMode === "table" && (
            <>
              <div
                className="overflow-hidden rounded-xl border shadow-sm"
                style={{ backgroundColor: "#ffffff", borderColor: "#d1d5db" }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#e65100" }} />
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <p className="text-sm font-medium" style={{ color: "#dc2626" }}>
                      {error.message || "Gagal memuat data tiket."}
                    </p>
                    <button
                      onClick={() => mutate()}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold"
                      style={{ backgroundColor: "#e65100", color: "#ffffff" }}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Coba Lagi
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr style={{ backgroundColor: "#f4f6f9" }}>
                          <th className="px-3 py-2.5 text-xs font-semibold" style={{ color: "#333333" }}>No. Tiket</th>
                          <th className="px-3 py-2.5 text-xs font-semibold" style={{ color: "#333333" }}>Vendor</th>
                          <th className="px-3 py-2.5 text-xs font-semibold" style={{ color: "#333333" }}>PIC</th>
                          <th className="px-3 py-2.5 text-xs font-semibold" style={{ color: "#333333" }}>Waktu</th>
                          <th className="px-3 py-2.5 text-xs font-semibold" style={{ color: "#333333" }}>Slot</th>
                          <th className="px-3 py-2.5 text-xs font-semibold" style={{ color: "#333333" }}>Nomor PO</th>
                          <th className="px-3 py-2.5 text-xs font-semibold" style={{ color: "#333333" }}>Koli</th>
                          <th className="px-3 py-2.5 text-xs font-semibold" style={{ color: "#333333" }}>Item</th>
                          <th className="px-3 py-2.5 text-xs font-semibold" style={{ color: "#333333" }}>Qty</th>
                          <th className="px-3 py-2.5 text-xs font-semibold" style={{ color: "#333333" }}>Tanggal</th>
                          <th className="px-3 py-2.5 text-xs font-semibold" style={{ color: "#333333" }}>Status</th>
                          <th className="px-3 py-2.5 text-xs font-semibold" style={{ color: "#333333" }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTickets.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="px-4 py-12 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <Ticket className="h-8 w-8" style={{ color: "#d1d5db" }} />
                                <p className="text-sm font-medium" style={{ color: "#555555" }}>Belum ada tiket</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredTickets.map((t) => (
                            <tr
                              key={t.id}
                              className="border-t transition-colors hover:bg-gray-50"
                              style={{ borderColor: "#e8eaed" }}
                            >
                              <td className="px-3 py-2 text-xs font-medium" style={{ color: "#e65100" }}>{t.id}</td>
                              <td className="px-3 py-2 text-xs" style={{ color: "#111111" }}>{t.vendorName}</td>
                              <td className="px-3 py-2 text-xs" style={{ color: "#111111" }}>{t.pic}</td>
                              <td className="px-3 py-2 text-xs whitespace-nowrap" style={{ color: "#111111" }}>{t.time}</td>
                              <td className="px-3 py-2">
                                <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: "#fff3e0", color: "#e65100" }}>
                                  {t.slot}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs" style={{ color: "#111111" }}>{t.nomorPO || "-"}</td>
                              <td className="px-3 py-2 text-xs" style={{ color: "#111111" }}>{t.jumlahKoli}</td>
                              <td className="px-3 py-2 text-xs" style={{ color: "#111111" }}>{t.jumlahItem}</td>
                              <td className="px-3 py-2 text-xs" style={{ color: "#111111" }}>{t.jumlahQuantity}</td>
                              <td className="px-3 py-2 text-xs whitespace-nowrap" style={{ color: "#111111" }}>{t.date}</td>
                              <td className="px-3 py-2">
                                <span
                                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                                  style={
                                    t.status === "active"
                                      ? { backgroundColor: "#dcfce7", color: "#166534" }
                                      : { backgroundColor: "#fee2e2", color: "#991b1b" }
                                  }
                                >
                                  {t.status === "active" ? "Aktif" : "Batal"}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-0.5">
                                  <button onClick={() => setViewTicket(t)} className="rounded-lg p-1.5 hover:bg-gray-100" title="Lihat Detail">
                                    <Eye className="h-3.5 w-3.5" style={{ color: "#0056b3" }} />
                                  </button>
                                  <button onClick={() => setEditTicket({ ...t })} className="rounded-lg p-1.5 hover:bg-gray-100" title="Edit">
                                    <Pencil className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
                                  </button>
                                  {t.status === "active" && (
                                    <button
                                      onClick={() => handleCancelByAdmin(t.id)}
                                      disabled={cancelling === t.id}
                                      className="rounded-lg p-1.5 hover:bg-orange-50 disabled:opacity-50"
                                      title="Batalkan (Admin)"
                                    >
                                      {cancelling === t.id
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#f97316" }} />
                                        : <Ban className="h-3.5 w-3.5" style={{ color: "#f97316" }} />
                                      }
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDelete(t.id)}
                                    disabled={deleting === t.id}
                                    className="rounded-lg p-1.5 hover:bg-red-50 disabled:opacity-50"
                                    title="Hapus Permanen"
                                  >
                                    {deleting === t.id
                                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#dc2626" }} />
                                      : <Trash2 className="h-3.5 w-3.5" style={{ color: "#dc2626" }} />
                                    }
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <p className="mt-2 text-right text-xs" style={{ color: "#555555" }}>
                Menampilkan {filteredTickets.length} dari {tickets.length} tiket
              </p>
            </>
          )}

          {/* Schedule Grid View (R5 + R6) */}
          {viewMode === "schedule" && (
            <div
              className="rounded-xl border shadow-sm overflow-auto"
              style={{ backgroundColor: "#ffffff", borderColor: "#d1d5db" }}
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4 text-xs flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: "#fff3e0", border: "1px solid #e65100" }} />
                    Terisi (klik untuk detail)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: "#fee2e2", border: "1px solid #dc2626" }} />
                    Diblokir (klik untuk unblokir)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: "#f9fafb", border: "1px solid #d1d5db" }} />
                    Kosong (klik untuk blokir)
                  </span>
                </div>

                {/* Grid: rows = TIME_PERIODS, cols = SLOT_LIST */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className="py-2 pr-3 text-left font-semibold" style={{ color: "#555555", minWidth: "120px" }}>Waktu</th>
                        {SLOT_LIST.map((slot) => (
                          <th key={slot} className="px-2 py-2 text-center font-semibold" style={{ color: "#333333", minWidth: "80px" }}>
                            {slot}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {TIME_PERIODS.map((time) => (
                        <tr key={time} className="border-t" style={{ borderColor: "#e5e7eb" }}>
                          <td className="py-2 pr-3 font-medium whitespace-nowrap" style={{ color: "#555555" }}>{time}</td>
                          {SLOT_LIST.map((slot) => {
                            const ticket = tickets.find(
                              (t) => t.date === scheduleDate && t.time === time && t.slot === slot && t.status !== "cancelled"
                            )
                            const blocked = blockedSlots.find(
                              (b) => b.date === scheduleDate && b.time === time && b.slot === slot
                            )

                            if (ticket) {
                              return (
                                <td key={slot} className="px-1 py-1">
                                  <button
                                    onClick={() => setViewTicket(ticket)}
                                    className="w-full rounded-lg px-1.5 py-2 text-center transition-colors hover:opacity-80"
                                    style={{ backgroundColor: "#fff3e0", border: "1px solid #e65100" }}
                                    title={`${ticket.vendorName} — ${ticket.id}`}
                                  >
                                    <p className="font-semibold truncate" style={{ color: "#e65100", fontSize: "10px" }}>
                                      {ticket.vendorName.length > 10 ? ticket.vendorName.slice(0, 10) + "…" : ticket.vendorName}
                                    </p>
                                    {ticket.catatanKhusus && (
                                      <p className="truncate mt-0.5" style={{ color: "#c2410c", fontSize: "9px" }}>
                                        {ticket.catatanKhusus.slice(0, 14)}{ticket.catatanKhusus.length > 14 ? "…" : ""}
                                      </p>
                                    )}
                                  </button>
                                </td>
                              )
                            }

                            if (blocked) {
                              return (
                                <td key={slot} className="px-1 py-1">
                                  <button
                                    onClick={() => handleUnblockSlot(blocked.id)}
                                    className="w-full rounded-lg px-1.5 py-2 text-center transition-colors hover:opacity-80"
                                    style={{ backgroundColor: "#fee2e2", border: "1px solid #dc2626" }}
                                    title={blocked.reason ? `Diblokir: ${blocked.reason}` : "Diblokir — klik untuk unblokir"}
                                  >
                                    <Lock className="h-3 w-3 mx-auto" style={{ color: "#dc2626" }} />
                                  </button>
                                </td>
                              )
                            }

                            return (
                              <td key={slot} className="px-1 py-1">
                                <button
                                  onClick={() => { setBlockModal({ date: scheduleDate, time, slot }); setBlockReason("") }}
                                  className="w-full rounded-lg px-1.5 py-2 text-center transition-colors hover:bg-gray-100"
                                  style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}
                                  title="Klik untuk memblokir slot ini"
                                >
                                  <Unlock className="h-3 w-3 mx-auto" style={{ color: "#9ca3af" }} />
                                </button>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer
        className="border-t px-4 py-2 text-center text-xs"
        style={{ borderColor: "#d1d5db", color: "#555555", backgroundColor: "#ffffff" }}
      >
        &copy; 2026 Triatra Depo Jakarta. Hak Cipta Dilindungi.
      </footer>

      {/* View Modal */}
      {viewTicket && <ViewModal ticket={viewTicket} onClose={() => setViewTicket(null)} />}

      {/* Edit Modal */}
      {editTicket && (
        <EditModal
          ticket={editTicket}
          onClose={() => setEditTicket(null)}
          onSave={async (id, updates) => {
            await updateTicketApi(id, updates)
            mutate()
            setEditTicket(null)
          }}
        />
      )}

      {/* Block Slot Modal */}
      {blockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl p-6 shadow-xl" style={{ backgroundColor: "#ffffff" }}>
            <h2 className="mb-2 text-base font-bold" style={{ color: "#111111" }}>Blokir Slot</h2>
            <p className="mb-4 text-sm" style={{ color: "#555555" }}>
              Blokir <strong>{blockModal.slot}</strong> pada pukul <strong>{blockModal.time}</strong>, tanggal <strong>{blockModal.date}</strong>?
            </p>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium" style={{ color: "#333333" }}>
                Alasan <span style={{ color: "#999" }}>(opsional)</span>
              </label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Contoh: Internal unloading, maintenance..."
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "#d1d5db", color: "#111111" }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setBlockModal(null)}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold"
                style={{ borderColor: "#d1d5db", color: "#333333" }}
              >
                Batal
              </button>
              <button
                onClick={handleBlockSlot}
                disabled={blockLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
              >
                {blockLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Blokir Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, bgColor }: { label: string; value: number; color: string; bgColor: string }) {
  return (
    <div className="rounded-xl border p-3 shadow-sm" style={{ backgroundColor: "#ffffff", borderColor: "#d1d5db" }}>
      <p className="text-xs font-medium" style={{ color: "#555555" }}>{label}</p>
      <p className="mt-1 text-xl font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

function ViewModal({ ticket, onClose }: { ticket: TicketType; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "#ffffff" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "#111111" }}>Detail Tiket</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5" style={{ color: "#555555" }} />
          </button>
        </div>
        <div className="mb-4 rounded-lg p-3 text-center" style={{ backgroundColor: "#fff3e0" }}>
          <p className="text-lg font-bold" style={{ color: "#e65100" }}>{ticket.id}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Detail label="Vendor" value={ticket.vendorName} />
          <Detail label="Email" value={ticket.email} />
          <Detail label="PIC" value={ticket.pic} />
          <Detail label="Tanggal" value={ticket.date} />
          <Detail label="Waktu" value={ticket.time} />
          <Detail label="Slot" value={ticket.slot} />
          <Detail label="Nomor PO" value={ticket.nomorPO || "-"} />
          <Detail label="Jumlah Koli" value={String(ticket.jumlahKoli)} />
          <Detail label="Jumlah Item" value={String(ticket.jumlahItem)} />
          <Detail label="Jumlah Qty" value={String(ticket.jumlahQuantity)} />
          {ticket.catatanKhusus && <Detail label="Catatan Khusus" value={ticket.catatanKhusus} />}
          <Detail label="Status" value={ticket.status === "active" ? "Aktif" : "Dibatalkan"} />
          {ticket.cancelledBy && (
            <Detail label="Dibatalkan Oleh" value={ticket.cancelledBy === "vendor" ? "Vendor" : "Admin"} />
          )}
          <Detail label="Dibuat" value={new Date(ticket.createdAt).toLocaleString("id-ID")} />
        </div>
        {ticket.deskripsiBarang && (
          <div className="mt-3">
            <p className="text-xs mb-1" style={{ color: "#555555" }}>Deskripsi Barang</p>
            <p className="text-sm font-medium rounded-lg p-2" style={{ color: "#111111", backgroundColor: "#f9fafb" }}>
              {ticket.deskripsiBarang}
            </p>
          </div>
        )}
        {ticket.notes && (
          <div className="mt-3">
            <p className="text-xs mb-1 flex items-center gap-1" style={{ color: "#555555" }}>
              <StickyNote className="h-3 w-3" /> Catatan
            </p>
            <p className="text-sm font-medium rounded-lg p-2" style={{ color: "#111111", backgroundColor: "#f9fafb" }}>
              {ticket.notes}
            </p>
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold"
          style={{ backgroundColor: "#e65100", color: "#ffffff" }}
        >
          Tutup
        </button>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs" style={{ color: "#555555" }}>{label}</p>
      <p className="font-medium" style={{ color: "#111111" }}>{value}</p>
    </div>
  )
}

function EditModal({
  ticket,
  onClose,
  onSave,
}: {
  ticket: TicketType
  onClose: () => void
  onSave: (id: string, updates: Partial<TicketType>) => Promise<void>
}) {
  const [nomorPO, setNomorPO] = useState(ticket.nomorPO || "")
  const [deskripsiBarang, setDeskripsiBarang] = useState(ticket.deskripsiBarang || "")
  const [jumlahKoli, setJumlahKoli] = useState(String(ticket.jumlahKoli))
  const [jumlahItem, setJumlahItem] = useState(String(ticket.jumlahItem))
  const [jumlahQuantity, setJumlahQuantity] = useState(String(ticket.jumlahQuantity))
  const [catatanKhusus, setCatatanKhusus] = useState(ticket.catatanKhusus || "")
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(ticket.id, {
        nomorPO,
        deskripsiBarang,
        jumlahKoli: parseInt(jumlahKoli) || 0,
        jumlahItem: parseInt(jumlahItem) || 0,
        jumlahQuantity: parseInt(jumlahQuantity) || 0,
        catatanKhusus: catatanKhusus || undefined,
      })
    } catch {
      alert("Gagal menyimpan.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl p-6 shadow-xl" style={{ backgroundColor: "#ffffff" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "#111111" }}>Edit Tiket</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5" style={{ color: "#555555" }} />
          </button>
        </div>
        <p className="mb-4 text-sm font-medium" style={{ color: "#e65100" }}>{ticket.id}</p>
        <div className="flex flex-col gap-3">
          <EditField label="Nomor PO" value={nomorPO} onChange={setNomorPO} type="text" />
          <EditField label="Deskripsi Barang" value={deskripsiBarang} onChange={setDeskripsiBarang} type="text" />
          <EditField label="Jumlah Koli" value={jumlahKoli} onChange={setJumlahKoli} />
          <EditField label="Jumlah Item" value={jumlahItem} onChange={setJumlahItem} />
          <EditField label="Jumlah Quantity" value={jumlahQuantity} onChange={setJumlahQuantity} />
          <EditField label="Catatan Khusus (opsional)" value={catatanKhusus} onChange={setCatatanKhusus} type="text" />
        </div>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold"
            style={{ borderColor: "#d1d5db", color: "#333333", backgroundColor: "#ffffff" }}
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            style={{ backgroundColor: "#e65100", color: "#ffffff" }}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}

function EditField({
  label,
  value,
  onChange,
  type = "number",
}: {
  label: string
  value: string
  onChange: (val: string) => void
  type?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium" style={{ color: "#333333" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2"
        style={{ borderColor: "#d1d5db", color: "#111111" }}
      />
    </div>
  )
}
