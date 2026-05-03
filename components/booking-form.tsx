"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ArrowLeft,
  Mail,
  User,
  Package,
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
  Printer,
  Loader2,
} from "lucide-react"
import { TriatraLogo } from "./triatra-logo"
import type { Ticket, AppView } from "@/lib/types"
import { TIME_PERIODS, SLOT_LIST } from "@/lib/types"
import { fetchBookedSlots, getMinBookingDate, createTicket } from "@/lib/storage"

interface BookingFormProps {
  onNavigate: (view: AppView) => void
}

export function BookingForm({ onNavigate }: BookingFormProps) {
  const minDate = getMinBookingDate()
  const defaultDate = minDate.toISOString().split("T")[0]

  const [email, setEmail] = useState("")
  const [vendorName, setVendorName] = useState("")
  const [pic, setPic] = useState("")
  const [jumlahPO, setJumlahPO] = useState("")
  const [jumlahKoli, setJumlahKoli] = useState("")
  const [jumlahItem, setJumlahItem] = useState("")
  const [jumlahQuantity, setJumlahQuantity] = useState("")
  const [selectedDate, setSelectedDate] = useState(defaultDate)
  const [selectedTime, setSelectedTime] = useState("")
  const [selectedSlot, setSelectedSlot] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

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

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!email.trim()) newErrors.email = "Email wajib diisi"
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Format email tidak valid"
    if (!vendorName.trim()) newErrors.vendorName = "Nama vendor wajib diisi"
    if (!pic.trim()) newErrors.pic = "PIC wajib diisi"
    if (!jumlahPO || parseInt(jumlahPO) <= 0) newErrors.jumlahPO = "Jumlah PO harus > 0"
    if (!jumlahKoli || parseInt(jumlahKoli) <= 0) newErrors.jumlahKoli = "Jumlah Koli harus > 0"
    if (!jumlahItem || parseInt(jumlahItem) <= 0) newErrors.jumlahItem = "Jumlah Item harus > 0"
    if (!jumlahQuantity || parseInt(jumlahQuantity) <= 0) newErrors.jumlahQuantity = "Jumlah Quantity harus > 0"
    if (!selectedTime) newErrors.time = "Pilih waktu pengiriman"
    if (!selectedSlot) newErrors.slot = "Pilih slot"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleShowConfirm() {
    if (validate()) setShowConfirm(true)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError("")
    try {
      const ticket = await createTicket({
        vendorName: vendorName.trim(),
        email: email.trim(),
        pic: pic.trim(),
        jumlahPO: parseInt(jumlahPO),
        jumlahKoli: parseInt(jumlahKoli),
        jumlahItem: parseInt(jumlahItem),
        jumlahQuantity: parseInt(jumlahQuantity),
        date: selectedDate,
        time: selectedTime,
        slot: selectedSlot,
      })
      setCreatedTicket(ticket)
      setShowConfirm(false)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Gagal membuat tiket")
    } finally {
      setSubmitting(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  // Success Screen
  if (createdTicket) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4" style={{ backgroundColor: "#f4f6f9" }}>
        <div
          className="w-full max-w-md rounded-xl border p-8 text-center shadow-md"
          style={{ backgroundColor: "#ffffff", borderColor: "#d1d5db" }}
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: "#dcfce7" }}
          >
            <CheckCircle2 className="h-8 w-8" style={{ color: "#16a34a" }} />
          </div>
          <h2 className="mb-2 text-2xl font-bold" style={{ color: "#111111" }}>
            Tiket Berhasil Dibuat!
          </h2>
          <p className="mb-6 text-sm" style={{ color: "#555555" }}>
            Simpan nomor tiket Anda untuk pelacakan.
          </p>
          <div
            className="mb-6 rounded-lg p-4"
            style={{ backgroundColor: "#fff3e0" }}
          >
            <p className="text-xs font-medium" style={{ color: "#555555" }}>
              Nomor Tiket
            </p>
            <p className="text-xl font-bold" style={{ color: "#e65100" }}>
              {createdTicket.id}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 text-left text-sm">
            <div>
              <p style={{ color: "#555555" }}>Vendor</p>
              <p className="font-medium" style={{ color: "#111111" }}>{createdTicket.vendorName}</p>
            </div>
            <div>
              <p style={{ color: "#555555" }}>PIC</p>
              <p className="font-medium" style={{ color: "#111111" }}>{createdTicket.pic}</p>
            </div>
            <div>
              <p style={{ color: "#555555" }}>Tanggal</p>
              <p className="font-medium" style={{ color: "#111111" }}>{createdTicket.date}</p>
            </div>
            <div>
              <p style={{ color: "#555555" }}>Waktu</p>
              <p className="font-medium" style={{ color: "#111111" }}>{createdTicket.time}</p>
            </div>
            <div>
              <p style={{ color: "#555555" }}>Slot</p>
              <p className="font-medium" style={{ color: "#111111" }}>{createdTicket.slot}</p>
            </div>
            <div>
              <p style={{ color: "#555555" }}>Email</p>
              <p className="font-medium" style={{ color: "#111111" }}>{createdTicket.email}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors"
              style={{ backgroundColor: "#e65100", color: "#ffffff" }}
            >
              <Printer className="h-4 w-4" />
              Cetak Tiket
            </button>
            <button
              onClick={() => onNavigate("landing")}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors"
              style={{ borderColor: "#d1d5db", color: "#333333", backgroundColor: "#ffffff" }}
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Confirmation Modal
  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div
          className="w-full max-w-md rounded-xl p-6 shadow-xl"
          style={{ backgroundColor: "#ffffff" }}
        >
          <h2 className="mb-4 text-lg font-bold" style={{ color: "#111111" }}>
            Konfirmasi Pemesanan
          </h2>
          {submitError && (
            <div className="mb-4 rounded-lg px-4 py-3 text-sm font-medium" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>
              {submitError}
            </div>
          )}
          <div className="mb-5 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p style={{ color: "#555555" }}>Vendor</p>
              <p className="font-medium" style={{ color: "#111111" }}>{vendorName}</p>
            </div>
            <div>
              <p style={{ color: "#555555" }}>Email</p>
              <p className="font-medium" style={{ color: "#111111" }}>{email}</p>
            </div>
            <div>
              <p style={{ color: "#555555" }}>PIC</p>
              <p className="font-medium" style={{ color: "#111111" }}>{pic}</p>
            </div>
            <div>
              <p style={{ color: "#555555" }}>Tanggal</p>
              <p className="font-medium" style={{ color: "#111111" }}>{selectedDate}</p>
            </div>
            <div>
              <p style={{ color: "#555555" }}>Waktu</p>
              <p className="font-medium" style={{ color: "#111111" }}>{selectedTime}</p>
            </div>
            <div>
              <p style={{ color: "#555555" }}>Slot</p>
              <p className="font-medium" style={{ color: "#111111" }}>{selectedSlot}</p>
            </div>
            <div>
              <p style={{ color: "#555555" }}>Jumlah PO</p>
              <p className="font-medium" style={{ color: "#111111" }}>{jumlahPO}</p>
            </div>
            <div>
              <p style={{ color: "#555555" }}>Jumlah Koli</p>
              <p className="font-medium" style={{ color: "#111111" }}>{jumlahKoli}</p>
            </div>
            <div>
              <p style={{ color: "#555555" }}>Jumlah Item</p>
              <p className="font-medium" style={{ color: "#111111" }}>{jumlahItem}</p>
            </div>
            <div>
              <p style={{ color: "#555555" }}>Jumlah Quantity</p>
              <p className="font-medium" style={{ color: "#111111" }}>{jumlahQuantity}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowConfirm(false); setSubmitError(""); }}
              className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors"
              style={{ borderColor: "#d1d5db", color: "#333333", backgroundColor: "#ffffff" }}
            >
              Kembali
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
              style={{ backgroundColor: "#e65100", color: "#ffffff" }}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Konfirmasi & Buat Tiket
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "#f4f6f9" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between border-b px-4 py-2 shadow-sm md:px-8"
        style={{ backgroundColor: "#ffffff", borderColor: "#d1d5db" }}
      >
        <TriatraLogo />
        <button
          onClick={() => onNavigate("landing")}
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: "#e65100" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>
      </header>

      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-5 text-xl font-bold md:text-2xl" style={{ color: "#111111" }}>
            Buat Tiket Pengiriman
          </h1>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Left - Form Inputs */}
            <div
              className="rounded-xl border p-5 shadow-sm"
              style={{ backgroundColor: "#ffffff", borderColor: "#d1d5db" }}
            >
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: "#111111" }}>
                <Package className="h-4 w-4" style={{ color: "#e65100" }} />
                Informasi Pengiriman
              </h2>
              <div className="flex flex-col gap-3">
                <InputField
                  label="Email"
                  icon={<Mail className="h-3.5 w-3.5" style={{ color: "#e65100" }} />}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  error={errors.email}
                  placeholder="vendor@perusahaan.com"
                />
                <InputField
                  label="Nama Vendor"
                  icon={<User className="h-3.5 w-3.5" style={{ color: "#e65100" }} />}
                  value={vendorName}
                  onChange={setVendorName}
                  error={errors.vendorName}
                  placeholder="PT Nama Vendor"
                />
                <InputField
                  label="PIC (Penanggung Jawab)"
                  icon={<User className="h-3.5 w-3.5" style={{ color: "#e65100" }} />}
                  value={pic}
                  onChange={setPic}
                  error={errors.pic}
                  placeholder="Nama penanggung jawab"
                />
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Jumlah PO"
                    type="number"
                    value={jumlahPO}
                    onChange={setJumlahPO}
                    error={errors.jumlahPO}
                    placeholder="0"
                  />
                  <InputField
                    label="Jumlah Koli"
                    type="number"
                    value={jumlahKoli}
                    onChange={setJumlahKoli}
                    error={errors.jumlahKoli}
                    placeholder="0"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Jumlah Item"
                    type="number"
                    value={jumlahItem}
                    onChange={setJumlahItem}
                    error={errors.jumlahItem}
                    placeholder="0"
                  />
                  <InputField
                    label="Jumlah Quantity"
                    type="number"
                    value={jumlahQuantity}
                    onChange={setJumlahQuantity}
                    error={errors.jumlahQuantity}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Right - Date & Time Selection */}
            <div
              className="rounded-xl border p-5 shadow-sm"
              style={{ backgroundColor: "#ffffff", borderColor: "#d1d5db" }}
            >
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: "#111111" }}>
                <CalendarDays className="h-4 w-4" style={{ color: "#e65100" }} />
                Jadwal Pengiriman
              </h2>

              {/* Date */}
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium" style={{ color: "#333333" }}>
                  Tanggal (H+2 dari hari ini)
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
                  className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2"
                  style={{ borderColor: "#d1d5db", color: "#111111" }}
                />
              </div>

              {/* Time Periods */}
              <div className="mb-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium" style={{ color: "#333333" }}>
                  <Clock className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
                  Waktu Pengiriman
                </label>
                {errors.time && (
                  <p className="mb-2 text-xs" style={{ color: "#dc2626" }}>{errors.time}</p>
                )}
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
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium" style={{ color: "#333333" }}>
                    <MapPin className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
                    Pilih Slot
                  </label>
                  {errors.slot && (
                    <p className="mb-2 text-xs" style={{ color: "#dc2626" }}>{errors.slot}</p>
                  )}
                  <div className="grid grid-cols-5 gap-2">
                    {SLOT_LIST.map((slot) => {
                      const isBooked = bookedSlots.includes(slot)
                      const isSelected = selectedSlot === slot
                      return (
                        <button
                          key={slot}
                          disabled={isBooked}
                          onClick={() => setSelectedSlot(slot)}
                          className="rounded-lg border py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed"
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
                  <p className="mt-2 text-xs" style={{ color: "#555555" }}>
                    Slot abu-abu sudah terisi.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-5 flex justify-end">
            <button
              onClick={handleShowConfirm}
              className="rounded-lg px-8 py-2.5 text-sm font-semibold shadow-md transition-all hover:shadow-lg"
              style={{ backgroundColor: "#e65100", color: "#ffffff" }}
            >
              Lanjutkan
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

function InputField({
  label,
  icon,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string
  icon?: React.ReactNode
  type?: string
  value: string
  onChange: (val: string) => void
  error?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-sm font-medium" style={{ color: "#333333" }}>
        {icon}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2"
        style={{ borderColor: error ? "#dc2626" : "#d1d5db", color: "#111111" }}
      />
      {error && (
        <p className="mt-1 text-xs" style={{ color: "#dc2626" }}>
          {error}
        </p>
      )}
    </div>
  )
}
