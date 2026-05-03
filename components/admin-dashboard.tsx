"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import {
  Eye,
  Pencil,
  Trash2,
  Search,
  LogOut,
  X,
  ChevronDown,
  Ticket,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { TriatraLogo } from "./triatra-logo"
import type { Ticket as TicketType, AppView } from "@/lib/types"
import { deleteTicketApi, updateTicketApi } from "@/lib/storage"

interface AdminDashboardProps {
  onNavigate: (view: AppView) => void
  onLogout: () => void
}

const MONTHS = [
  "Semua Bulan",
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminDashboard({ onNavigate, onLogout }: AdminDashboardProps) {
  const { data: tickets = [], mutate, isLoading } = useSWR<TicketType[]>("/api/tickets", fetcher, {
    refreshInterval: 10000,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMonth, setSelectedMonth] = useState(0)
  const [viewTicket, setViewTicket] = useState<TicketType | null>(null)
  const [editTicket, setEditTicket] = useState<TicketType | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(ticketId: string) {
    if (!confirm("Yakin ingin menghapus tiket ini?")) return
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

  const filteredTickets = useMemo(() => {
    let result = tickets
    if (selectedMonth > 0) {
      result = result.filter((t) => {
        const month = new Date(t.date).getMonth() + 1
        return month === selectedMonth
      })
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.vendorName.toLowerCase().includes(q) ||
          t.pic.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q)
      )
    }
    return result
  }, [tickets, selectedMonth, searchQuery])

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "#f4f6f9" }}>
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
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            style={{ color: "#0056b3" }}
          >
            Beranda
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
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
                const now = new Date()
                const d = new Date(t.date)
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
              }).length}
              color="#0056b3"
              bgColor="#dbeafe"
            />
          </div>

          {/* Filters */}
          <div
            className="mb-3 flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
            style={{ backgroundColor: "#ffffff", borderColor: "#d1d5db" }}
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="appearance-none rounded-lg border py-1.5 pl-3 pr-8 text-sm outline-none focus:ring-2"
                  style={{ borderColor: "#d1d5db", color: "#333333", backgroundColor: "#ffffff" }}
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#555555" }} />
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
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#555555" }} />
              <input
                type="text"
                placeholder="Cari vendor, tiket, PIC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border py-1.5 pl-9 pr-4 text-sm outline-none focus:ring-2"
                style={{ borderColor: "#d1d5db", color: "#111111" }}
              />
            </div>
          </div>

          {/* Data Table */}
          <div
            className="overflow-hidden rounded-xl border shadow-sm"
            style={{ backgroundColor: "#ffffff", borderColor: "#d1d5db" }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#e65100" }} />
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
                      <th className="px-3 py-2.5 text-xs font-semibold" style={{ color: "#333333" }}>PO</th>
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
                            <p className="text-sm font-medium" style={{ color: "#555555" }}>
                              Belum ada tiket
                            </p>
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
                          <td className="px-3 py-2 text-xs font-medium" style={{ color: "#e65100" }}>
                            {t.id}
                          </td>
                          <td className="px-3 py-2 text-xs" style={{ color: "#111111" }}>
                            {t.vendorName}
                          </td>
                          <td className="px-3 py-2 text-xs" style={{ color: "#111111" }}>
                            {t.pic}
                          </td>
                          <td className="px-3 py-2 text-xs whitespace-nowrap" style={{ color: "#111111" }}>
                            {t.time}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className="rounded px-2 py-0.5 text-xs font-semibold"
                              style={{ backgroundColor: "#fff3e0", color: "#e65100" }}
                            >
                              {t.slot}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs" style={{ color: "#111111" }}>{t.jumlahPO}</td>
                          <td className="px-3 py-2 text-xs" style={{ color: "#111111" }}>{t.jumlahKoli}</td>
                          <td className="px-3 py-2 text-xs" style={{ color: "#111111" }}>{t.jumlahItem}</td>
                          <td className="px-3 py-2 text-xs" style={{ color: "#111111" }}>{t.jumlahQuantity}</td>
                          <td className="px-3 py-2 text-xs whitespace-nowrap" style={{ color: "#111111" }}>
                            {t.date}
                          </td>
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
                              <button
                                onClick={() => setViewTicket(t)}
                                className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
                                title="Lihat Detail"
                              >
                                <Eye className="h-3.5 w-3.5" style={{ color: "#0056b3" }} />
                              </button>
                              <button
                                onClick={() => setEditTicket({ ...t })}
                                className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
                                title="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
                              </button>
                              <button
                                onClick={() => handleDelete(t.id)}
                                disabled={deleting === t.id}
                                className="rounded-lg p-1.5 transition-colors hover:bg-red-50 disabled:opacity-50"
                                title="Hapus"
                              >
                                {deleting === t.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#dc2626" }} />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" style={{ color: "#dc2626" }} />
                                )}
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
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t px-4 py-2 text-center text-xs"
        style={{ borderColor: "#d1d5db", color: "#555555", backgroundColor: "#ffffff" }}
      >
        &copy; 2026 Triatra Depo Jakarta. Hak Cipta Dilindungi.
      </footer>

      {/* View Modal */}
      {viewTicket && (
        <ViewModal ticket={viewTicket} onClose={() => setViewTicket(null)} />
      )}

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
      <div className="w-full max-w-md rounded-xl p-6 shadow-xl" style={{ backgroundColor: "#ffffff" }}>
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
          <Detail label="Jumlah PO" value={String(ticket.jumlahPO)} />
          <Detail label="Jumlah Koli" value={String(ticket.jumlahKoli)} />
          <Detail label="Jumlah Item" value={String(ticket.jumlahItem)} />
          <Detail label="Jumlah Qty" value={String(ticket.jumlahQuantity)} />
          <Detail label="Status" value={ticket.status === "active" ? "Aktif" : "Dibatalkan"} />
          <Detail label="Dibuat" value={new Date(ticket.createdAt).toLocaleString("id-ID")} />
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
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
  const [jumlahPO, setJumlahPO] = useState(String(ticket.jumlahPO))
  const [jumlahKoli, setJumlahKoli] = useState(String(ticket.jumlahKoli))
  const [jumlahItem, setJumlahItem] = useState(String(ticket.jumlahItem))
  const [jumlahQuantity, setJumlahQuantity] = useState(String(ticket.jumlahQuantity))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(ticket.id, {
        jumlahPO: parseInt(jumlahPO) || 0,
        jumlahKoli: parseInt(jumlahKoli) || 0,
        jumlahItem: parseInt(jumlahItem) || 0,
        jumlahQuantity: parseInt(jumlahQuantity) || 0,
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
          <EditField label="Jumlah PO" value={jumlahPO} onChange={setJumlahPO} />
          <EditField label="Jumlah Koli" value={jumlahKoli} onChange={setJumlahKoli} />
          <EditField label="Jumlah Item" value={jumlahItem} onChange={setJumlahItem} />
          <EditField label="Jumlah Quantity" value={jumlahQuantity} onChange={setJumlahQuantity} />
        </div>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{ borderColor: "#d1d5db", color: "#333333", backgroundColor: "#ffffff" }}
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
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

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium" style={{ color: "#333333" }}>{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2"
        style={{ borderColor: "#d1d5db", color: "#111111" }}
      />
    </div>
  )
}
