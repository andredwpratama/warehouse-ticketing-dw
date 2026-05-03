"use client"

import { useState, useEffect, useCallback } from "react"
import { X, CalendarDays, Clock, MapPin, Loader2 } from "lucide-react"
import type { Ticket } from "@/lib/types"
import { TIME_PERIODS, SLOT_LIST } from "@/lib/types"
import { fetchBookedSlots, getMinBookingDate, updateTicketApi } from "@/lib/storage"

interface RescheduleModalProps {
  ticket: Ticket
  onClose: () => void
  onDone: () => void
}

export function RescheduleModal({ ticket, onClose, onDone }: RescheduleModalProps) {
  const minDate = getMinBookingDate()
  const defaultDate = minDate.toISOString().split("T")[0]

  const [selectedDate, setSelectedDate] = useState(defaultDate)
  const [selectedTime, setSelectedTime] = useState("")
  const [selectedSlot, setSelectedSlot] = useState("")
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const loadSlots = useCallback(async () => {
    if (selectedDate && selectedTime) {
      const slots = await fetchBookedSlots(selectedDate, selectedTime)
      setBookedSlots(slots)
    } else {
      setBookedSlots([])
    }
  }, [selectedDate, selectedTime])

  useEffect(() => {
    loadSlots()
  }, [loadSlots])

  async function handleSubmit() {
    if (!selectedDate || !selectedTime || !selectedSlot) return
    setSubmitting(true)
    try {
      await updateTicketApi(ticket.id, {
        date: selectedDate,
        time: selectedTime,
        slot: selectedSlot,
      } as Partial<Ticket>)
      onDone()
    } catch {
      alert("Gagal reschedule tiket.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-lg rounded-xl p-6 shadow-xl"
        style={{ backgroundColor: "#ffffff" }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "#111111" }}>
            Reschedule Tiket
          </h2>
          <button onClick={onClose} className="rounded-full p-1 transition-colors hover:bg-gray-100">
            <X className="h-5 w-5" style={{ color: "#555555" }} />
          </button>
        </div>

        <p className="mb-4 text-sm" style={{ color: "#555555" }}>
          Tiket: <span className="font-semibold" style={{ color: "#111111" }}>{ticket.id}</span>
        </p>

        {/* Date */}
        <div className="mb-4">
          <label className="mb-1 flex items-center gap-2 text-sm font-medium" style={{ color: "#333333" }}>
            <CalendarDays className="h-4 w-4" style={{ color: "#e65100" }} />
            Tanggal Baru
          </label>
          <input
            type="date"
            value={selectedDate}
            min={defaultDate}
            onChange={(e) => {
              setSelectedDate(e.target.value)
              setSelectedTime("")
              setSelectedSlot("")
            }}
            className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2"
            style={{ borderColor: "#d1d5db", color: "#111111" }}
          />
        </div>

        {/* Time */}
        <div className="mb-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium" style={{ color: "#333333" }}>
            <Clock className="h-4 w-4" style={{ color: "#e65100" }} />
            Waktu
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TIME_PERIODS.map((time) => (
              <button
                key={time}
                onClick={() => {
                  setSelectedTime(time)
                  setSelectedSlot("")
                }}
                className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                style={
                  selectedTime === time
                    ? { backgroundColor: "#e65100", color: "#ffffff", borderColor: "#e65100" }
                    : { backgroundColor: "#ffffff", color: "#333333", borderColor: "#d1d5db" }
                }
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Slots */}
        {selectedTime && (
          <div className="mb-5">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium" style={{ color: "#333333" }}>
              <MapPin className="h-4 w-4" style={{ color: "#e65100" }} />
              Slot
            </label>
            <div className="grid grid-cols-5 gap-2">
              {SLOT_LIST.map((slot) => {
                const isBooked = bookedSlots.includes(slot)
                const isSelected = selectedSlot === slot
                return (
                  <button
                    key={slot}
                    disabled={isBooked}
                    onClick={() => setSelectedSlot(slot)}
                    className="rounded-lg border py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    style={
                      isBooked
                        ? { backgroundColor: "#e8eaed", color: "#999999", borderColor: "#d1d5db" }
                        : isSelected
                          ? { backgroundColor: "#e65100", color: "#ffffff", borderColor: "#e65100" }
                          : { backgroundColor: "#ffffff", color: "#333333", borderColor: "#d1d5db" }
                    }
                  >
                    {slot}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
            style={{ borderColor: "#d1d5db", color: "#333333", backgroundColor: "#ffffff" }}
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedTime || !selectedSlot || submitting}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: "#e65100", color: "#ffffff" }}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}
