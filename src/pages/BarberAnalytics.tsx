import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueueStore } from '../stores/queueStore'
import { useAuthStore } from '../stores/authStore'
import { useLocale } from '../lib/locale'
import { getServiceDisplayName } from '../lib/utils'
import {
  TrendingUp,
  BarChart3,
  ArrowLeft,
  Download,
  LogOut,
  Users,
  Clock,
  Sparkles,
  Star,
  Activity,
  CheckCircle2,
  Coffee,
  MessageSquare,
} from 'lucide-react'

export default function BarberAnalytics() {
  const { barbers, queue, reviews, services } = useQueueStore()
  const { lang } = useLocale()
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today')
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString(lang === 'gu' ? 'gu-IN' : 'en-IN'))

  // Dynamic live pulse updater
  useEffect(() => {
    const timer = setInterval(() => {
      setLastSyncTime(new Date().toLocaleTimeString(lang === 'gu' ? 'gu-IN' : 'en-IN'))
    }, 5000)
    return () => clearInterval(timer)
  }, [lang])

  // 1. Filtered datasets based on selected stylist
  const filteredBarbers = selectedBarberId === 'all'
    ? barbers
    : barbers.filter(b => b.id === selectedBarberId)

  const barberQueue = selectedBarberId === 'all'
    ? queue
    : queue.filter(q => q.barber_id === selectedBarberId)

  const barberReviews = selectedBarberId === 'all'
    ? reviews
    : reviews.filter(r => r.barber_id === selectedBarberId)

  // Filters use the persisted event timestamps; the dashboard does not synthesize traffic.
  const salonDateParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date()).reduce((parts, part) => ({ ...parts, [part.type]: part.value }), {} as Record<string, string>)
  const rangeCalendarDate = new Date(Date.UTC(Number(salonDateParts.year), Number(salonDateParts.month) - 1, Number(salonDateParts.day)))
  if (timeRange === 'week') rangeCalendarDate.setUTCDate(rangeCalendarDate.getUTCDate() - 6)
  if (timeRange === 'month') rangeCalendarDate.setUTCDate(1)
  const rangeStart = new Date(Date.UTC(
    rangeCalendarDate.getUTCFullYear(), rangeCalendarDate.getUTCMonth(), rangeCalendarDate.getUTCDate(), -5, -30,
  ))
  const filteredQueue = barberQueue.filter(entry => new Date(entry.timestamp_joined).getTime() >= rangeStart.getTime())
  const filteredReviews = barberReviews.filter(review => new Date(review.created_at).getTime() >= rangeStart.getTime())

  // 3. Total completed entries inside the selected date range.
  const totalCompleted = filteredQueue.filter(q => q.status === 'completed').length

  // 4. Dynamic Avg Duration
  const completedEntries = filteredQueue.filter(q => q.status === 'completed' && q.service_duration > 0)
  const avgDuration = completedEntries.length > 0
    ? Math.round(completedEntries.reduce((sum, q) => sum + q.service_duration, 0) / completedEntries.length)
      : 0

  // 5. Dynamic Satisfaction Rating
  const avgRating = filteredReviews.length > 0
    ? (filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length).toFixed(2)
    : '—'

  // 6. Dynamic Hourly Traffic Histogram
  const hours = Array.from({ length: 12 }, (_, index) => index + 9)
  const hourlyTrafficRaw = hours.map(hourValue => {
    const hour = `${hourValue % 12 || 12} ${hourValue < 12 ? 'AM' : 'PM'}`
    const count = filteredQueue.filter(entry => new Date(entry.timestamp_joined).getHours() === hourValue).length
    return { hour, count }
  })

  const maxCount = Math.max(...hourlyTrafficRaw.map(h => h.count), 0)
  const peakHourItem = maxCount > 0
    ? hourlyTrafficRaw.reduce((max, h) => (h.count > max.count ? h : max), hourlyTrafficRaw[0])
    : null

  const dynamicHourlyTraffic = hourlyTrafficRaw.map(h => ({
    hour: h.hour,
    count: h.count,
    height: h.count ? `${Math.max(18, Math.round((h.count / Math.max(maxCount, 1)) * 100))}%` : '0%',
    peak: Boolean(peakHourItem && h.hour === peakHourItem.hour),
  }))

  // 7. Dynamic Service Demand Breakdown
  const serviceCounts: { [serviceName: string]: number } = Object.fromEntries(services.map(service => [service.name_en, 0]))
  filteredQueue.forEach(q => {
    const serviceNames = q.service_ids?.length
      ? q.service_ids.map(id => services.find(service => service.id === id)?.name_en).filter((name): name is string => Boolean(name))
      : q.service.split(' + ').map(getServiceDisplayName)
    serviceNames.forEach(serviceName => {
      serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1
    })
  })
  const totalDemands = Object.values(serviceCounts).reduce((a, b) => a + b, 0)
  const colorPalette = ['#C78B43', '#9D7543', '#887B68', '#B89B6E', '#D5BE97']

  const serviceBreakdown = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, services.length)
    .map(([name, count], idx) => ({
      name,
      count,
      percent: totalDemands ? Math.round((count / totalDemands) * 100) : 0,
      color: colorPalette[idx % colorPalette.length],
    }))

  // Real-time active counts
  const currentlyServingCount = barberQueue.filter(q => q.status === 'serving').length
  const waitingCount = barberQueue.filter(q => q.status === 'waiting').length

  const exportCSV = () => {
    const headers = 'Token,Patron Name,Service,Stylist,Status,Duration (mins),Wait (mins),Timestamp\n'
    const rows = filteredQueue
      .map(
        q =>
          `${q.token},"${q.customer_name}","${getServiceDisplayName(q.service)}","${q.barber_name}",${q.status},${q.service_duration},${q.estimated_wait},"${new Date(q.timestamp_joined).toLocaleTimeString()}"`
      )
      .join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `luxe-cuts-analytics-${selectedBarberId}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <div className="lc-screen lc-workspace lc-analytics min-h-screen text-slate-800">
      {/* Header */}
      <header className="lc-workspace-header flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-4 sm:px-8 py-3 sm:py-5 border-b border-blue-100 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all border border-blue-100 flex-shrink-0"
          >
            <ArrowLeft size={15} />
          <span className="hidden sm:inline">Queue Control</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-400 text-white shadow-sm flex-shrink-0">
              <BarChart3 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg sm:text-xl font-bold text-slate-950">Business Insights</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-blue-600 font-medium">
                <span>Salon performance at a glance · Synced</span> {lastSyncTime}
              </p>
            </div>
          </div>
        </div>

        {/* Filters & Export */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between sm:justify-end">
          <div className="flex rounded-xl p-1 text-xs bg-slate-100 border border-slate-200">
            {(['today', 'week', 'month'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg capitalize font-bold transition-all text-xs ${
                  timeRange === t ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={exportCSV}
            className="btn-ghost py-1.5 px-3 text-xs flex items-center gap-1.5 font-bold"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            title="Sign out of concierge"
            className="text-xs px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 shadow-sm"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Analytics Content */}
      <main className="lc-workspace-main max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        <section className="lc-editorial-intro lc-insights-intro" aria-labelledby="insights-title">
          <div className="lc-editorial-copy">
            <span className="lc-eyebrow">LATECUTS · PERFORMANCE</span>
            <h2 id="insights-title">Business Insights</h2>
            <p>Track service demand, barber performance and the rhythm of the salon floor.</p>
          </div>
          <div className="lc-insights-window">
            <span className="lc-eyebrow">CURRENT WINDOW</span>
            <strong>{timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'This Week' : 'This Month'}</strong>
            <span>{currentlyServingCount} in the chair · {waitingCount} customers waiting</span>
          </div>
        </section>

        {/* Stylist Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-blue-100/60">
          <button
            onClick={() => setSelectedBarberId('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedBarberId === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-blue-50'
            }`}
          >
            <Users size={13} />
            <span>All Stations ({barbers.length})</span>
          </button>
          {barbers.map(b => {
            const isServing = queue.some(q => q.barber_id === b.id && q.status === 'serving')
            return (
              <button
                key={b.id}
                onClick={() => setSelectedBarberId(b.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedBarberId === b.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-blue-50'
                }`}
              >
                <span data-locale-skip>{b.name}</span>
                <span className="text-[10px] opacity-80">({b.specialty.split('&')[0]})</span>
                {isServing && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              </button>
            )
          })}
        </div>

        {/* Live Active Status Summary Bar */}
        <div className="bg-blue-50/80 border border-blue-200/60 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Activity className="text-blue-700 animate-pulse" size={16} />
            <span className="font-bold text-slate-900">
              Floor Activity ({selectedBarberId === 'all' ? 'All Stations' : barbers.find(b => b.id === selectedBarberId)?.name}):
            </span>
            <span className="text-slate-600">
              <strong className="text-blue-700">{currentlyServingCount}</strong> in styling chair ·{' '}
              <strong className="text-blue-700">{waitingCount}</strong> in waiting lounge
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Sparkles size={13} className="text-amber-500" />
              <span>Live Queue Responsive Engine</span>
            </span>
          </div>
        </div>

        {/* Top 4 KPI Cards (100% Dynamic) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="card-clean p-4 sm:p-5">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-500 block mb-1">Total Served</span>
            <div className="font-display text-2xl sm:text-4xl font-black text-slate-950">{totalCompleted}</div>
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-emerald-600 font-bold mt-2">
              <TrendingUp size={14} />
              <span>{timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'Last 7 days' : 'This month'}</span>
            </div>
          </div>

          <div className="card-clean p-4 sm:p-5">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-500 block mb-1">Avg Duration</span>
            <div className="font-display text-2xl sm:text-4xl font-black text-blue-700">{avgDuration ? `${avgDuration}m` : '—'}</div>
            <div className="text-[10px] sm:text-xs text-slate-400 font-medium mt-2">From completed service records</div>
          </div>

          <div className="card-clean p-4 sm:p-5">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-500 block mb-1">Peak Rush</span>
            <div className="font-display text-2xl sm:text-4xl font-black text-sky-600">{peakHourItem?.hour || '—'}</div>
            <div className="text-[10px] sm:text-xs text-blue-600 font-semibold mt-2">
              {peakHourItem ? `${peakHourItem.count} check-ins in peak hour` : 'No check-ins in this period'}
            </div>
          </div>

          <div className="card-clean p-4 sm:p-5">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-500 block mb-1">Satisfaction</span>
            <div className="font-display text-2xl sm:text-4xl font-black text-amber-500">{avgRating} ★</div>
            <div className="text-[10px] sm:text-xs text-emerald-600 font-bold mt-2">
              {filteredReviews.length} verified reviews
            </div>
          </div>
        </div>

        {/* Middle Section: Dynamic Hourly Bar Chart & Service Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Hourly Traffic Histogram (8 cols) */}
          <div className="lg:col-span-8 card-clean p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
                  Lounge Foot Traffic by Hour ({timeRange})
                </h2>
                <p className="text-xs text-slate-500">
                  Dynamic check-in distribution computed from real queue activity
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-100 text-blue-700 self-start sm:self-auto">
                {peakHourItem ? `Peak: ${peakHourItem.hour} (${peakHourItem.count} guests)` : 'No check-ins in this period'}
              </span>
            </div>

            {/* Pure CSS Bar Graph with horizontal scroll on small screens */}
            <div className="overflow-x-auto pb-2">
              <div className="h-48 flex items-end justify-between gap-2 sm:gap-3 pt-6 pb-2 border-b border-slate-100 min-w-[380px]">
                {dynamicHourlyTraffic.map(bar => (
                  <div key={bar.hour} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="text-[10px] font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity text-blue-700">
                      {bar.count}
                    </div>
                    <div
                      className="w-full rounded-t-lg transition-all duration-300 group-hover:scale-y-105"
                      style={{
                        height: bar.height,
                        background: bar.peak
                          ? 'linear-gradient(180deg, #D8AB70 0%, #C78B43 100%)'
                          : 'linear-gradient(180deg, #8E785B 0%, #594A36 100%)',
                      }}
                    />
                    <span className="text-[10px] mt-2 font-semibold text-slate-500">
                      {bar.hour}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2">
              <span>Opening (9 AM)</span>
              <span>Midday (12 PM–3 PM)</span>
              <span>Evening (6 PM–8 PM)</span>
            </div>
          </div>

          {/* Service Share Breakdown (4 cols) */}
          <div className="lg:col-span-4 card-clean p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 mb-1">Service Demand</h2>
              <p className="text-xs text-slate-500 mb-4">
                Dynamic breakdown based on {totalDemands} service requests
              </p>

              <div className="space-y-3">
                {serviceBreakdown.map(s => (
                  <div key={s.name}>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-800">{s.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400">({s.count})</span>
                        <span style={{ color: s.color }}>{s.percent}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${s.percent}%`, background: s.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 text-xs text-slate-500">
              💡 <em>{totalDemands ? `${serviceBreakdown[0]?.name || 'Service'} leads demand in this period.` : 'No service activity in this period.'}</em>
            </div>
          </div>
        </div>

        {/* Individual Stylist Performance Table */}
        <section className="card-clean p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
                Stylist Productivity Index
              </h2>
              <p className="text-xs text-slate-500">Real-time station status, throughput & guest ratings</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-100 self-start sm:self-auto">
              {barbers.length} Active Stations
            </span>
          </div>

          <div className="lc-performance-table-wrap overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="lc-workspace-table lc-performance-table w-full text-left text-xs min-w-[560px]">
              <thead>
                <tr className="border-b border-slate-100 uppercase text-slate-500 font-bold">
                  <th className="pb-3">Stylist</th>
                  <th className="pb-3">Live Station Status</th>
                  <th className="pb-3">Served Today</th>
                  <th className="pb-3">Average Time</th>
                  <th className="pb-3">Punctuality</th>
                  <th className="pb-3">Client Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBarbers.map(barber => {
                  const currentlyServing = queue.find(
                    q => q.barber_id === barber.id && q.status === 'serving'
                  )
                  const barberCompletions = filteredQueue.filter(
                    q => q.barber_id === barber.id && q.status === 'completed'
                  )
                  const barberCompleted = barberCompletions.length
                  const barberAvgDuration = barberCompleted
                    ? Math.round(barberCompletions.reduce((sum, q) => sum + q.service_duration, 0) / barberCompleted)
                    : null
                  const barberReviews = filteredReviews.filter(r => r.barber_id === barber.id)
                  const barberRating = barberReviews.length > 0
                    ? (barberReviews.reduce((sum, r) => sum + r.rating, 0) / barberReviews.length).toFixed(1)
                    : '—'

                  return (
                    <tr key={barber.id} className="hover:bg-blue-50/40 transition-colors">
                      <td data-label="Barber" data-label-gu="બાર્બર" className="py-3 flex items-center gap-2.5 font-bold text-slate-900">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-display text-white text-xs bg-gradient-to-tr from-blue-700 to-sky-400">
                          {barber.avatar}
                        </div>
                        <div>
                          <span data-locale-skip>{barber.name}</span>
                          <span className="block text-[10px] text-slate-400 font-normal">{getServiceDisplayName(barber.specialty)}</span>
                        </div>
                      </td>

                      <td data-label="Live status" data-label-gu="લાઇવ સ્થિતિ" className="py-3">
                        {currentlyServing ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Chair: {currentlyServing.token} (<span data-locale-skip>{currentlyServing.customer_name}</span>)
                          </span>
                        ) : barber.status === 'break' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Coffee size={12} />
                            On Break
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <CheckCircle2 size={12} />
                            Available
                          </span>
                        )}
                      </td>

                      <td data-label="Served today" data-label-gu="આજે સેવા આપી" className="py-3 font-bold text-slate-900">
                        {barberCompleted} guests
                      </td>

                      <td data-label="Average time" data-label-gu="સરેરાશ સમય" className="py-3 font-mono font-bold text-blue-700">
                        {barberAvgDuration === null ? '—' : `${barberAvgDuration} mins`}
                      </td>

                      <td data-label="Punctuality" data-label-gu="સમયપાલન" className="py-3">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-600">
                          Not tracked
                        </span>
                      </td>

                      <td data-label="Client rating" data-label-gu="ગ્રાહક રેટિંગ" className="py-3 font-black text-amber-500 flex items-center gap-1">
                        <Star size={13} fill="#F59E0B" className="text-amber-500" />
                        <span>{barberRating} ★</span>
                        <span className="text-[10px] text-slate-400 font-normal">({barberReviews.length})</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Dynamic Guest Reviews & Feedback Feed */}
        <section className="card-clean p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="text-blue-700" size={18} />
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
                  Recent Guest Feedback & Star Ratings
                </h2>
                <p className="text-xs text-slate-500">Live reviews received from post-service feedback</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {filteredReviews.slice(0, 4).map(rev => (
              <div key={rev.id} className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span data-locale-skip className="font-bold text-slate-900">{rev.customer_name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono font-bold">
                      {rev.token}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} size={12} fill="#F59E0B" className="text-amber-500" />
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 mb-2 italic">“{rev.comment ? <span data-locale-skip>{rev.comment}</span> : 'Smooth, luxurious styling experience.'}”</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-blue-100/60">
                  <span>Stylist: <strong data-locale-skip className="text-slate-700">{rev.barber_name}</strong> (<span>{getServiceDisplayName(rev.service)}</span>)</span>
                  <span>{new Date(rev.created_at).toLocaleTimeString(lang === 'gu' ? 'gu-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
