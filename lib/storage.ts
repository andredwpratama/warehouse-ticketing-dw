import type { Ticket } from "./types"

const API = "/api"

export async function fetchTickets(): Promise<Ticket[]> {
  const res = await fetch(`${API}/tickets`)
  if (!res.ok) throw new Error("Gagal mengambil tiket")
  return res.json()
}

export async function fetchTicketById(id: string): Promise<Ticket | null> {
  const res = await fetch(`${API}/tickets/${encodeURIComponent(id)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error("Gagal mengambil tiket")
  return res.json()
}

export async function createTicket(data: {
  vendorName: string
  email: string
  pic: string
  jumlahPO: number
  jumlahKoli: number
  jumlahItem: number
  jumlahQuantity: number
  date: string
  time: string
  slot: string
}): Promise<Ticket> {
  const res = await fetch(`${API}/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || "Gagal membuat tiket")
  }
  return res.json()
}

export async function updateTicketApi(id: string, updates: Partial<Ticket>): Promise<Ticket> {
  const res = await fetch(`${API}/tickets/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || "Gagal mengupdate tiket")
  }
  return res.json()
}

export async function deleteTicketApi(id: string): Promise<void> {
  const res = await fetch(`${API}/tickets/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Gagal menghapus tiket")
}

export async function fetchBookedSlots(date: string, time: string): Promise<string[]> {
  const res = await fetch(`${API}/slots?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`)
  if (!res.ok) return []
  return res.json()
}

export function getMinBookingDate(): Date {
  const today = new Date()
  today.setDate(today.getDate() + 2)
  today.setHours(0, 0, 0, 0)
  return today
}

export function canReschedule(ticket: Ticket): boolean {
  const [startHour] = ticket.time.split(" - ")[0].split(":")
  const scheduledDate = new Date(ticket.date)
  scheduledDate.setHours(parseInt(startHour), 0, 0, 0)
  const now = new Date()
  const diffMs = scheduledDate.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  return diffHours > 48
}
