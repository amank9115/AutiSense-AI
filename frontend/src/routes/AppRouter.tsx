import { lazy, Suspense } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import ProtectedRoute from "../auth/ProtectedRoute"
import AppShell from "../layout/AppShell"

const LandingPage = lazy(() => import("../pages/LandingPage"))
const LoginPage = lazy(() => import("../pages/LoginPage"))
const DemoDashboardPage = lazy(() => import("../pages/DemoDashboardPage"))
const LiveScreeningPage = lazy(() => import("../pages/LiveScreeningPage"))
const ChildProfilePage = lazy(() => import("../pages/ChildProfilePage"))
const ParentDashboardPage = lazy(() => import("../pages/ParentDashboardPage"))
const DoctorDashboardPage = lazy(() => import("../pages/DoctorDashboardPage"))
const ChildCaseDetailsPage = lazy(() => import("../pages/ChildCaseDetailsPage"))
const VideoAnalysisPage = lazy(() => import("../pages/VideoAnalysisPage"))
const ScreeningReportPage = lazy(() => import("../pages/ScreeningReportPage"))
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"))

const RouteLoader = () => (
  <div className="mx-auto flex min-h-[55vh] max-w-7xl items-center justify-center px-4">
    <div className="rounded-xl border border-slate-200/80 bg-white/70 px-4 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
      Loading experience...
    </div>
  </div>
)

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/demo" element={<DemoDashboardPage />} />
            <Route
              path="/child-profile"
              element={
                <ProtectedRoute role="parent">
                  <ChildProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/live-screening"
              element={
                <ProtectedRoute role="parent">
                  <LiveScreeningPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent-dashboard"
              element={
                <ProtectedRoute role="parent">
                  <ParentDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/case/:caseId"
              element={
                <ProtectedRoute role="doctor">
                  <ChildCaseDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-dashboard"
              element={
                <ProtectedRoute role="doctor">
                  <DoctorDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/video-analysis"
              element={
                <ProtectedRoute>
                  <VideoAnalysisPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/:sessionId"
              element={
                <ProtectedRoute role="parent">
                  <ScreeningReportPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default AppRouter

