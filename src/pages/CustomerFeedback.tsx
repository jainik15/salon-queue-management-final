import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQueueStore } from '../stores/queueStore'
import { triggerConfetti } from '../lib/confetti'
import { getServiceDisplayName } from '../lib/utils'
import { Scissors, Star, ThumbsUp, ThumbsDown, CheckCircle, ArrowRight, Heart } from 'lucide-react'

export default function CustomerFeedback() {
  const { token } = useParams<{ token: string }>()
  const { queue, addFeedback } = useQueueStore()

  const entry = queue.find(e => e.token.toLowerCase() === (token || '').toLowerCase()) ||
                queue.find(e => e.status === 'completed') ||
                queue[0]

  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [aspects, setAspects] = useState<{ waitTime: boolean | null; styling: boolean | null; ambiance: boolean | null }>({
    waitTime: null,
    styling: null,
    ambiance: null,
  })
  const [submitted, setSubmitted] = useState(false)

  const ratingLabels: { [k: number]: string } = {
    1: 'Needs Improvement',
    2: 'Below Expectations',
    3: 'Satisfactory Experience',
    4: 'Great Cut & Service',
    5: 'Exceptional Luxury Craftsmanship ✨',
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    triggerConfetti()
    addFeedback({
      token: entry?.token || 'LX-07',
      customer_name: entry?.customer_name || 'Guest Patron',
      barber_id: entry?.barber_id || 'marcus',
      barber_name: entry?.barber_name || 'Vinod',
      service: entry?.service || 'Fade',
      rating,
      comment: comment.trim() || undefined,
      aspects,
    })
  }

  return (
    <div
      className="lc-screen lc-feedback min-h-screen flex flex-col justify-between p-4 sm:p-6 select-none text-slate-800"
    >
      {/* Top Header */}
      <nav className="flex items-center justify-between max-w-lg mx-auto w-full pt-2 sm:pt-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-tr from-blue-700 to-sky-400 text-white shadow-sm">
            <Scissors size={16} />
          </div>
          <span className="font-display font-black text-slate-950 tracking-tight">LateCuts</span>
        </div>
        <span className="text-xs px-3 py-1 rounded-full font-bold bg-blue-100 text-blue-700">
          Guest Review
        </span>
      </nav>

      {/* Main Feedback Card */}
      <main className="max-w-md mx-auto w-full py-4 sm:py-8">
        {!submitted ? (
          <div
            className="rounded-3xl p-5 sm:p-8 bg-white border border-blue-100 shadow-xl shadow-blue-500/10 animate-slide-up"
          >
            {/* Patron Summary */}
            <div className="text-center mb-6">
              <span className="text-xs uppercase tracking-widest font-mono font-bold px-3 py-1 rounded-lg inline-block mb-3 bg-blue-50 text-blue-700 border border-blue-100">
                TOKEN: {entry?.token || 'LX-07'}
              </span>
              <h1 className="font-display text-3xl font-black text-slate-950">How was your visit?</h1>
              <p className="text-xs text-slate-500 mt-1">
                Styled by <strong data-locale-skip className="text-slate-900">{entry?.barber_name || 'Vinod'}</strong> · <span>{getServiceDisplayName(entry?.service || 'Fade')}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Star Rating Section */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map(star => {
                    const isFilled = (hoverRating || rating) >= star
                    return (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          size={34}
                          className="transition-colors"
                          fill={isFilled ? '#2563EB' : 'none'}
                          stroke={isFilled ? '#2563EB' : '#CBD5E1'}
                        />
                      </button>
                    )
                  })}
                </div>
                <div className="text-xs font-bold text-blue-700 h-4">
                  {ratingLabels[hoverRating || rating]}
                </div>
              </div>

              {/* Specific Attributes */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Rate Salon Aspects
                </span>

                {[
                  { key: 'waitTime', label: 'Wait Time & Accuracy' },
                  { key: 'styling', label: 'Stylist Cut & Craft' },
                  { key: 'ambiance', label: 'Lounge Atmosphere' },
                ].map(aspect => (
                  <div key={aspect.key} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-blue-50/50">
                    <span className="font-semibold text-slate-800">{aspect.label}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAspects(prev => ({ ...prev, [aspect.key]: true }))}
                        className={`p-1.5 rounded-lg transition-colors ${
                          aspects[aspect.key as keyof typeof aspects] === true
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <ThumbsUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAspects(prev => ({ ...prev, [aspect.key]: false }))}
                        className={`p-1.5 rounded-lg transition-colors ${
                          aspects[aspect.key as keyof typeof aspects] === false
                            ? 'bg-rose-600 text-white'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <ThumbsDown size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Review Text */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Notes or Compliments (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value.slice(0, 280))}
                  placeholder="Share feedback on today's style and hospitality..."
                  rows={3}
                  className="input-clean text-xs resize-none"
                />
                <div className="text-right text-[10px] text-slate-400 mt-1">
                  {comment.length} / 280
                </div>
              </div>

              <button type="submit" className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-sm font-bold">
                <span>Submit Experience</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        ) : (
          <div
            className="rounded-3xl p-8 text-center bg-white border border-blue-100 shadow-xl shadow-blue-500/10 animate-slide-up"
          >
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-emerald-100 text-emerald-600">
              <CheckCircle size={32} />
            </div>

            <h2 className="font-display text-3xl font-black text-slate-950 mb-2">Thank you, {entry?.customer_name ? <span data-locale-skip>{entry.customer_name}</span> : 'Guest'}!</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-6">
              Your feedback helps us continuously perfect our craft. We look forward to seeing you again.
            </p>

            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
              <Heart size={14} className="text-blue-600 fill-blue-600" />
              <span>Own your look & enjoy your day!</span>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100">
              <Link to="/join" className="text-xs font-bold text-blue-700 hover:text-blue-900">
                ← Return to Lounge Check-In
              </Link>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center text-xs pb-2 text-slate-400">
        LateCuts · Concierge Guest Experience
      </footer>
    </div>
  )
}
