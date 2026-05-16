"use client";
import { useState } from "react"
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

const navLinks = [
  { label: "Landing", to: "/" },
  { label: "How It Works", to: "/how-it-works" },
  { label: "Features", to: "/features" },
  { label: "Technology", to: "/technology" },
  { label: "Caregivers", to: "/caregivers" },
  { label: "Clinicians", to: "/clinicians" },
  { label: "Impact", to: "/impact" },
  { label: "About", to: "/about" },
  { label: "Roadmap", to: "/roadmap" },
]

const linkBase =
  "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition"

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-sky-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200">
            <span className="text-sm font-semibold">N</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">NEUROLYTIX-AI</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Care Intelligence
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-2 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              href={link.to}
              className={
                `${linkBase} ${
                  pathname === link.to
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={() => router.push(user?.role === "doctor" ? "/dashboard/doctor/profile" : "/dashboard/parent/profile")}
                className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-100"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M5 19C6.4 15.8 9 14.4 12 14.4C15 14.4 17.6 15.8 19 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                {user.name}
              </button>
              <button
                onClick={() => { logout(); router.push("/"); }}
                className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-rose-200 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="hidden rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 sm:inline-flex"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => router.push("/signup")}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Create Account
              </button>
            </>
          )}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="relative h-4 w-4">
              <span
                className={`absolute left-0 top-0 h-0.5 w-4 bg-current transition ${
                  isOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-2 h-0.5 w-4 bg-current transition ${
                  isOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-4 h-0.5 w-4 bg-current transition ${
                  isOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        } lg:hidden`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <div
        id="mobile-navigation"
        className={`fixed left-4 right-4 top-24 z-40 rounded-3xl border border-white/60 bg-white/95 p-6 shadow-xl transition ${
          isOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"
        } lg:hidden`}
      >
        <nav className="flex flex-col gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.to;
            return (
            <Link
              key={link.to}
              href={link.to}
              onClick={() => setIsOpen(false)}
              className={`${linkBase} text-left ${
                  isActive
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              {link.label}
            </Link>
          )})}
        </nav>
        <div className="mt-6 flex flex-col gap-3">
          {user ? (
            <>
              <button
                onClick={() => { router.push(user?.role === "doctor" ? "/dashboard/doctor/profile" : "/dashboard/parent/profile"); setIsOpen(false); }}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-100"
              >
                {user.name}
              </button>
              <button
                onClick={() => { logout(); router.push("/"); setIsOpen(false); }}
                className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-rose-200 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { router.push("/login"); setIsOpen(false); }}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-100"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { router.push("/signup"); setIsOpen(false); }}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-slate-300 transition"
              >
                Create Account
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
