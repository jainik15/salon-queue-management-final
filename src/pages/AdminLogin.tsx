import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Scissors, Lock, ArrowLeft, KeyRound, UserRound, ShieldCheck } from 'lucide-react'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/admin'
  const { login, isLoading, error } = useAuthStore()

  const [mode, setMode] = useState<'pin' | 'credentials'>('pin')
  const [pin, setPin] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState('')

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(pin.trim())) return setFormError('Please enter your 6-digit staff PIN')
    setFormError('')
    const ok = await login({ pin: pin.trim() })
    if (ok) {
      navigate(redirectTo)
    }
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return setFormError('Please enter your staff username and PIN')
    if (!/^\d{6}$/.test(password)) return setFormError('Please enter your 6-digit staff PIN')
    setFormError('')
    const ok = await login({ identifier: username.trim(), password })
    if (ok) {
      navigate(redirectTo)
    }
  }

  return (
    <div className="lc-screen lc-workspace lc-login min-h-screen flex flex-col justify-between p-4 sm:p-6 select-none text-slate-800">
      
      {/* Top Header */}
      <nav className="flex items-center justify-between max-w-md mx-auto w-full pt-2 sm:pt-4">
        <Link
          to="/join"
          className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all px-3 py-1.5 rounded-full border border-blue-100 shadow-sm"
        >
          <ArrowLeft size={14} />
          <span>Lounge Floor</span>
        </Link>

        <div className="flex items-center gap-2">
          <Scissors size={18} className="text-blue-600" />
          <span className="font-display font-black tracking-tight text-lg">LateCuts</span>
        </div>

        <span className="text-xs px-3 py-1 rounded-full font-bold bg-blue-100 text-blue-700">
          Staff Portal
        </span>
      </nav>

      {/* Main Login Card */}
      <main className="lc-login-layout mx-auto w-full py-4 sm:py-8">
        <aside className="lc-login-aside" aria-labelledby="staff-access-title">
          <span className="lc-eyebrow">LATECUTS · STAFF ONLY</span>
          <h1 id="staff-access-title">A well-run floor begins here.</h1>
          <p>Secure access for the people who keep every visit moving with care.</p>
          <div className="lc-login-aside-rule" />
          <span className="lc-login-aside-caption">SALON MANAGEMENT · RECEPTION · STYLISTS</span>
        </aside>

        <div className="dynamic-card lc-login-card p-5 sm:p-8 bg-white/95 backdrop-blur-xl border border-blue-100 shadow-2xl shadow-blue-500/10">
          
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-400 text-white shadow-lg shadow-blue-500/25">
              <Lock size={26} />
            </div>
            <h2 className="font-display text-2xl font-black text-slate-950">Staff Access</h2>
            <p className="text-xs text-slate-500 mt-1">Authorized salon staff and management access</p>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => { setMode('pin'); setFormError('') }}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'pin' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <KeyRound size={14} />
              <span>Quick PIN</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('credentials'); setFormError('') }}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'credentials' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserRound size={14} />
              <span>Username & PIN</span>
            </button>
          </div>

          {/* Errors */}
          {(formError || error) && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-slide-up">
              {formError || error}
            </div>
          )}

          {/* PIN Form */}
          {mode === 'pin' ? (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1.5">
                  6-Digit Staff PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  minLength={6}
                  required
                  placeholder="••••••"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  className="input-clean text-center text-3xl font-black tracking-widest text-blue-900"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3.5 text-sm font-bold flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Authorize Concierge</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Email & Password Form */
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                  Staff Username
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="staff"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input-clean"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                  Staff PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  minLength={6}
                  required
                  autoComplete="current-password"
                  placeholder="••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-clean"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3.5 text-sm font-bold flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Sign In to Dashboard</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </main>

      <footer className="text-center text-xs pb-3 text-slate-400">
        LateCuts · Concierge Access Control Security
      </footer>
    </div>
  )
}
