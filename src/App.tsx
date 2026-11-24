import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useQueueStore } from './stores/queueStore'
import { LiveToastContainer } from './components/ui/LiveToast'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import JoinQueue from './pages/JoinQueue'
import CustomerToken from './pages/CustomerToken'
import LiveDisplay from './pages/LiveDisplay'
import BarberDashboard from './pages/BarberDashboard'
import AdminDashboard from './pages/AdminDashboard'
import BarberAnalytics from './pages/BarberAnalytics'
import CustomerFeedback from './pages/CustomerFeedback'
import QueueClosed from './pages/QueueClosed'
import AdminLogin from './pages/AdminLogin'
import NotFound from './pages/NotFound'
import { LanguageSwitcher, LocaleProvider, LocaleTextBridge } from './lib/locale'

function RouteLanguageSwitcher() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/join')) return null
  return <div className="lc-global-language"><LanguageSwitcher /></div>
}

export default function App() {
  const { initRealtimeSync } = useQueueStore()

  useEffect(() => {
    // Mount cross-tab refresh notices and backend/SSE synchronization
    const cleanup = initRealtimeSync()
    return () => {
      if (typeof cleanup === 'function') {
        (cleanup as () => void)()
      }
    }
  }, [initRealtimeSync])

  return (
    <LocaleProvider>
    <BrowserRouter>
      <div className="lc-app min-h-screen text-slate-900 relative">
        {/* Dynamic Living Ambient Orbs in Background */}
        <div className="ambient-bg">
          <div className="ambient-orb-1" />
          <div className="ambient-orb-2" />
          <div className="ambient-orb-3" />
        </div>

        {/* Global Realtime Live Activity Toasts */}
        <LiveToastContainer />
        <LocaleTextBridge />
        <RouteLanguageSwitcher />

        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<Navigate to="/join" replace />} />
            <Route path="/join" element={<JoinQueue />} />
            <Route path="/token/:id" element={<CustomerToken />} />
            <Route path="/status/:id" element={<CustomerToken />} />
            <Route path="/display" element={<LiveDisplay />} />
            <Route
              path="/barber/:id"
              element={
                <ProtectedRoute>
                  <BarberDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<AdminLogin />} />
            <Route
              path="/reception"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <BarberAnalytics />
                </ProtectedRoute>
              }
            />
            <Route path="/feedback/:token" element={<CustomerFeedback />} />
            <Route path="/closed" element={<QueueClosed />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
    </LocaleProvider>
  )
}
