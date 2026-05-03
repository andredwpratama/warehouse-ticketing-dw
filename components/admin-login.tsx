"use client"

import { useState } from "react"
import { Lock, User, Eye, EyeOff } from "lucide-react"
import { TriatraLogo } from "./triatra-logo"
import type { AppView } from "@/lib/types"

interface AdminLoginProps {
  onNavigate: (view: AppView) => void
  onLogin: () => void
}

export function AdminLogin({ onNavigate, onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  function handleLogin() {
    if (username === "admin" && password === "whsjkttriatra") {
      onLogin()
    } else {
      setError("Username atau password salah.")
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ backgroundColor: "#f4f6f9" }}
    >
      <div
        className="w-full max-w-sm rounded-xl border p-8 shadow-md"
        style={{ backgroundColor: "#ffffff", borderColor: "#d1d5db" }}
      >
        <div className="mb-6 flex justify-center">
          <TriatraLogo />
        </div>
        <h2 className="mb-1 text-center text-xl font-bold" style={{ color: "#111111" }}>
          Admin Login
        </h2>
        <p className="mb-6 text-center text-sm" style={{ color: "#555555" }}>
          Masuk ke panel administrasi
        </p>

        {error && (
          <div
            className="mb-4 rounded-lg px-4 py-3 text-sm font-medium"
            style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
          >
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium" style={{ color: "#333333" }}>
              <User className="h-4 w-4" style={{ color: "#e65100" }} />
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Masukkan username"
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2"
              style={{ borderColor: "#d1d5db", color: "#111111" }}
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium" style={{ color: "#333333" }}>
              <Lock className="h-4 w-4" style={{ color: "#e65100" }} />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Masukkan password"
                className="w-full rounded-lg border px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2"
                style={{ borderColor: "#d1d5db", color: "#111111" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" style={{ color: "#555555" }} />
                ) : (
                  <Eye className="h-4 w-4" style={{ color: "#555555" }} />
                )}
              </button>
            </div>
          </div>
          <button
            onClick={handleLogin}
            className="mt-2 w-full rounded-lg px-4 py-3 text-sm font-semibold shadow-md transition-all hover:shadow-lg"
            style={{ backgroundColor: "#e65100", color: "#ffffff" }}
          >
            Masuk
          </button>
        </div>

        <button
          onClick={() => onNavigate("landing")}
          className="mt-4 w-full text-center text-sm font-medium transition-colors"
          style={{ color: "#0056b3" }}
        >
          Kembali ke Beranda
        </button>
      </div>
    </div>
  )
}
