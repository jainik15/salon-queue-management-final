import { Link } from 'react-router-dom'
import { Scissors, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      className="lc-screen lc-not-found min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-center text-slate-800"
    >
      <div
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-5 sm:mb-6 bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-400 text-white shadow-xl shadow-blue-500/25 animate-float"
      >
        <Scissors className="w-8 h-8 sm:w-10 sm:h-10" />
      </div>

      <h1 className="font-display text-5xl sm:text-7xl font-black text-slate-950 mb-2">404</h1>
      <h2 className="font-display text-xl sm:text-2xl font-bold mb-3 text-blue-700 px-2">
        Looks like this page got a bad haircut.
      </h2>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6 sm:mb-8 px-4">
        The link you followed has moved or does not exist on our lounge floor.
      </p>

      <Link
        to="/join"
        className="btn-primary inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 px-5 sm:px-6 text-xs sm:text-sm font-bold w-full max-w-xs"
      >
        <ArrowLeft size={16} />
        <span>Return to Lounge Entry</span>
      </Link>
    </div>
  )
}
