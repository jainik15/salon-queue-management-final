import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQueueStore } from '../stores/queueStore'
import { getServiceDisplayName } from '../lib/utils'
import { playChime } from '../lib/audio'
import { Scissors, CheckCircle, UserX, Bell, Coffee, Clock, ArrowLeft, AlertCircle, ArrowUp } from 'lucide-react'

export default function BarberDashboard() {
  const { id } = useParams<{ id: string }>()
  const routeId = id || 'marcus'
  const barberId = ({ ramesh: 'zara', vinod: 'marcus', arjun: 'dev' } as Record<string, string>)[routeId] || routeId
  const { queue, barbers, callNext, markDone, markAbsent, updateBarberStatus } = useQueueStore()

  const barber = barbers.find(b => b.id === barberId) || barbers[0]
  const currentlyServing = queue.find(e => e.barber_id === barber.id && e.status === 'serving')
  const waitingQueue = queue.filter(e => e.barber_id === barber.id && e.status === 'waiting')

  const [serviceTimer, setServiceTimer] = useState<number>(0)

  // Timer for current patron
  useEffect(() => {
    let interval: number | undefined
    if (currentlyServing && currentlyServing.timestamp_called) {
      interval = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(currentlyServing.timestamp_called!).getTime()) / 1000)
        setServiceTimer(Math.max(0, elapsed))
      }, 1000)
    } else {
      setServiceTimer(0)
    }
    return () => clearInterval(interval)
  }, [currentlyServing])

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Dynamic progress calculation based on scheduled time vs elapsed
  const targetSeconds = (currentlyServing?.service_duration || 25) * 60
  const progressPercent = Math.min(100, Math.floor((serviceTimer / targetSeconds) * 100))
  const isOvertime = serviceTimer > targetSeconds

  const handleCallNext = () => {
    playChime()
    callNext(barber.id)
  }

  return (
    <div className="lc-screen lc-workspace lc-stylist min-h-screen text-slate-800">
      
      {/* Top Stylist Nav */}
      <header className="lc-workspace-header lc-station-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-blue-100 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            to="/join"
            className="p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all border border-blue-100 flex-shrink-0"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Guest Portal</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-display font-black text-base sm:text-lg text-white bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-400 shadow-sm flex-shrink-0">
              {barber.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg sm:text-xl font-bold text-slate-900"><span data-locale-skip>{barber.name}</span><span>'s Station</span></h1>
                <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Cockpit
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500">Specialty: {getServiceDisplayName(barber.specialty)}</p>
            </div>
          </div>
        </div>

        {/* Status Toggle & TV Display Link */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => updateBarberStatus(barber.id, 'available')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                barber.status === 'available'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => updateBarberStatus(barber.id, 'break')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                barber.status === 'break'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Break
            </button>
          </div>

          <Link
            to="/display"
            target="_blank"
            className="text-xs px-3.5 py-2 rounded-xl font-bold transition-all inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 shadow-sm"
          >
            <span>Floor TV ↗</span>
          </Link>
        </div>
      </header>

      {/* Main Stylist Area */}
      <main className="lc-workspace-main lc-station-layout max-w-6xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Left Column: Active Chair Station (7 cols) */}
        <section className="lg:col-span-7 space-y-4 sm:space-y-6">
          
          <div className={`lc-chair-card rounded-3xl p-5 sm:p-6 transition-all border ${
            currentlyServing ? 'lc-chair-active' : 'lc-chair-vacant'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs uppercase font-bold tracking-wider flex items-center gap-2 ${
                currentlyServing ? 'text-blue-200' : 'text-slate-500'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${currentlyServing ? 'bg-emerald-400 animate-ping' : 'bg-slate-300'}`} />
                {currentlyServing ? 'In the Chair' : 'Station Vacant'}
              </span>

              {currentlyServing && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-sky-200 border border-white/20">
                  <Clock size={13} />
                  <span>{formatTimer(serviceTimer)}</span>
                </div>
              )}
            </div>

            {currentlyServing ? (
              <div>
                  <div className="lc-current-customer-heading flex items-baseline justify-between mb-2">
                  <div className="token-number-light text-5xl sm:text-7xl font-black tracking-tight">
                    {currentlyServing.token}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-blue-200 block">Scheduled Time</span>
                    <span className="font-bold text-white text-sm sm:text-base">~{currentlyServing.service_duration} mins</span>
                  </div>
                </div>

                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">
                  <span data-locale-skip>{currentlyServing.customer_name}</span>
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-sky-300 mb-4">
                  {getServiceDisplayName(currentlyServing.service)}
                </p>

                {/* Dynamic Live Progress Bar for Chair Time */}
                <div className="lc-service-progress mb-6 p-3 sm:p-3.5 rounded-2xl bg-white/10 border border-white/10">
                  <div className="flex justify-between text-xs mb-1.5 font-semibold text-blue-100">
                    <span>Service Pace</span>
                    <span>{progressPercent}% completed</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-blue-950/60 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isOvertime ? 'bg-amber-400 animate-pulse' : 'bg-gradient-to-r from-sky-400 to-emerald-400'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  {isOvertime && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-bold mt-2">
                      <AlertCircle size={13} />
                      <span>Service is currently exceeding estimated target.</span>
                    </div>
                  )}
                </div>

                {/* Stylist Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button
                    onClick={() => markDone(currentlyServing.id)}
                    className="py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all"
                  >
                    <CheckCircle size={18} />
                    <span>Complete Service</span>
                  </button>

                  <button
                    onClick={() => markAbsent(currentlyServing.id)}
                    className="py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all bg-white/10 hover:bg-white/20 text-rose-200 border border-rose-300/30"
                  >
                    <UserX size={18} />
                    <span>No-Show / Skip</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Scissors size={40} className="mx-auto mb-3 text-blue-400/60 animate-bounce" />
                <h3 className="font-display text-2xl font-bold text-slate-900 mb-2">Ready for Next Guest</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                  {waitingQueue.length > 0
                    ? `There are ${waitingQueue.length} patrons waiting in your queue. Press below to sound the chime.`
                    : 'Your queue is currently clear.'}
                </p>

                <button
                  onClick={handleCallNext}
                  disabled={waitingQueue.length === 0}
                  className="btn-primary py-4 px-8 inline-flex items-center gap-2 text-base font-bold disabled:opacity-40"
                >
                  <Bell size={18} />
                  <span>Summon Next Patron</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="lc-stylist-metrics grid grid-cols-3 gap-4">
            <div className="dynamic-card text-center p-4">
              <div className="text-xs uppercase font-bold text-slate-500 mb-1">Served Today</div>
              <div className="font-display text-3xl font-black text-slate-950">{barber.served_today}</div>
            </div>
            <div className="dynamic-card text-center p-4">
              <div className="text-xs uppercase font-bold text-slate-500 mb-1">Avg Service</div>
              <div className="font-display text-3xl font-black text-blue-700">{barber.avg_duration}m</div>
            </div>
            <div className="dynamic-card text-center p-4">
              <div className="text-xs uppercase font-bold text-slate-500 mb-1">Waiting Now</div>
              <div className="font-display text-3xl font-black text-sky-600">{waitingQueue.length}</div>
            </div>
          </div>
        </section>

        {/* Right Column: Waiting Queue (5 cols) */}
        <section className="lg:col-span-5">
          <div className="dynamic-card lc-next-customers h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-display text-lg font-bold text-slate-900">Coming Up ({waitingQueue.length})</h3>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                  Priority FIFO
                </span>
              </div>

              {waitingQueue.length > 0 ? (
                <div className="space-y-2.5 overflow-y-auto max-h-[480px] pr-1">
                  {waitingQueue.map((item, index) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl flex items-center justify-between transition-all border ${
                        index === 0
                          ? 'bg-blue-50 border-blue-300 shadow-sm'
                          : 'bg-white border-slate-200/80 hover:border-blue-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-mono text-sm font-black px-2 py-0.5 rounded-lg ${
                          index === 0
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.token}
                        </span>
                        <div>
                          <div data-locale-skip className="font-bold text-sm text-slate-950">{item.customer_name}</div>
                          <div className="text-xs text-slate-500">{getServiceDisplayName(item.service)}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-blue-700 block">
                          {index === 0 ? '⚡ NEXT' : `#${index + 1}`}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ~{item.service_duration}m
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <Coffee size={36} className="mx-auto mb-2 text-slate-300" />
                  <div className="font-display text-base font-bold text-slate-800">Station Idle</div>
                  <p className="text-xs text-slate-500 mt-1">New guest arrivals will automatically populate here.</p>
                </div>
              )}
            </div>

            {/* Stylist Station Switcher */}
            <div className="pt-4 border-t border-slate-100 mt-4">
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-2">Switch Station Terminal:</span>
              <div className="grid grid-cols-3 gap-2">
                {barbers.map(b => (
                  <Link
                    key={b.id}
                    to={`/barber/${b.id}`}
                    className={`text-center py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                      b.id === barber.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-blue-50 text-blue-900 hover:bg-blue-100'
                    }`}
                  >
                    <span data-locale-skip>{b.name}</span>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </section>

      </main>
    </div>
  )
}
