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
  Plus,
  X,
  StickyNote,
} from "lucide-react"
import { TriatraLogo } from "./triatra-logo"
import type { POEntry, AppView } from "@/lib/types"
import { TIME_PERIODS, SLOT_LIST } from "@/lib/types"
import { fetchBookedSlots, getMinBookingDate, createTicket } from "@/lib/storage"

interface BookingFormProps {
  onNavigate: (view: AppView) => void
}

function emptyPOEntry(): POEntry {
  return { nomorPO: "", deskripsiBarang: "", jumlahKoli: 0, jumlahItem: 0, jumlahQuantity: 0 }
}

export function BookingForm({ onNavigate }: BookingFormProps) {
  const minDate = getMinBookingDate()
  const defaultDate = minDate.toISOString().split("T")[0]

  const [email, setEmail] = useState("")
  const [vendorName, setVendorName] = useState("")
  const [pic, setPic] = useState("")
  const [notes, setNotes] = useState("")
  const [poCount, setPoCount] = useState<number | "">("") // blank until user types
  const [poEntries, setPoEntries] = useState<POEntry[]>([])
  const [selectedDate, setSelectedDate] = useState(defaultDate)
  const [selectedTime, setSelectedTime] = useState("")
  const [selectedSlot, setSelectedSlot] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [createdTickets, setCreatedTickets] = useState<{ id: string; slot: string }[] | null>(null)
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
    setSelectedSlot("")
  }, [loadSlots])

  // Compute which starting slots are valid (have enough consecutive free slots)
  function getRequiredSlots(startingSlot: string): string[] {
    const idx = SLOT_LIST.indexOf(startingSlot as typeof SLOT_LIST[number])
    if (idx === -1) return []
    return Array.from(SLOT_LIST.slice(idx, idx + poEntries.length))
  }

  function isStartingSlotValid(slot: string): boolean {
    const required = getRequiredSlots(slot)
    if (required.length < poEntries.length) return false
    return required.every((s) => !bookedSlots.includes(s))
  }

  const requiredSlotsPreview = selectedSlot ? getRequiredSlots(selectedSlot) : []

  function updatePOEntry(index: number, field: keyof POEntry, value: string | number | boolean) {
    setPoEntries((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)))
  }

  function handlePoCountChange(raw: string) {
    if (raw === "") {
      setPoCount("")
      setPoEntries([])
      setSelectedSlot("")
      return
    }
    const n = Math.max(1, Math.min(10, parseInt(raw) || 1))
    setPoCount(n)
    setPoEntries((prev) => {
      if (n > prev.length) return [...prev, ...Array.from({ length: n - prev.length }, emptyPOEntry)]
      return prev.slice(0, n)
    })
    setSelectedSlot("")
  }

  function addPOEntry() {
    if (poEntries.length >= 10) return
    const next = poEntries.length + 1
    setPoCount(next)
    setPoEntries((prev) => [...prev, emptyPOEntry()])
    setSelectedSlot("")
  }

  function removePOEntry(index: number) {
    if (poEntries.length <= 1) return
    const next = poEntries.length - 1
    setPoCount(next)
    setPoEntries((prev) => prev.filter((_, i) => i !== index))
    setSelectedSlot("")
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!email.trim()) newErrors.email = "Email wajib diisi"
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Format email tidak valid"
    if (!vendorName.trim()) newErrors.vendorName = "Nama vendor wajib diisi"
    if (!pic.trim()) newErrors.pic = "PIC wajib diisi"
    if (!poCount || poEntries.length === 0) newErrors.poCount = "Isi jumlah PO terlebih dahulu"

    poEntries.forEach((entry, i) => {
      if (!entry.nomorPO.trim()) newErrors[`po_${i}_nomorPO`] = "Nomor PO wajib diisi"
      if (!entry.deskripsiBarang.trim()) newErrors[`po_${i}_deskripsiBarang`] = "Deskripsi barang wajib diisi"
      if (!entry.jumlahKoli || entry.jumlahKoli <= 0) newErrors[`po_${i}_koli`] = "Harus > 0"
      if (!entry.jumlahItem || entry.jumlahItem <= 0) newErrors[`po_${i}_item`] = "Harus > 0"
      if (!entry.jumlahQuantity || entry.jumlahQuantity <= 0) newErrors[`po_${i}_qty`] = "Harus > 0"
    })

    if (!selectedTime) newErrors.time = "Pilih waktu pengiriman"
    if (!selectedSlot) {
      newErrors.slot = "Pilih slot awal"
    } else if (!isStartingSlotValid(selectedSlot)) {
      newErrors.slot = "Slot tidak cukup atau ada yang sudah terisi"
    }
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
      const tickets = await createTicket({
        vendorName: vendorName.trim(),
        email: email.trim(),
        pic: pic.trim(),
        poEntries,
        notes: notes.trim() || undefined,
        date: selectedDate,
        time: selectedTime,
        startingSlot: selectedSlot,
      })
      setCreatedTickets(tickets.map((t) => ({ id: t.id, slot: t.slot })))
      setShowConfirm(false)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Gagal membuat tiket")
    } finally {
      setSubmitting(false)
    }
  }

  // Success Screen
  if (createdTickets) {
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
            {createdTickets.length > 1
              ? `${createdTickets.length} tiket telah dibuat untuk ${vendorName}.`
              : "Simpan nomor tiket Anda untuk pelacakan."}
          </p>
          <div className="mb-6 flex flex-col gap-2">
            {createdTickets.map((t, i) => (
              <div
                key={t.id}
                className="rounded-lg p-3 text-left"
                style={{ backgroundColor: "#fff3e0" }}
              >
                <p className="text-xs font-medium" style={{ color: "#555555" }}>
                  PO {i + 1} — Slot {t.slot}
                </p>
                <p className="text-base font-bold" style={{ color: "#e65100" }}>
                  {t.id}
                </p>
              </div>
            ))}
          </div>
          <div className="mb-4 text-sm text-left" style={{ color: "#333333" }}>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p style={{ color: "#555555" }}>Vendor</p>
                <p className="font-medium">{vendorName}</p>
              </div>
              <div>
                <p style={{ color: "#555555" }}>Tanggal</p>
                <p className="font-medium">{selectedDate}</p>
              </div>
              <div>
                <p style={{ color: "#555555" }}>Waktu</p>
                <p className="font-medium">{selectedTime}</p>
              </div>
              <div>
                <p style={{ color: "#555555" }}>PIC</p>
                <p className="font-medium">{pic}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold"
              style={{ backgroundColor: "#e65100", color: "#ffffff" }}
            >
              <Printer className="h-4 w-4" />
              Cetak Tiket
            </button>
            <button
              onClick={() => onNavigate("landing")}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold"
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
          className="w-full max-w-lg rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
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

          {/* Vendor Info */}
          <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
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
              <p className="font-medium" style={{ color: "#111111" }}>{requiredSlotsPreview.join(", ")}</p>
            </div>
          </div>
          {notes && (
            <div className="mb-4 text-sm">
              <p style={{ color: "#555555" }}>Catatan</p>
              <p className="font-medium" style={{ color: "#111111" }}>{notes}</p>
            </div>
          )}

          {/* PO Summary */}
          <div className="mb-5 flex flex-col gap-3">
            <p className="text-sm font-semibold" style={{ color: "#333333" }}>Detail PO ({poEntries.length} PO)</p>
            {poEntries.map((entry, i) => (
              <div
                key={i}
                className="rounded-lg border p-3 text-sm"
                style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
              >
                <p className="font-semibold mb-1" style={{ color: "#e65100" }}>PO {i + 1} → Slot {requiredSlotsPreview[i] ?? "?"}</p>
                <div className="grid grid-cols-2 gap-1">
                  <div className="col-span-2">
                    <span style={{ color: "#555555" }}>Nomor PO: </span>
                    <span className="font-medium" style={{ color: "#111111" }}>{entry.nomorPO}</span>
                  </div>
                  <div className="col-span-2">
                    <span style={{ color: "#555555" }}>Deskripsi: </span>
                    <span className="font-medium" style={{ color: "#111111" }}>{entry.deskripsiBarang}</span>
                  </div>
                  {entry.catatanKhusus && (
                    <div className="col-span-2">
                      <span style={{ color: "#555555" }}>Catatan Khusus: </span>
                      <span className="font-medium" style={{ color: "#111111" }}>{entry.catatanKhusus}</span>
                    </div>
                  )}
                  <div>
                    <span style={{ color: "#555555" }}>Koli: </span>
                    <span className="font-medium" style={{ color: "#111111" }}>{entry.jumlahKoli}</span>
                  </div>
                  <div>
                    <span style={{ color: "#555555" }}>Item: </span>
                    <span className="font-medium" style={{ color: "#111111" }}>{entry.jumlahItem}</span>
                  </div>
                  <div>
                    <span style={{ color: "#555555" }}>Quantity: </span>
                    <span className="font-medium" style={{ color: "#111111" }}>{entry.jumlahQuantity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setShowConfirm(false); setSubmitError("") }}
              className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold"
              style={{ borderColor: "#d1d5db", color: "#333333", backgroundColor: "#ffffff" }}
            >
              Kembali
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
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
      <header
        className="flex items-center justify-between border-b px-4 py-2 shadow-sm md:px-8"
        style={{ backgroundColor: "#ffffff", borderColor: "#d1d5db" }}
      >
        <TriatraLogo />
        <button
          onClick={() => onNavigate("landing")}
          className="flex items-center gap-2 text-sm font-medium"
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
            {/* Left Column */}
            <div className="flex flex-col gap-5">
              {/* Vendor Info */}
              <div
                className="rounded-xl border p-5 shadow-sm"
                style={{ backgroundColor: "#ffffff", borderColor: "#d1d5db" }}
              >
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: "#111111" }}>
                  <User className="h-4 w-4" style={{ color: "#e65100" }} />
                  Informasi Vendor
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
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-sm font-medium" style={{ color: "#333333" }}>
                      <StickyNote className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
                      Catatan Pengiriman
                      <span className="text-xs font-normal" style={{ color: "#999999" }}>(opsional)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Informasi tambahan untuk pengiriman ini..."
                      rows={2}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
                      style={{ borderColor: "#d1d5db", color: "#111111" }}
                    />
                  </div>
                </div>
              </div>

              {/* PO Cards */}
              <div
                className="rounded-xl border p-5 shadow-sm"
                style={{ backgroundColor: "#ffffff", borderColor: "#d1d5db" }}
              >
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: "#111111" }}>
                  <Package className="h-4 w-4" style={{ color: "#e65100" }} />
                  Detail PO
                  {poEntries.length > 0 && (
                    <span className="ml-auto text-xs font-normal" style={{ color: "#555555" }}>
                      {poEntries.length}/10 PO
                    </span>
                  )}
                </h2>

                {/* Step 1: jumlah PO input */}
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium" style={{ color: "#333333" }}>
                    Jumlah PO yang dibawa
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={poCount}
                      onChange={(e) => handlePoCountChange(e.target.value)}
                      placeholder="Contoh: 2"
                      className="w-28 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                      style={{ borderColor: errors.poCount ? "#dc2626" : "#d1d5db", color: "#111111" }}
                    />
                    {poEntries.length > 0 && (
                      <span className="text-xs" style={{ color: "#555555" }}>
                        {poEntries.length} form PO siap diisi
                      </span>
                    )}
                  </div>
                  {errors.poCount && (
                    <p className="mt-1 text-xs" style={{ color: "#dc2626" }}>{errors.poCount}</p>
                  )}
                  {!poCount && (
                    <p className="mt-1 text-xs" style={{ color: "#9ca3af" }}>
                      Isi jumlah PO terlebih dahulu untuk menampilkan form detail
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  {poEntries.map((entry, i) => (
                    <div
                      key={i}
                      className="rounded-lg border p-4"
                      style={{ borderColor: "#e5e7eb", backgroundColor: "#fafafa" }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold" style={{ color: "#e65100" }}>
                          PO {i + 1}
                        </span>
                        {poEntries.length > 1 && (
                          <button
                            onClick={() => removePOEntry(i)}
                            className="flex items-center justify-center h-6 w-6 rounded-full transition-colors"
                            style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col gap-2.5">
                        <InputField
                          label="Nomor PO"
                          value={entry.nomorPO}
                          onChange={(v) => updatePOEntry(i, "nomorPO", v)}
                          error={errors[`po_${i}_nomorPO`]}
                          placeholder="Contoh: PO-2026-001"
                        />
                        <InputField
                          label="Deskripsi Barang"
                          value={entry.deskripsiBarang}
                          onChange={(v) => updatePOEntry(i, "deskripsiBarang", v)}
                          error={errors[`po_${i}_deskripsiBarang`]}
                          placeholder="Contoh: Spare part mesin, Chemical drum..."
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <InputField
                            label="Jumlah Koli"
                            type="number"
                            value={entry.jumlahKoli === 0 ? "" : String(entry.jumlahKoli)}
                            onChange={(v) => updatePOEntry(i, "jumlahKoli", parseInt(v) || 0)}
                            error={errors[`po_${i}_koli`]}
                            placeholder="0"
                          />
                          <InputField
                            label="Jumlah Item"
                            type="number"
                            value={entry.jumlahItem === 0 ? "" : String(entry.jumlahItem)}
                            onChange={(v) => updatePOEntry(i, "jumlahItem", parseInt(v) || 0)}
                            error={errors[`po_${i}_item`]}
                            placeholder="0"
                          />
                          <InputField
                            label="Jumlah Qty"
                            type="number"
                            value={entry.jumlahQuantity === 0 ? "" : String(entry.jumlahQuantity)}
                            onChange={(v) => updatePOEntry(i, "jumlahQuantity", parseInt(v) || 0)}
                            error={errors[`po_${i}_qty`]}
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium" style={{ color: "#333333" }}>
                            Catatan Khusus
                            <span className="text-xs font-normal" style={{ color: "#9ca3af" }}>(opsional)</span>
                          </label>
                          <input
                            type="text"
                            value={entry.catatanKhusus ?? ""}
                            onChange={(e) => updatePOEntry(i, "catatanKhusus", e.target.value)}
                            placeholder="Contoh: Butuh forklift, fragile, handle with care..."
                            className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                            style={{ borderColor: "#d1d5db", color: "#111111" }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {poEntries.length < 10 && (
                    <button
                      onClick={addPOEntry}
                      className="flex items-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm font-medium transition-colors w-full justify-center"
                      style={{ borderColor: "#d1d5db", color: "#555555" }}
                    >
                      <Plus className="h-4 w-4" />
                      Tambah PO
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Schedule */}
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
                  <label className="mb-1 flex items-center gap-2 text-sm font-medium" style={{ color: "#333333" }}>
                    <MapPin className="h-3.5 w-3.5" style={{ color: "#e65100" }} />
                    Pilih Slot Awal
                  </label>
                  <p className="mb-2 text-xs" style={{ color: "#555555" }}>
                    {poEntries.length > 1
                      ? `Sistem akan otomatis memesan ${poEntries.length} slot berurutan.`
                      : "Pilih slot untuk PO Anda."}
                  </p>
                  {errors.slot && (
                    <p className="mb-2 text-xs" style={{ color: "#dc2626" }}>{errors.slot}</p>
                  )}

                  {/* Slot preview */}
                  {selectedSlot && requiredSlotsPreview.length > 0 && (
                    <div
                      className="mb-3 rounded-lg px-3 py-2 text-xs font-medium"
                      style={{ backgroundColor: "#fff3e0", color: "#e65100" }}
                    >
                      Slot yang akan dipesan: {requiredSlotsPreview.join(" → ")}
                    </div>
                  )}

                  <div className="grid grid-cols-5 gap-2">
                    {SLOT_LIST.map((slot) => {
                      const isBooked = bookedSlots.includes(slot)
                      const isValid = !isBooked && isStartingSlotValid(slot)
                      const isSelected = selectedSlot === slot
                      const isInRange = requiredSlotsPreview.includes(slot) && !isSelected

                      return (
                        <button
                          key={slot}
                          disabled={isBooked || (!isValid && !isSelected)}
                          onClick={() => setSelectedSlot(isSelected ? "" : slot)}
                          className="rounded-lg border py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed"
                          style={
                            isBooked
                              ? { backgroundColor: "#e8eaed", color: "#999999", borderColor: "#d1d5db" }
                              : isSelected
                                ? { backgroundColor: "#e65100", color: "#ffffff", borderColor: "#e65100" }
                                : isInRange
                                  ? { backgroundColor: "#ffedd5", color: "#c2410c", borderColor: "#fb923c" }
                                  : !isValid
                                    ? { backgroundColor: "#f3f4f6", color: "#9ca3af", borderColor: "#e5e7eb" }
                                    : { backgroundColor: "#ffffff", color: "#333333", borderColor: "#d1d5db" }
                          }
                        >
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs" style={{ color: "#555555" }}>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: "#e8eaed" }} />
                      Terisi
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: "#e65100" }} />
                      Dipilih
                    </span>
                    {poEntries.length > 1 && (
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-3 w-3 rounded border" style={{ backgroundColor: "#ffedd5", borderColor: "#fb923c" }} />
                        Akan dipesan
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
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
        min={type === "number" ? "0" : undefined}
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
