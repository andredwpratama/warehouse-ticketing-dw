"use client"

import { Bell, X, Ticket, CalendarClock, XCircle } from "lucide-react"
import type { AdminNotification, Ticket as TicketType } from "@/lib/types"

interface AdminNotificationModalProps {
  notifications: AdminNotification
  onClose: () => void
}

export function AdminNotificationModal({ notifications, onClose }: AdminNotificationModalProps) {
  const total =
    notifications.newTickets.length +
    notifications.rescheduledTickets.length +
    notifications.cancelledTickets.length

  if (total === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-md rounded-xl shadow-xl max-h-[85vh] flex flex-col"
        style={{ backgroundColor: "#ffffff" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "#e5e7eb" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: "#fff3e0" }}
            >
              <Bell className="h-4 w-4" style={{ color: "#e65100" }} />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: "#111111" }}>Notifikasi Masuk</h2>
              <p className="text-xs" style={{ color: "#555555" }}>{total} aktivitas baru sejak login terakhir</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: "#f3f4f6", color: "#555555" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <NotificationSection
            icon={<Ticket className="h-4 w-4" style={{ color: "#16a34a" }} />}
            title="Tiket Baru"
            count={notifications.newTickets.length}
            tickets={notifications.newTickets}
            accentColor="#16a34a"
            bgColor="#dcfce7"
          />
          <NotificationSection
            icon={<CalendarClock className="h-4 w-4" style={{ color: "#0056b3" }} />}
            title="Tiket Direschedule"
            count={notifications.rescheduledTickets.length}
            tickets={notifications.rescheduledTickets}
            accentColor="#0056b3"
            bgColor="#dbeafe"
          />
          <NotificationSection
            icon={<XCircle className="h-4 w-4" style={{ color: "#dc2626" }} />}
            title="Tiket Dibatalkan"
            count={notifications.cancelledTickets.length}
            tickets={notifications.cancelledTickets}
            accentColor="#dc2626"
            bgColor="#fee2e2"
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t" style={{ borderColor: "#e5e7eb" }}>
          <button
            onClick={onClose}
            className="w-full rounded-lg py-2.5 text-sm font-semibold transition-colors"
            style={{ backgroundColor: "#e65100", color: "#ffffff" }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

function NotificationSection({
  icon,
  title,
  count,
  tickets,
  accentColor,
  bgColor,
}: {
  icon: React.ReactNode
  title: string
  count: number
  tickets: TicketType[]
  accentColor: string
  bgColor: string
}) {
  if (count === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-semibold" style={{ color: "#111111" }}>{title}</span>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-bold"
          style={{ backgroundColor: bgColor, color: accentColor }}
        >
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {tickets.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: "#f9fafb", borderLeft: `3px solid ${accentColor}` }}
          >
            <div>
              <p className="font-semibold" style={{ color: accentColor }}>{t.id}</p>
              <p className="text-xs" style={{ color: "#555555" }}>{t.vendorName}</p>
            </div>
            <div className="text-right text-xs" style={{ color: "#555555" }}>
              <p>{t.date}</p>
              <p>{t.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
