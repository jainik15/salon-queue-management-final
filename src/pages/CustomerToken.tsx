import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQueueStore } from '../stores/queueStore'
import { formatWait, getOrdinal, getServiceDisplayName } from '../lib/utils'
import type { QueueEntry } from '../types'
import { Scissors, Bell, ArrowLeft, Clock, CheckCircle2, UserCheck, Sparkles, Navigation } from 'lucide-react'

export default function CustomerToken() {
  const { id } = useParams()
  const { queue, barbers, updateStatus } = useQueueStore()
  const [entry, setEntry] = useState<QueueEntry | null>(null)
  const [position, setPosition] = useState(0)
  const [showCancel, setShowCancel] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    const found = queue.find(e => e.id === id || e.token.toLowerCase() === (id || '').toLowerCase()) ||
                  queue[queue.length - 1]
    if (found) {
      setEntry(found)
      const barberQueue = queue.filter(e => e.barber_id === found.barber_id && e.status === 'waiting')
      const pos = barberQueue.findIndex(e => e.id === found.id) + 1
      setPosition(found.status === 'serving' ? 0 : pos)
    }
  }, [queue, id])

  useEffect(() => {
    if (!entry) return
    const updateElapsed = () => {
      const joinedTime = new Date(entry.timestamp_joined).getTime()
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - joinedTime) / 1000)))
    }
    updateElapsed()
    const timer = setInterval(updateElapsed, 1000)
    return () => clearInterval(timer)
  }, [entry])

  if (!entry) {
    return (
      <div className="lc-screen lc-workspace lc-token min-h-screen flex items-center justify-center bg-blue-50/50">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-blue-900">Locating your token…</p>
        </div>
      </div>
    )
  }

  const barber = barbers.find(b => b.id === entry.barber_id)
  const isYourTurn = entry.status === 'serving'
  const isDone = entry.status === 'completed' || entry.status === 'absent'

  // Dynamic progress percentage for ring (position 1 = 80%, position 2 = 60%, etc.)
  const progressPercent = isYourTurn ? 100 : Math.max(15, 100 - (position * 20))
  const circumference = 2 * Math.PI * 46 // radius 46
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  return (
    <div className={`lc-screen lc-workspace lc-token min-h-screen flex flex-col justify-between transition-colors duration-700 ${
      isYourTurn
        ? 'bg-gradient-to-b from-[#0A192F] via-[#0F2D59] to-[#08172D] text-white'
        : 'text-slate-800'
    }`}>
      
      {/* Top Header */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-lg mx-auto w-full">
        <Link
          to="/join"
          className={`flex items-center gap-1.5 text-xs font-bold transition-all px-3 py-1.5 rounded-full ${
            isYourTurn
              ? 'bg-white/10 text-white hover:bg-white/20'
              : 'bg-blue-100/80 text-blue-800 hover:bg-blue-200 shadow-sm'
          }`}
        >
          <ArrowLeft size={14} />
          <span>Lounge</span>
        </Link>

        <div className="flex items-center gap-2">
          <Scissors size={18} className={isYourTurn ? 'text-sky-300' : 'text-blue-600'} />
          <span className="font-display font-black tracking-tight text-lg">LateCuts</span>
        </div>

        <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
          isYourTurn
            ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 animate-pulse'
            : 'bg-blue-100 text-blue-700 font-mono'
        }`}>
          {isYourTurn ? 'Station Ready' : 'Active Pass'}
        </span>
      </nav>

      {/* Main Dynamic Pass */}
      <main className="lc-workspace-main lc-pass-layout flex-1 flex flex-col items-center justify-center px-3 sm:px-6 py-4">
        <div className="w-full max-w-sm sm:max-w-md animate-slide-up">
          <div className="lc-pass-heading">
            <span className="lc-eyebrow">LATECUTS · DIGITAL PASS</span>
            <h1>Your Queue Pass</h1>
            <p>Follow your place in line and come forward when your barber calls.</p>
          </div>
          
          {/* Main Card with Dynamic Progress Arc */}
          <div className={`lc-pass-card rounded-3xl p-5 sm:p-8 text-center relative overflow-hidden transition-all duration-500 border ${
            isYourTurn
              ? 'lc-pass-called text-white'
              : 'lc-pass-waiting text-slate-900'
          }`}>
            
            {/* Dynamic Circular Progress Indicator */}
            <div className="relative w-36 h-36 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  className="lc-pass-track"
                  strokeWidth="7"
                  fill="transparent"
                />
                {/* Animated Progress Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  className="lc-pass-progress transition-all duration-1000 ease-out"
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Inside Circular Ring: Monumental Token */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block -mb-1">
                  TOKEN
                </span>
                <span className={`text-4xl font-black tracking-tight leading-none ${
                  isYourTurn ? 'token-number-light' : 'token-number'
                }`}>
                  {entry.token}
                </span>
                <span className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full ${
                  isYourTurn
                    ? 'bg-emerald-400/20 text-emerald-300'
                    : 'bg-blue-50 text-blue-700'
                }`}>
                  {isYourTurn ? 'Ready' : position > 0 ? getOrdinal(position) : 'In Line'}
                </span>
              </div>
            </div>

            <h2 className="font-display text-2xl font-black mt-2">
              Welcome, <span data-locale-skip>{entry.customer_name}</span>!
            </h2>
            <p className={`text-xs font-semibold mt-1 mb-6 ${isYourTurn ? 'text-sky-300' : 'text-slate-500'}`}>
              {getServiceDisplayName(entry.service)} · Station: <span data-locale-skip>{barber?.name}</span>
            </p>

            {/* Position and Estimated Wait */}
            {!isYourTurn && !isDone && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100 text-left">
                  <div className="text-[11px] font-semibold text-blue-600 mb-0.5">Queue Position</div>
                  <div className="font-display font-black text-2xl text-blue-950">
                    {position > 0 ? getOrdinal(position) : '—'}
                  </div>
                  <span className="text-[10px] text-slate-500">Ahead of you</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100 text-left">
                  <div className="text-[11px] font-semibold text-blue-600 mb-0.5">Est. Wait Time</div>
                  <div className="font-display font-black text-2xl text-blue-700">
                    {formatWait(entry.estimated_wait)}
                  </div>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                    <span>Wait: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s</span>
                  </span>
                </div>
              </div>
            )}

            {/* Dynamic Step Stepper */}
            <div className="py-3 px-4 rounded-2xl bg-blue-50/50 border border-blue-100/80 mb-6">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-blue-700 flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-blue-600" /> Checked In
                </span>
                <span className={isYourTurn || isDone ? 'text-blue-700' : 'text-slate-400'}>
                  → Summoned
                </span>
                <span className={isDone ? 'text-emerald-700' : 'text-slate-400'}>
                  → Completed
                </span>
              </div>
            </div>

            {/* When it's patron's turn: Action Hero Callout */}
            {isYourTurn && (
              <div className="lc-pass-called-message p-5 rounded-2xl bg-gradient-to-r from-blue-600/40 to-sky-600/40 border border-sky-400/60 mb-6 shadow-lg">
                <Navigation size={28} className="mx-auto text-sky-300 mb-2 animate-bounce" />
                <div className="font-display font-bold text-lg text-white">Your Station Is Calling You!</div>
                <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                  Please step up to <strong data-locale-skip>{barber?.name}</strong>'s chair on the salon floor now.
                </p>
              </div>
            )}

            {isDone && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-6">
                <CheckCircle2 size={24} className="mx-auto mb-1 text-emerald-600" />
                <span>Service complete! Thank you for visiting LateCuts.</span>
              </div>
            )}

            {/* Leave Queue Button */}
            {!isDone && (
              <button
                onClick={() => setShowCancel(true)}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  isYourTurn
                    ? 'border-white/20 text-blue-200 hover:bg-white/10'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                Leave Queue
              </button>
            )}

          </div>

          {/* Mini Live Queue Peek */}
          {entry.status === 'waiting' && (
            <div className="mt-4 p-4 rounded-3xl bg-white/95 backdrop-blur-md border border-blue-100 shadow-sm text-xs">
              <div className="font-bold text-slate-700 mb-2.5 flex items-center justify-between">
                <span><span data-locale-skip>{barber?.name}</span>'s Current Station Floor</span>
                <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping inline-block" />
                  Live Sync
                </span>
              </div>

              <div className="space-y-1.5">
                {queue
                  .filter(e => e.barber_id === entry.barber_id && (e.status === 'waiting' || e.status === 'serving'))
                  .slice(0, 3)
                  .map(q => (
                    <div key={q.id} className="flex items-center justify-between p-2 rounded-xl bg-blue-50/50">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold ${q.id === entry.id ? 'text-blue-700' : 'text-slate-600'}`}>
                          {q.token}
                        </span>
                        <span className={q.id === entry.id ? 'font-bold text-blue-900' : 'text-slate-600'}>
                          {q.id === entry.id ? 'You' : <span data-locale-skip>{q.customer_name}</span>}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        q.status === 'serving' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {q.status === 'serving' ? 'In Chair' : 'Waiting'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {!isDone && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
              <Bell size={13} className="text-blue-600" />
              <span>Real-time updates sync dynamically across devices</span>
            </div>
          )}

        </div>
      </main>

      {/* Confirmation Modal */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl p-6 bg-white shadow-2xl border border-slate-100 animate-slide-up">
            <h3 className="font-display text-xl font-bold text-slate-950 mb-2">Leave the Queue?</h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              If you release token <strong className="text-blue-700">{entry.token}</strong>, your spot will be forfeited and you will need to re-join from the end of the line.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowCancel(false)}
                className="btn-ghost py-2.5 text-xs font-bold"
              >
                Keep My Spot
              </button>
              <button
                onClick={() => {
                  updateStatus(entry.id, 'absent')
                  setShowCancel(false)
                }}
                className="py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
              >
                Yes, Leave Line
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="text-center text-xs py-4 text-slate-400">
        LateCuts · Realtime Digital Ticket Service
      </footer>
    </div>
  )
}
