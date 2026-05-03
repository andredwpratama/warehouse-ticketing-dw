"use client"

import { useState } from "react"
import { LandingPage } from "@/components/landing-page"
import { BookingForm } from "@/components/booking-form"
import { AdminLogin } from "@/components/admin-login"
import { AdminDashboard } from "@/components/admin-dashboard"
import type { AppView } from "@/lib/types"

export default function Home() {
  const [view, setView] = useState<AppView>("landing")
  const [isAdmin, setIsAdmin] = useState(false)

  function navigate(newView: AppView) {
    setView(newView)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleLogin() {
    setIsAdmin(true)
    navigate("admin-dashboard")
  }

  function handleLogout() {
    setIsAdmin(false)
    navigate("landing")
  }

  switch (view) {
    case "landing":
      return <LandingPage onNavigate={navigate} />
    case "booking":
      return <BookingForm onNavigate={navigate} />
    case "admin-login":
      return isAdmin ? (
        <AdminDashboard onNavigate={navigate} onLogout={handleLogout} />
      ) : (
        <AdminLogin onNavigate={navigate} onLogin={handleLogin} />
      )
    case "admin-dashboard":
      return isAdmin ? (
        <AdminDashboard onNavigate={navigate} onLogout={handleLogout} />
      ) : (
        <AdminLogin onNavigate={navigate} onLogin={handleLogin} />
      )
    default:
      return <LandingPage onNavigate={navigate} />
  }
}
