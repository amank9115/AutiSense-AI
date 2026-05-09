import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { type ChildProfileForm, useScreening } from "../context/ScreeningContext"
import { screeningApi } from "../services/api/screeningApi"

const defaultProfile: ChildProfileForm = {
  childName: "",
  age: "",
  dateOfBirth: "",
  gender: "Prefer not to say",
  parentName: "",
  parentPhone: "",
  parentEmail: "",
  homeAddress: "",
  city: "",
  state: "",
  emergencyContact: "",
  medicalNotes: "",
  location: { lat: null, lng: null, capturedAt: null },
}

const ChildProfilePage = () => {
  const navigate = useNavigate()
  const { activeProfile, saveProfile } = useScreening()
  const [form, setForm] = useState<ChildProfileForm>(activeProfile ?? defaultProfile)
  const [locating, setLocating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const update = <K extends keyof ChildProfileForm>(key: K, value: ChildProfileForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.")
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        setError("")
        setForm((current) => ({
          ...current,
          location: {
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6)),
            capturedAt: new Date().toISOString(),
          },
        }))
      },
      () => {
        setLocating(false)
        setError("Unable to capture location. Allow location access and retry.")
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const required: Array<keyof ChildProfileForm> = [
      "childName",
      "age",
      "dateOfBirth",
      "parentName",
      "parentPhone",
      "parentEmail",
      "homeAddress",
      "city",
      "state",
      "emergencyContact",
    ]

    const hasMissing = required.some((key) => !String(form[key]).trim())
    if (hasMissing) {
      setError("Please fill all required fields before starting screening.")
      return
    }

    setSaving(true)
    try {
      await screeningApi.saveChildProfile(form)
      saveProfile(form)
      navigate("/live-screening")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save profile. Try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/60">
        <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">Child Profile Form</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Complete this profile before starting AI screening. It will be saved to the backend database.</p>

        <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
          <input value={form.childName} onChange={(e) => update("childName", e.target.value)} placeholder="Child Name *" className="rounded-xl border border-slate-300 bg-white/85 px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200" />
          <input value={form.age} onChange={(e) => update("age", e.target.value)} placeholder="Age *" className="rounded-xl border border-slate-300 bg-white/85 px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200" />
          <input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} className="rounded-xl border border-slate-300 bg-white/85 px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200" />
          <select value={form.gender} onChange={(e) => update("gender", e.target.value as ChildProfileForm["gender"])} className="rounded-xl border border-slate-300 bg-white/85 px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200">
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
            <option>Prefer not to say</option>
          </select>
          <input value={form.parentName} onChange={(e) => update("parentName", e.target.value)} placeholder="Parent Name *" className="rounded-xl border border-slate-300 bg-white/85 px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200" />
          <input value={form.parentPhone} onChange={(e) => update("parentPhone", e.target.value)} placeholder="Parent Phone *" className="rounded-xl border border-slate-300 bg-white/85 px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200" />
          <input value={form.parentEmail} onChange={(e) => update("parentEmail", e.target.value)} placeholder="Parent Email *" className="rounded-xl border border-slate-300 bg-white/85 px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200" />
          <input value={form.emergencyContact} onChange={(e) => update("emergencyContact", e.target.value)} placeholder="Emergency Contact *" className="rounded-xl border border-slate-300 bg-white/85 px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200" />
          <input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="City *" className="rounded-xl border border-slate-300 bg-white/85 px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200" />
          <input value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="State *" className="rounded-xl border border-slate-300 bg-white/85 px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200" />
          <textarea value={form.homeAddress} onChange={(e) => update("homeAddress", e.target.value)} placeholder="Home Address *" className="md:col-span-2 min-h-[80px] rounded-xl border border-slate-300 bg-white/85 px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200" />
          <textarea value={form.medicalNotes} onChange={(e) => update("medicalNotes", e.target.value)} placeholder="Medical Notes" className="md:col-span-2 min-h-[100px] rounded-xl border border-slate-300 bg-white/85 px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200" />

          <div className="md:col-span-2 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/75 p-3 dark:border-slate-700 dark:bg-slate-950/55">
            <button type="button" onClick={captureLocation} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900" disabled={locating}>
              {locating ? "Capturing location..." : "Capture Location"}
            </button>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {form.location.lat && form.location.lng
                ? `Lat ${form.location.lat}, Lng ${form.location.lng}`
                : "Location not captured yet."}
            </p>
          </div>

          {error && <p className="md:col-span-2 text-sm text-rose-600 dark:text-rose-300">{error}</p>}

          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => navigate("/parent-dashboard")} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-slate-600 dark:text-slate-200">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? "Saving..." : "Save and Start Screening"}
            </button>
          </div>
        </form>
      </motion.div>
    </section>
  )
}

export default ChildProfilePage
