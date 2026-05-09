import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion"
import { useEffect, useState, type FormEvent } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import ToastStack, { type ToastItem } from "../components/ui/ToastStack"
import { useAuth } from "../context/AuthContext"
import { authApi, type AuthRole } from "../services/authApi"

type Mode = "login" | "register"

const EyeFace = ({
  eyeX,
  eyeY,
  eyesClosed,
}: {
  eyeX: ReturnType<typeof useSpring>
  eyeY: ReturnType<typeof useSpring>
  eyesClosed: boolean
}) => (
  <div className="relative mx-auto h-56 w-56">
    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-100 via-sky-100 to-emerald-100" />
    <div className="absolute left-[46px] top-[88px] h-9 w-7 rounded-full bg-[#f4c9ae]" />
    <div className="absolute right-[46px] top-[88px] h-9 w-7 rounded-full bg-[#f4c9ae]" />
    <div className="absolute left-1/2 top-1/2 h-[182px] w-[146px] -translate-x-1/2 -translate-y-1/2 rounded-[64px] border border-slate-200 bg-[linear-gradient(180deg,#f7d6c1_0%,#efc1a2_100%)] shadow-sm" />
    <div className="absolute left-1/2 top-[66px] h-[74px] w-[138px] -translate-x-1/2 rounded-[42px] bg-[linear-gradient(180deg,#0f172a_0%,#334155_100%)]" />
    <div className="absolute left-[70px] top-[112px] h-10 w-10 rounded-full bg-white shadow-[0_2px_8px_rgba(15,23,42,0.14)]">
      {!eyesClosed && <motion.div className="absolute left-3 top-3 h-4 w-4 rounded-full bg-slate-900" style={{ x: eyeX, y: eyeY }} />}
      <motion.div
        className="absolute left-0 top-0 h-full w-full rounded-full bg-[linear-gradient(180deg,#f5d1ba_0%,#efc1a2_100%)]"
        animate={{ scaleY: eyesClosed ? 1 : 0.05, y: eyesClosed ? 0 : -18 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      />
    </div>
    <div className="absolute right-[70px] top-[112px] h-10 w-10 rounded-full bg-white shadow-[0_2px_8px_rgba(15,23,42,0.14)]">
      {!eyesClosed && <motion.div className="absolute left-3 top-3 h-4 w-4 rounded-full bg-slate-900" style={{ x: eyeX, y: eyeY }} />}
      <motion.div
        className="absolute left-0 top-0 h-full w-full rounded-full bg-[linear-gradient(180deg,#f5d1ba_0%,#efc1a2_100%)]"
        animate={{ scaleY: eyesClosed ? 1 : 0.05, y: eyesClosed ? 0 : -18 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      />
    </div>
    <div className="absolute left-[84px] top-[100px] h-1.5 w-8 rounded-full bg-[#a45f46]" />
    <div className="absolute right-[84px] top-[100px] h-1.5 w-8 rounded-full bg-[#a45f46]" />
    <div className="absolute left-1/2 top-[146px] h-[16px] w-[8px] -translate-x-1/2 rounded-full bg-[#deaa8b]" />
    <motion.div
      className="absolute left-1/2 top-[168px] h-2 w-[56px] -translate-x-1/2 rounded-full bg-[#b66b52]"
      animate={{ scaleX: eyesClosed ? 0.9 : 1 }}
      transition={{ duration: 0.25 }}
    />
  </div>
)

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [searchParams] = useSearchParams()
  const initialMode: Mode = searchParams.get("mode") === "register" ? "register" : "login"

  const [mode, setMode] = useState<Mode>(initialMode)
  const [role, setRole] = useState<AuthRole>("parent")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [countryCode, setCountryCode] = useState("+91")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotNewPassword, setForgotNewPassword] = useState("")
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [passwordFocus, setPasswordFocus] = useState(false)

  const eyeXRaw = useMotionValue(0)
  const eyeYRaw = useMotionValue(0)
  const eyeX = useSpring(eyeXRaw, { stiffness: 260, damping: 24 })
  const eyeY = useSpring(eyeYRaw, { stiffness: 260, damping: 24 })
  const eyesClosed = passwordFocus

  useEffect(() => {
    let raf = 0
    const onMove = (event: MouseEvent) => {
      const factor = eyesClosed ? -1 : 1
      const x = Math.max(-2.8, Math.min(2.8, (event.clientX / window.innerWidth - 0.5) * 7 * factor))
      const y = Math.max(-2.2, Math.min(2.2, (event.clientY / window.innerHeight - 0.5) * 6 * factor))
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        eyeXRaw.set(x)
        eyeYRaw.set(y)
      })
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    return () => {
      window.removeEventListener("mousemove", onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [eyeXRaw, eyeYRaw, eyesClosed])

  const pushToast = (type: ToastItem["type"], message: string) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((current) => [...current, { id, type, message }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 2600)
  }

  const routeAfterAuth = (userRole: AuthRole) => {
    navigate(userRole === "parent" ? "/parent-dashboard" : "/doctor-dashboard")
  }

  const submitLogin = async () => {
    setLoading(true)
    try {
      const result = await authApi.loginWithPassword(email, password, role, name.trim() || undefined)
      login(result.user.name, result.user.role)
      pushToast("success", "Login successful")
      setTimeout(() => routeAfterAuth(result.user.role), 450)
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const submitRegister = async () => {
    setLoading(true)
    try {
      await authApi.registerUser({
        name,
        email,
        phone: `${countryCode}${phone}`,
        password,
        confirmPassword,
        role,
      })
      pushToast("success", "Registered successfully. Please login.")
      setMode("login")
      setPassword("")
      setConfirmPassword("")
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const submitForgot = async () => {
    setLoading(true)
    try {
      await authApi.forgotPassword({
        email: email.trim(),
        role,
        newPassword: forgotNewPassword,
        confirmPassword: forgotConfirmPassword,
      })
      pushToast("success", "Password reset successful. Please login.")
      setForgotMode(false)
      setForgotNewPassword("")
      setForgotConfirmPassword("")
      setPassword("")
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Password reset failed")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (mode === "register") {
      void submitRegister()
      return
    }
    if (forgotMode) {
      void submitForgot()
      return
    }
    void submitLogin()
  }

  return (
    <section className="mx-auto min-h-[calc(100vh-10rem)] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ToastStack toasts={toasts} />

      <div className="grid items-stretch gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-sky-50 p-6"
        >
          <p className="text-xs tracking-[0.14em] text-sky-700 uppercase">ManasSaathi</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">Calm, guided access.</h1>
          <p className="mt-2 max-w-sm text-sm text-slate-600">Move your cursor and the assistant follows your focus.</p>
          <div className="mt-8">
            <EyeFace eyeX={eyeX} eyeY={eyeY} eyesClosed={eyesClosed} />
          </div>
        </motion.aside>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <p className="text-xs tracking-[0.14em] text-sky-700 uppercase">Secure Access</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{mode === "login" ? "Login" : "Create account"}</h2>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <div className="flex rounded-lg border border-slate-200 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login")
                  setForgotMode(false)
                }}
                className={`flex-1 rounded-md py-2 text-sm ${mode === "login" ? "bg-slate-900 text-white" : "text-slate-600"}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register")
                  setForgotMode(false)
                }}
                className={`flex-1 rounded-md py-2 text-sm ${mode === "register" ? "bg-slate-900 text-white" : "text-slate-600"}`}
              >
                Register
              </button>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Role</span>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as AuthRole)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400"
              >
                <option value="parent">Parent</option>
                <option value="doctor">Doctor</option>
              </select>
            </label>

            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <motion.div key="login" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Name (optional)"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400"
                  />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400"
                  />

                  {forgotMode ? (
                    <>
                      <input
                        type="password"
                        value={forgotNewPassword}
                        onChange={(event) => setForgotNewPassword(event.target.value)}
                        onFocus={() => setPasswordFocus(true)}
                        onBlur={() => setPasswordFocus(false)}
                        placeholder="New password"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400"
                      />
                      <input
                        type="password"
                        value={forgotConfirmPassword}
                        onChange={(event) => setForgotConfirmPassword(event.target.value)}
                        onFocus={() => setPasswordFocus(true)}
                        onBlur={() => setPasswordFocus(false)}
                        placeholder="Confirm new password"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400"
                      />
                      <button type="submit" className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                        {loading ? "Resetting..." : "Reset password"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setForgotMode(false)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                      >
                        Back to login
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        onFocus={() => setPasswordFocus(true)}
                        onBlur={() => setPasswordFocus(false)}
                        placeholder="Password"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400"
                      />
                      <button type="button" onClick={() => setForgotMode(true)} className="text-xs font-medium text-sky-700">
                        Forgot password?
                      </button>
                      <button type="submit" className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                        {loading ? "Signing in..." : "Sign in"}
                      </button>
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div key="register" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Full name"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400"
                  />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400"
                  />
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(event) => setCountryCode(event.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-800 outline-none focus:border-sky-400"
                    >
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                    </select>
                    <input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
                      placeholder="Phone number"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400"
                    />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onFocus={() => setPasswordFocus(true)}
                    onBlur={() => setPasswordFocus(false)}
                    placeholder="Password"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    onFocus={() => setPasswordFocus(true)}
                    onBlur={() => setPasswordFocus(false)}
                    placeholder="Confirm password"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400"
                  />
                  <button type="submit" className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                    {loading ? "Creating account..." : "Create account"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </div>
    </section>
  )
}

export default LoginPage
