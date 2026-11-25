import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQueueStore } from '../stores/queueStore'
import { getServiceDisplayName } from '../lib/utils'
import { Scissors, Clock, ChevronRight, Sparkles, Check, Zap } from 'lucide-react'
import { useLocale } from '../lib/locale'

const T = {
  en: {
    tagline: 'Your Style. Your Time.',
    headline: 'Your Grooming, Your Time.',
    sub: 'Choose your services, select your preferred barber, and join the queue with ease.',
    chooseService: 'Select Your Services',
    serviceHint: 'Choose one or more services. Your total price and estimated duration will update automatically.',
    selected: 'Selected',
    servicesLoading: 'Loading services…',
    servicesError: 'We couldn’t load the service menu. Check your connection and try again.',
    servicesEmpty: 'No services are available right now. Please try again shortly.',
    servicesStale: 'The latest service menu could not be refreshed. Showing the last available menu.',
    retry: 'Retry',
    chooseBarber: 'Choose Your Stylist',
    anyBarber: 'Fastest Available Stylist',
    anyBarberSub: 'Automated queue-load balancing',
    yourName: 'Your First Name',
    namePlaceholder: 'e.g. Liam, Sophia, Rohan…',
    joinBtn: 'Join Lounge Queue',
    waiting: 'in line',
    onBreak: 'On Break',
    offline: 'Offline',
    available: 'Available',
    min: 'min',
    selectService: 'Please select at least one service',
    enterName: 'Please enter your name',
  },
  gu: {
    tagline: 'તમારી સ્ટાઇલ. તમારો સમય.',
    headline: 'તમારી સ્ટાઇલ, તમારો સમય.',
    sub: 'તમારી સેવાઓ પસંદ કરો, તમારા મનપસંદ બાર્બર પસંદ કરો અને સરળતાથી કતારમાં જોડાઓ.',
    chooseService: 'તમારી સેવાઓ પસંદ કરો',
    serviceHint: 'એક અથવા વધુ સેવાઓ પસંદ કરો. કુલ કિંમત અને અંદાજિત સમય આપમેળે અપડેટ થશે.',
    selected: 'પસંદગી',
    servicesLoading: 'સેવાઓ લોડ થઈ રહી છે…',
    servicesError: 'સેવા યાદી લોડ થઈ શકી નથી. તમારું કનેક્શન તપાસીને ફરી પ્રયાસ કરો.',
    servicesEmpty: 'હાલમાં કોઈ સેવા ઉપલબ્ધ નથી. કૃપા કરીને થોડી વાર પછી ફરી પ્રયાસ કરો.',
    servicesStale: 'નવી સેવા યાદી લોડ થઈ શકી નથી. છેલ્લે ઉપલબ્ધ યાદી બતાવવામાં આવી રહી છે.',
    retry: 'ફરી પ્રયાસ કરો',
    chooseBarber: 'તમારા સ્ટાઇલિસ્ટ પસંદ કરો',
    anyBarber: 'સૌથી વહેલા ઉપલબ્ધ સ્ટાઇલિસ્ટ',
    anyBarberSub: 'કતાર મુજબ આપમેળે ફાળવણી',
    yourName: 'તમારું નામ',
    namePlaceholder: 'તમારું નામ લખો',
    joinBtn: 'કતારમાં જોડાઓ',
    waiting: 'કતારમાં',
    onBreak: 'વિરામ પર',
    offline: 'ઉપલબ્ધ નથી',
    available: 'ઉપલબ્ધ',
    min: 'મિનિટ',
    selectService: 'ઓછામાં ઓછી એક સેવા પસંદ કરો',
    enterName: 'તમારું નામ દાખલ કરો',
  }
}

export default function JoinQueue() {
  const navigate = useNavigate()
  const { barbers, services, servicesStatus, refreshServices, addToQueue } = useQueueStore()
  const { lang, setLang } = useLocale()
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(['classic-cut'])
  const [selectedBarber, setSelectedBarber] = useState<string>('any')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)
  const joinRequestId = useRef('')
  const t = T[lang]

  useEffect(() => {
    if (servicesStatus === 'loading') return
    setSelectedServiceIds(current => {
      const validSelection = current.filter(id => services.some(service => service.id === id))
      if (validSelection.length > 0) return validSelection
      if (services.length === 0) return []
      const defaultService = services.find(service => service.id === 'classic-cut') || services[0]
      return [defaultService.id]
    })
  }, [services, servicesStatus])

  // Toggle multi-service
  const toggleService = (id: string) => {
    setSelectedServiceIds(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev // keep at least one selected
        return prev.filter(s => s !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const selectedServices = services.filter(s => selectedServiceIds.includes(s.id))
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0)
  const serviceSummaryName = selectedServices.map(s => (lang === 'en' ? s.name_en : s.name_gu)).join(' + ')

  // Dynamic Stylist Recommendation based on selected services
  const recommendedBarber = (() => {
    const selectedIds = selectedServices.map(service => service.id)
    if (selectedIds.includes('bridal') || selectedIds.includes('head-spa')) return 'zara'
    if (selectedIds.includes('royal-fade') || selectedIds.includes('classic-cut')) return 'marcus'
    if (selectedIds.includes('beard-sculpt') || selectedIds.includes('kids-cut')) return 'dev'
    return 'marcus'
  })()

  const handleJoin = async () => {
    if (servicesStatus === 'loading') return setError(t.servicesLoading)
    if (servicesStatus === 'empty') return setError(t.servicesEmpty)
    if (servicesStatus === 'error') return setError(services.length > 0 ? t.servicesStale : t.servicesError)
    if (selectedServices.length === 0) return setError(t.selectService)
    if (!name.trim()) return setError(t.enterName)
    setError('')
    setJoining(true)
    if (!joinRequestId.current) joinRequestId.current = crypto.randomUUID()

    const barberId = selectedBarber === 'any'
      ? barbers.filter(b => b.status === 'available').sort((a, b) => a.queue_count - b.queue_count)[0]?.id || recommendedBarber
      : selectedBarber

    const barber = barbers.find(b => b.id === barberId)!

    try {
      const entry = await addToQueue({
        customer_name: name.trim(),
        service: serviceSummaryName,
        service_duration: totalDuration,
        barber_id: barberId,
        barber_name: barber?.name || '',
        language: lang,
        service_ids: selectedServices.map(service => service.id),
        join_request_id: joinRequestId.current,
      })
      if (!entry.public_access_token) throw new Error('The queue pass could not be created. Please try again.')
      joinRequestId.current = ''
      setTimeout(() => navigate(`/token/${entry.public_access_token}`), 400)
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'The queue could not be joined. Please try again.')
      setJoining(false)
    }
  }

  return (
    <div className="lc-screen lc-checkin min-h-screen text-slate-800">
      
      {/* Top Navigation */}
      <nav className="flex w-full min-w-0 items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 max-w-4xl mx-auto border-b border-blue-100/80 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center bg-[#a88b58] text-[#171512] flex-shrink-0">
            <Scissors size={18} />
          </div>
          <div className="min-w-0">
            <div className="font-display font-black text-[#f2eee6] text-lg sm:text-xl tracking-tight leading-none whitespace-nowrap">
              Late<span className="text-[#c4a56a]">Cuts</span>
            </div>
            <div className="max-w-[11rem] sm:max-w-none text-[10px] sm:text-[11px] font-medium text-[#c4a56a] tracking-wide leading-tight mt-1">{t.tagline}</div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            onClick={() => setLang(lang === 'en' ? 'gu' : 'en')}
            className="lc-language-switch min-h-10 whitespace-nowrap text-xs"
          >
            {lang === 'en' ? 'ગુજરાતી' : 'EN'}
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-16">
        
        {/* Hero Section */}
        <div className="mt-2 sm:mt-4 mb-6 sm:mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-full mb-3 sm:mb-4 bg-blue-100/90 text-blue-700 border border-blue-200/80 shadow-sm">
            <Sparkles size={13} className="text-blue-600 animate-spin-slow" />
            <span>Digital Concierge · Real-Time Calculation</span>
          </div>

          <h1 className="font-display w-full max-w-2xl break-words text-[2rem] sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-[1.15] mb-3">
            {t.headline}
          </h1>
          <p className="w-full max-w-2xl break-words text-xs sm:text-sm text-slate-600 leading-relaxed">{t.sub}</p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-2 shadow-sm animate-slide-up">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic Multi-Service Picker */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">{t.chooseService}</h2>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              {selectedServices.length} {t.selected}
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">{t.serviceHint}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
            {servicesStatus === 'loading' && services.length === 0 && (
              <div className="sm:col-span-2 md:col-span-3 rounded-2xl border border-blue-100 bg-white/80 p-5 text-sm text-slate-600" role="status" aria-live="polite">
                {t.servicesLoading}
              </div>
            )}
            {servicesStatus === 'error' && services.length === 0 && (
              <div className="sm:col-span-2 md:col-span-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert">
                <p>{t.servicesError}</p>
                <button type="button" onClick={() => void refreshServices()} className="mt-3 min-h-10 rounded-xl border border-rose-300 px-4 font-semibold hover:bg-rose-100">
                  {t.retry}
                </button>
              </div>
            )}
            {servicesStatus === 'empty' && services.length === 0 && (
              <div className="sm:col-span-2 md:col-span-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900" role="status">
                <p>{t.servicesEmpty}</p>
                <button type="button" onClick={() => void refreshServices()} className="mt-3 min-h-10 rounded-xl border border-amber-300 px-4 font-semibold hover:bg-amber-100">
                  {t.retry}
                </button>
              </div>
            )}
            {servicesStatus === 'error' && services.length > 0 && (
              <div className="sm:col-span-2 md:col-span-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>{t.servicesStale}</span>
                  <button type="button" onClick={() => void refreshServices()} className="min-h-10 rounded-xl border border-amber-300 px-4 font-semibold hover:bg-amber-100">
                    {t.retry}
                  </button>
                </div>
              </div>
            )}
            {services.map(svc => {
              const active = selectedServiceIds.includes(svc.id)
              return (
                <button
                  key={svc.id}
                  onClick={() => toggleService(svc.id)}
                  className={`text-left p-4 rounded-2xl transition-all duration-200 relative group border ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30 scale-[1.02]'
                      : 'bg-white/90 hover:bg-blue-50/70 border-slate-200/90 text-slate-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{svc.icon}</span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-xs transition-all ${
                      active ? 'bg-white text-blue-700 border-white' : 'border-slate-300'
                    }`}>
                      {active && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>

                  <div className={`text-sm font-bold leading-tight ${active ? 'text-white' : 'text-slate-900'}`}>
                    {lang === 'en' ? svc.name_en : svc.name_gu}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/30">
                    <div className="flex items-center gap-1 text-xs">
                      <Clock size={12} className={active ? 'text-blue-100' : 'text-blue-600'} />
                      <span className={active ? 'text-blue-100' : 'text-slate-500'}>
                        {svc.duration} {t.min}
                      </span>
                    </div>
                    <span className={`text-xs font-black ${active ? 'text-white' : 'text-blue-700'}`}>
                      ₹{svc.price}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Dynamic Stylist Picker with Recommendation Tag */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-slate-900">{t.chooseBarber}</h2>
            <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
              <Zap size={13} className="text-blue-600 fill-blue-600" />
              <span>Recommended: {barbers.find(b => b.id === recommendedBarber)?.name}</span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Any barber option */}
            <button
              onClick={() => setSelectedBarber('any')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                selectedBarber === 'any'
                  ? 'bg-blue-50/90 border-blue-500 shadow-md shadow-blue-500/10'
                  : 'bg-white/90 border-slate-200 hover:border-blue-200 shadow-sm'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 bg-gradient-to-tr from-blue-600 to-sky-400 text-white shadow-sm">
                ✨
              </div>
              <div className="text-left flex-1">
                <div className="text-sm font-bold text-slate-950 flex items-center gap-2">
                  <span>{t.anyBarber}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    ⚡ Fastest
                  </span>
                </div>
                <div className="text-xs text-slate-500">{t.anyBarberSub}</div>
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                selectedBarber === 'any' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
              }`}>
                {selectedBarber === 'any' && <Check size={14} />}
              </div>
            </button>

            {/* Individual Stylists */}
            {barbers.map(barber => {
              const active = selectedBarber === barber.id
              const isAvail = barber.status === 'available'
              const isRecommended = barber.id === recommendedBarber

              return (
                <button
                  key={barber.id}
                  onClick={() => isAvail && setSelectedBarber(barber.id)}
                  disabled={!isAvail}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                    active
                      ? 'bg-blue-50/90 border-blue-500 shadow-md shadow-blue-500/10'
                      : isAvail
                      ? 'bg-white/90 border-slate-200 hover:border-blue-200 shadow-sm'
                      : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl font-display font-black text-white flex items-center justify-center text-lg flex-shrink-0 shadow-sm bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500">
                    {barber.avatar}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-950">{barber.name}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                        isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isAvail ? t.available : t.onBreak}
                      </span>
                      {isRecommended && isAvail && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="text-slate-500 truncate">{getServiceDisplayName(barber.specialty)}</span>
                      <span className="font-bold text-blue-700">{barber.queue_count} {t.waiting}</span>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    active ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                  }`}>
                    {active && <Check size={14} />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Patron Name Input */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-xl font-bold text-slate-900">{t.yourName}</h2>
            <span className="text-xs font-semibold text-blue-600">Guest Check-In</span>
          </div>

          <input
            className="input-clean text-base font-semibold"
            type="text"
            placeholder={t.namePlaceholder}
            value={name}
            maxLength={30}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
        </div>

        {/* Dynamic Live Ticker Summary Box */}
        <div className="mb-6 p-5 rounded-3xl bg-gradient-to-br from-blue-50 via-white to-sky-50 border border-blue-200 shadow-md animate-slide-up">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100">
            <div>
              <span className="text-xs uppercase font-bold text-blue-600">Live Package Total</span>
              <div className="font-display font-black text-2xl text-slate-950 mt-0.5">
                ₹{totalPrice}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase font-bold text-slate-500">Est. Total Time</span>
              <div className="font-display font-black text-2xl text-blue-700 mt-0.5">
                ~{totalDuration} mins
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className="truncate pr-4">{serviceSummaryName}</span>
            <span className="text-blue-700 font-bold whitespace-nowrap">
              {selectedBarber === 'any' ? 'Shortest Line' : barbers.find(b => b.id === selectedBarber)?.name}
            </span>
          </div>
        </div>

        {/* Join CTA */}
        <button
          onClick={handleJoin}
          disabled={joining || servicesStatus !== 'ready' || selectedServices.length === 0}
          className="w-full btn-primary py-4 text-base font-bold flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {joining ? (
            <>
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Registering in Lounge Queue…</span>
            </>
          ) : (
            <>
              <span>{t.joinBtn}</span>
              <ChevronRight size={18} />
            </>
          )}
        </button>

        {/* Quick Portal Switcher */}
        <div className="flex flex-wrap justify-center gap-5 mt-8 pt-6 border-t border-blue-100 text-xs font-semibold text-slate-500">
          <Link to="/display" className="hover:text-blue-700 transition-colors">
            📺 TV Calling Board
          </Link>
          <Link to="/barber/marcus" className="hover:text-blue-700 transition-colors">
            ✂️ Stylist Cockpit
          </Link>
          <Link to="/admin" className="hover:text-blue-700 transition-colors">
            🛡️ Admin Concierge
          </Link>
          <Link to="/analytics" className="hover:text-blue-700 transition-colors">
            📊 Analytics
          </Link>
        </div>

      </div>
    </div>
  )
}
