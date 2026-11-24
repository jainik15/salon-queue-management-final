import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ArrowRight, Moon, Sparkles, Calendar, Bell } from 'lucide-react'
import { useLocale } from '../lib/locale'

export default function QueueClosed() {
  const { lang } = useLocale()
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [currentTime, setCurrentTime] = useState<string>('')
  const [currentDate, setCurrentDate] = useState<string>('')

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const dateLocale = lang === 'gu' ? 'gu-IN' : 'en-IN'
      setCurrentTime(now.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setCurrentDate(now.toLocaleDateString(dateLocale, { weekday: 'long', month: 'short', day: 'numeric' }))

      // Next reopening target: 9:00 AM tomorrow
      const nextOpen = new Date(now)
      if (now.getHours() >= 9) {
        nextOpen.setDate(nextOpen.getDate() + 1)
      }
      nextOpen.setHours(9, 0, 0, 0)

      const diff = Math.max(0, nextOpen.getTime() - now.getTime())
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ hours, minutes, seconds })
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [lang])

  return (
    <div
      className="lc-screen lc-closed min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none text-slate-800 relative overflow-hidden"
    >
      {/* Dynamic ambient living orbs */}
      <div className="ambient-bg" />

      <div
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-5 bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-400 text-white shadow-xl shadow-blue-500/25 animate-float relative z-10"
      >
        <Moon className="w-8 h-8 sm:w-9 sm:h-9" />
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold mb-3 bg-blue-100 text-blue-800 border border-blue-200 relative z-10">
        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
        <span>Queue Closed For The Evening</span>
      </div>

      <h1 className="font-display text-3xl sm:text-5xl font-black text-slate-950 mb-2 px-2 relative z-10">
        Lounge Shears at Rest 🌙
      </h1>

      <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mb-5 leading-relaxed px-3 relative z-10">
        Our digital check-in closes 30 minutes before salon closing to ensure every guest in the styling chair receives complete, unhurried attention.
      </p>

      {/* Dynamic Live Countdown Box */}
      <div className="card-clean max-w-sm w-full p-4 sm:p-5 text-center mb-4 shadow-lg border border-blue-200/80 bg-white/95 backdrop-blur-md relative z-10">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-3">
          <Sparkles size={14} className="text-amber-500" />
          <span>Doors Reopen Tomorrow at 9:00 AM</span>
        </div>

        {/* Dynamic Countdown Digits */}
        <div className="grid grid-cols-3 gap-2 py-2">
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100">
            <span className="font-display text-2xl sm:text-3xl font-black text-blue-700 block">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Hours</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100">
            <span className="font-display text-2xl sm:text-3xl font-black text-blue-700 block">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Mins</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100">
            <span className="font-display text-2xl sm:text-3xl font-black text-sky-600 block">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Secs</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{currentDate}</span>
          </span>
          <span className="flex items-center gap-1 font-mono font-bold text-slate-600">
            <Clock size={12} />
            <span>{currentTime}</span>
          </span>
        </div>
      </div>

      {/* Operating Hours Card in Blue & White */}
      <div className="card-clean max-w-sm w-full p-4 sm:p-5 text-left mb-6 shadow-sm border border-slate-100 relative z-10">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2.5 text-blue-700">
          <Bell size={14} />
          <span>Lounge Operating Hours</span>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center gap-2">
            <span className="text-slate-500">Monday – Friday:</span>
            <strong className="text-slate-900 font-bold whitespace-nowrap">9:00 AM – 9:00 PM</strong>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-slate-500">Saturday – Sunday:</span>
            <strong className="text-slate-900 font-bold whitespace-nowrap">8:30 AM – 9:30 PM</strong>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs justify-center items-center relative z-10">
        <Link to="/display" className="btn-ghost w-full sm:w-auto py-2.5 px-5 text-xs font-bold text-center">
          View Live Board
        </Link>
        <Link to="/join" className="btn-primary w-full sm:w-auto py-2.5 px-5 text-xs font-bold flex items-center justify-center gap-1.5">
          <span>Early Lounge Entry</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
