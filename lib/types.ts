export interface Ticket {
  id: string
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
  status: "active" | "cancelled" | "completed"
  createdAt: string
}

export interface SlotMap {
  [dateTimeKey: string]: string[]
}

export type AppView =
  | "landing"
  | "booking"
  | "admin-login"
  | "admin-dashboard"
  | "success"

export const TIME_PERIODS = [
  "08:00 - 09:00",
  "09:00 - 10:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
] as const

export const SLOT_LIST = [
  "A01", "A02", "A03", "A04", "A05",
  "A06", "A07", "A08", "A09", "A10",
] as const

export const ROMAN_MONTHS = [
  "I", "II", "III", "IV", "V", "VI",
  "VII", "VIII", "IX", "X", "XI", "XII",
] as const
