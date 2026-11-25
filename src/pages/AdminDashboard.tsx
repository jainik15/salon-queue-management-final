import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueueStore } from '../stores/queueStore'
import { useAuthStore } from '../stores/authStore'
import { formatQueueToken, getServiceDisplayName } from '../lib/utils'
import { useLocale } from '../lib/locale'
import { LoungeQRCode } from '../components/ui/QRCode'
import { Scissors, Users, TrendingUp, Plus, UserX, ArrowLeft, BarChart3, QrCode, Sparkles, Moon, Database, Search, Filter, Play, Pause, LogOut } from 'lucide-react'

export default function AdminDashboard() {
  const { queue, barbers, services, addToQueue, updateBarberStatus, updateStatus, removeWaitingEntry, resetToSampleData } = useQueueStore()
  const { logout, user } = useAuthStore()
  const { t } = useLocale()
  const navigate = useNavigate()
  const [showWalkinModal, setShowWalkinModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [walkinName, setWalkinName] = useState('')
  const [walkinService, setWalkinService] = useState('')
  const [walkinBarber, setWalkinBarber] = useState('')
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue')

  // Dynamic search and filter
  const [searchQuery, setSearchQuery] = useState('')
  const [barberFilter, setBarberFilter] = useState<string>('all')

  // Dynamic Automated Patron Simulator
  const [autoSimulate, setAutoSimulate] = useState(false)

  const salonDateKey = (value: string | Date) => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(value))
  const todayKey = salonDateKey(new Date())
  const isToday = (value?: string | Date) => value ? salonDateKey(value) === todayKey : false
  const todayQueue = queue.filter(entry => isToday(entry.timestamp_joined))
  const totalWaiting = queue.filter(q => q.status === 'waiting').length
  const totalServing = queue.filter(q => q.status === 'serving').length
  const totalCompleted = queue.filter(q => q.status === 'completed' && isToday(q.timestamp_completed)).length
  const totalNoShow = todayQueue.filter(q => q.status === 'absent').length
  const noShowRate = todayQueue.length ? (totalNoShow / todayQueue.length * 100).toFixed(1) : '0.0'

  const handleSimulatePatron = () => {
    const patronNames = ['Oliver', 'Emma', 'Liam', 'Lucas', 'Priya', 'Kabir', 'Zoya', 'Vikram', 'Aria', 'Noah']
    const randomName = patronNames[Math.floor(Math.random() * patronNames.length)]
    if (!services.length || !barbers.length) return
    const randomService = services[Math.floor(Math.random() * services.length)]
    const activeBarbers = barbers.filter(b => b.status === 'available')
    if (activeBarbers.length === 0) return
    const targetBarber = activeBarbers[Math.floor(Math.random() * activeBarbers.length)]

    void addToQueue({
      customer_name: randomName,
      service: randomService.name_en,
      service_duration: randomService.duration,
      barber_id: targetBarber.id,
      barber_name: targetBarber.name,
      language: 'en',
      service_ids: [randomService.id],
      isWalkIn: true,
    }).catch(error => window.alert(error instanceof Error ? t(error.message) : t('The simulation could not be added.')))
  }

  // Auto-simulator interval effect
  useEffect(() => {
    if (!autoSimulate) return
    const interval = setInterval(() => {
      handleSimulatePatron()
    }, 20000) // every 20 seconds
    return () => clearInterval(interval)
  }, [autoSimulate, barbers, services])

  useEffect(() => {
    if (!services.some(service => service.id === walkinService)) setWalkinService(services[0]?.id || '')
  }, [services, walkinService])

  useEffect(() => {
    if (!barbers.some(barber => barber.id === walkinBarber)) setWalkinBarber(barbers[0]?.id || '')
  }, [barbers, walkinBarber])

  const handleCreateWalkin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!walkinName.trim() || !services.length) return

    const s = services.find(svc => svc.id === walkinService)
    const b = barbers.find(barb => barb.id === walkinBarber)
    if (!s || !b) return

    void addToQueue({
      customer_name: walkinName.trim(),
      service: s.name_en,
      service_duration: s.duration,
      barber_id: b.id,
      barber_name: b.name,
      language: 'en',
      service_ids: [s.id],
      isWalkIn: true,
    }).then(() => {
      setWalkinName('')
      setShowWalkinModal(false)
    }).catch(error => {
      window.alert(error instanceof Error ? t(error.message) : t('The walk-in could not be added.'))
    })

  }

  // Filtered queue items
  const filteredQueue = queue
    .filter(item => (activeTab === 'queue' ? (item.status === 'waiting' || item.status === 'serving') : (item.status === 'completed' || item.status === 'absent')))
    .filter(item => (barberFilter === 'all' ? true : item.barber_id === barberFilter))
    .filter(item => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return item.customer_name.toLowerCase().includes(q) || formatQueueToken(item.token).toLowerCase().includes(q) || item.token.toLowerCase().includes(q) || item.service.toLowerCase().includes(q)
    })

  return (
    <div className="lc-screen lc-workspace lc-admin min-h-screen text-slate-800">

      {/* Admin Nav */}
      <header className="lc-workspace-header flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-4 sm:px-8 py-3 sm:py-4 border-b border-blue-100 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center justify-between w-full lg:w-auto gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/join"
              className="p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all border border-blue-100 flex-shrink-0"
              title="Return to guest join view"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">Guest View</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-400 text-white shadow-sm flex-shrink-0">
                <Scissors size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-lg sm:text-xl font-black text-slate-950 tracking-tight">LateCuts</h1>
                  <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 whitespace-nowrap">
                    Queue Control
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-blue-600 font-medium hidden sm:block">Your Style. Your Time.</p>
              </div>
            </div>
          </div>

          {/* Mobile Right Quick Action: Walk-in + Analytics + SignOut */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <Link
              to="/analytics"
              className="p-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200"
              title="View Analytics"
            >
              <BarChart3 size={15} />
            </Link>
            <button
              onClick={() => setShowWalkinModal(true)}
              className="btn-primary py-1.5 px-2.5 text-xs font-bold flex items-center gap-1"
            >
              <Plus size={13} />
              <span>Walk-In</span>
            </button>
            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              title="Sign Out"
              className="p-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-start lg:justify-end">
          {/* Dynamic Auto-Simulation Toggle */}
          <button
            onClick={() => setAutoSimulate(!autoSimulate)}
            className={`text-xs px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 border ${autoSimulate
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md animate-pulse'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            title="Automatically inject simulated guests every 20s"
          >
            {autoSimulate ? <Pause size={13} /> : <Play size={13} />}
            <span>Auto-Simulate: <span className="font-extrabold">{autoSimulate ? 'ON' : 'OFF'}</span></span>
          </button>

          <button
            onClick={handleSimulatePatron}
            title="Inject simulated patron for instant live test"
            className="text-xs px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 shadow-sm"
          >
            <Sparkles size={14} className="text-blue-600" />
            <span>+ 1 Guest</span>
          </button>

          <button
            onClick={() => setShowQRModal(true)}
            title="Display Check-in QR Code"
            className="text-xs px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm"
          >
            <QrCode size={14} className="text-blue-600" />
            <span className="hidden sm:inline">Scan QR</span>
          </button>

          <Link
            to="/analytics"
            className="text-xs px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm"
          >
            <BarChart3 size={14} className="text-blue-600" />
            <span className="hidden sm:inline">Analytics</span>
          </Link>

          <Link
            to="/closed"
            className="text-xs px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm"
          >
            <Moon size={14} className="text-slate-500" />
            <span className="hidden sm:inline">Closed</span>
          </Link>

          <button
            onClick={() => setShowWalkinModal(true)}
            className="btn-primary py-1.5 px-3.5 text-xs font-bold hidden lg:flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>+ Walk-In</span>
          </button>

          <Link
            to="/display"
            target="_blank"
            className="text-xs px-3 py-1.5 rounded-xl font-bold transition-all bg-blue-600 text-white hover:bg-blue-500 shadow-sm flex items-center gap-1"
          >
            <span>📺 TV</span>
          </Link>

          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            title="Sign out of concierge command"
            className="text-xs px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition-all hidden lg:flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 shadow-sm"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="lc-workspace-main max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">

        <section className="lc-editorial-intro" aria-labelledby="queue-control-title">
          <div className="lc-editorial-copy">
            <span className="lc-eyebrow">SALON FLOOR · LIVE OPERATIONS</span>
            <h2 id="queue-control-title">Queue Control</h2>
            <p>A clear view of today's waiting room, stylist stations and service flow.</p>
          </div>
          <div className="lc-editorial-count" aria-label={`${totalWaiting} customers waiting`}>
            <span className="lc-editorial-count-number">{totalWaiting}</span>
            <span className="lc-editorial-count-label">Customers Waiting</span>
            <span className="lc-editorial-count-note">Live queue</span>
          </div>
        </section>

        {/* KPI Cards in Blue and White with dynamic elevation */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="dynamic-card p-3.5 sm:p-5 border-l-4 border-l-blue-600">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-500">In Line</span>
              <Users size={16} className="text-blue-600" />
            </div>
            <div className="font-display text-2xl sm:text-4xl font-black text-slate-950">{totalWaiting}</div>
            <span className="text-[10px] sm:text-xs text-blue-700 font-semibold mt-1 block truncate">3 Stylist Stations</span>
          </div>

          <div className="dynamic-card p-3.5 sm:p-5 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-500">In Chair</span>
              <Scissors size={16} className="text-emerald-600" />
            </div>
            <div className="font-display text-2xl sm:text-4xl font-black text-emerald-800">{totalServing}</div>
            <span className="text-[10px] sm:text-xs text-emerald-600 font-semibold mt-1 block truncate">In progress</span>
          </div>

          <div className="dynamic-card p-5 border-l-4 border-l-sky-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-bold text-slate-500">Served Today</span>
              <TrendingUp size={18} className="text-sky-600" />
            </div>
            <div className="font-display text-4xl font-black text-blue-950">{totalCompleted}</div>
            <span className="text-xs text-slate-400 font-semibold mt-1 block">Recorded completions today</span>
          </div>

          <div className="dynamic-card p-5 border-l-4 border-l-rose-400">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-bold text-slate-500">No-Show / Cancel</span>
              <UserX size={18} className="text-rose-500" />
            </div>
            <div className="font-display text-4xl font-black text-rose-700">{totalNoShow}</div>
            <span className="text-xs text-rose-500 font-semibold mt-1 block">{noShowRate}% of today's entries</span>
          </div>
        </div>

        {/* Stylist Duty Management Panel */}
        <section className="dynamic-card lc-workspace-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">Barber Availability</h2>
              <p className="lc-section-note">Station status and each barber’s current workload.</p>
            </div>
            <button
              onClick={() => {
                void resetToSampleData().catch(error => window.alert(error instanceof Error ? error.message : 'Sample data reset is unavailable.'))
              }}
              className="text-xs text-slate-400 hover:text-slate-600 underline font-medium"
            >
              Reset Sample Data
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {barbers.map(barber => {
              const inChair = queue.find(q => q.barber_id === barber.id && q.status === 'serving')
              const waiting = queue.filter(q => q.barber_id === barber.id && q.status === 'waiting').length

              return (
                <div
                  key={barber.id}
                  className="rounded-2xl p-4 flex flex-col justify-between bg-blue-50/40 border border-blue-100 hover:border-blue-200 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-black text-white text-base bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-400 shadow-sm">
                        {barber.avatar}
                      </div>
                      <div>
                        <div data-locale-skip className="font-display font-bold text-slate-950">{barber.name}</div>
                        <div className="text-xs text-slate-500">{getServiceDisplayName(barber.specialty)}</div>
                      </div>
                    </div>

                    <select
                      value={barber.status}
                      onChange={(e) => {
                        void updateBarberStatus(barber.id, e.target.value as any)
                          .catch(error => window.alert(error instanceof Error ? error.message : 'Stylist status could not be saved.'))
                      }}
                      className="text-xs rounded-xl px-2.5 py-1 font-bold outline-none border cursor-pointer bg-white text-blue-900 border-blue-200 shadow-sm"
                    >
                      <option value="available">Active</option>
                      <option value="break">On Break</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 text-xs py-2.5 border-t border-b border-blue-100/60 mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current In Chair:</span>
                      <strong className="text-blue-900 font-bold">{inChair ? <><span data-locale-skip>{formatQueueToken(inChair.token)}</span> (<span data-locale-skip>{inChair.customer_name}</span>)</> : 'Available'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Waitlist:</span>
                      <strong className="text-blue-700 font-bold">{waiting} waiting</strong>
                    </div>
                  </div>

                  <Link
                    to={`/barber/${barber.id}`}
                    className="text-xs text-center py-2 rounded-xl font-bold bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 transition-colors shadow-sm block"
                  >
                    Open Station Cockpit →
                  </Link>
                </div>
              )
            })}
          </div>
        </section>

        {/* Global Live Queue Ledger with Dynamic Search and Filter */}
        <section className="dynamic-card lc-workspace-panel lc-queue-panel p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">Customer Queue</h2>
              <div className="flex rounded-xl p-1 bg-slate-100 border border-slate-200 self-start sm:self-auto">
                <button
                  onClick={() => setActiveTab('queue')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'queue' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                    }`}
                >
                  Live Queue ({queue.filter(q => q.status === 'waiting' || q.status === 'serving').length})
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                    }`}
                >
                  Completed ({totalCompleted})
                </button>
              </div>
            </div>

            {/* Dynamic Search & Stylist Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search token or name…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 sm:py-1.5 rounded-xl border border-blue-200 text-xs font-semibold outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <select
                value={barberFilter}
                onChange={e => setBarberFilter(e.target.value)}
                className="py-2 sm:py-1.5 px-3 rounded-xl border border-blue-200 text-xs font-semibold outline-none bg-white text-slate-700"
              >
                <option value="all">All Stylists</option>
                {barbers.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="lc-workspace-table lc-queue-table w-full text-left text-sm min-w-[550px]">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-500 font-bold">
                  <th className="pb-3">Token</th>
                  <th className="pb-3">Patron Name</th>
                  <th className="pb-3">Service</th>
                  <th className="pb-3">Stylist</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueue.length > 0 ? (
                  filteredQueue.map(entry => (
                    <tr key={entry.id} className="hover:bg-blue-50/40 transition-colors">
                      <td data-label="Token" data-label-gu="ટોકન" className="py-3 font-mono font-black text-blue-700">
                        {formatQueueToken(entry.token)}
                      </td>
                      <td data-label="Customer" data-label-gu="ગ્રાહક" className="py-3 font-bold text-slate-900">
                        <span data-locale-skip>{entry.customer_name}</span>
                      </td>
                      <td data-label="Service" data-label-gu="સેવા" className="py-3 text-slate-600 text-xs">
                        {getServiceDisplayName(entry.service)}
                      </td>
                      <td data-label="Barber" data-label-gu="બાર્બર" className="py-3 font-bold text-blue-900 text-xs">
                        <span data-locale-skip>{entry.barber_name}</span>
                      </td>
                      <td data-label="Status" data-label-gu="સ્થિતિ" className="py-3">
                        <span className={`lc-queue-status lc-queue-status-${entry.status} text-xs px-2.5 py-1 rounded-full font-bold ${entry.status === 'serving' ? 'bg-emerald-100 text-emerald-800' :
                            entry.status === 'waiting' ? 'bg-blue-100 text-blue-800' :
                              entry.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                                'bg-rose-100 text-rose-700'
                          }`}>
                          {entry.status}
                        </span>
                      </td>
                      <td data-label="Actions" data-label-gu="કાર્યવાહી" className="py-3 text-right">
                        {entry.status === 'waiting' && (
                          <button
                            onClick={() => {
                              void removeWaitingEntry(entry.id)
                                .catch(error => window.alert(error instanceof Error ? t(error.message) : t('Waiting customer could not be removed.')))
                            }}
                            className="text-xs px-2.5 py-1 rounded-lg font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                        {entry.status === 'serving' && (
                          <button
                            onClick={() => {
                              void updateStatus(entry.id, 'completed')
                                .catch(error => window.alert(error instanceof Error ? error.message : 'Service could not be completed.'))
                            }}
                            className="text-xs px-2.5 py-1 rounded-lg font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                          >
                            Mark Done
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                      No patrons match your search or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* Walk-in Form Modal */}
      {showWalkinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl p-5 sm:p-6 bg-white shadow-2xl border border-blue-100 animate-slide-up my-auto">
            <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-950 mb-1">Add Floor Walk-In</h3>
            <p className="text-xs text-slate-500 mb-5">Manually register patron directly into station queue</p>

            <form onSubmit={handleCreateWalkin} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">Guest Name</label>
                <input
                  type="text"
                  required
                  placeholder="Patron Name"
                  value={walkinName}
                  onChange={e => setWalkinName(e.target.value)}
                  className="input-clean"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">Service</label>
                <select
                  value={walkinService}
                  onChange={e => setWalkinService(e.target.value)}
                  className="input-clean"
                >
              {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.name_en} ({s.duration}m - ₹{s.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">Assign Stylist</label>
                <select
                  value={walkinBarber}
                  onChange={e => setWalkinBarber(e.target.value)}
                  className="input-clean"
                >
                  {barbers.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.queue_count} in queue)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(false)}
                  className="btn-ghost py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2.5 text-xs font-bold"
                >
                  Issue Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal for Front Desk / Lounge Display */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-sm rounded-3xl p-5 sm:p-6 text-center bg-white shadow-2xl border border-blue-100 animate-slide-up my-auto">
            <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-950 mb-1">Scan for Mobile Queue</h3>
            <p className="text-xs text-slate-500 mb-5">
              Patrons can aim their camera to join the queue on their phone
            </p>

            <div className="flex justify-center mb-5">
              <LoungeQRCode value={`${window.location.origin}/join`} size={190} />
            </div>

            <div className="text-xs mb-6 font-mono font-bold text-blue-700 bg-blue-50 py-1.5 px-3 rounded-xl border border-blue-100">
              {window.location.origin}/join
            </div>

            <button
              onClick={() => setShowQRModal(false)}
              className="w-full btn-primary py-3 text-sm font-bold"
            >
              Close Window
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
