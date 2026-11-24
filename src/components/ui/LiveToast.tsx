import React, { useEffect, useState } from 'react'
import { queueBroadcast } from '../../lib/supabase'
import { getServiceDisplayName } from '../../lib/utils'
import { Bell, Sparkles, CheckCircle2, UserCheck, Scissors } from 'lucide-react'

export interface ToastMessage {
  id: string
  title: string
  description: string
  descriptionContent?: React.ReactNode
  icon: 'join' | 'call' | 'done' | 'info'
  timestamp: number
}

export const LiveToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => {
    const newToast: ToastMessage = {
      ...toast,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    }
    setToasts(prev => [newToast, ...prev.slice(0, 3)]) // keep max 4 toasts

    // Auto-dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id))
    }, 4500)
  }

  useEffect(() => {
    const channel = queueBroadcast
    if (!channel) return

    const handleBroadcast = (event: MessageEvent) => {
      const { action, payload } = event.data || {}
      if (action === 'ADD_ENTRY') {
        const last = payload?.queue?.[payload?.queue?.length - 1]
        if (last) {
          addToast({
            title: `New Guest Checked In · ${last.token}`,
            description: `${last.customer_name} joined line for ${getServiceDisplayName(last.service)} (${last.barber_name})`,
            descriptionContent: <><span data-locale-skip>{last.customer_name}</span> joined line for <span>{getServiceDisplayName(last.service)}</span> (<span data-locale-skip>{last.barber_name}</span>)</>,
            icon: 'join',
          })
        }
      } else if (action === 'CALL_NEXT') {
        addToast({
          title: `Station Calling Patron`,
          description: `Summoning next patron to station`,
          icon: 'call',
        })
      } else if (action === 'MARK_DONE') {
        addToast({
          title: `Service Completed ✨`,
          description: `Station ready for next patron`,
          icon: 'done',
        })
      }
    }

    channel.addEventListener('message', handleBroadcast)
    return () => {
      channel.removeEventListener('message', handleBroadcast)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="pointer-events-auto p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-blue-200/80 shadow-xl shadow-blue-500/10 flex items-start gap-3 animate-slide-up transition-all"
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm ${
            toast.icon === 'join'
              ? 'bg-gradient-to-tr from-blue-700 to-sky-400'
              : toast.icon === 'call'
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-400'
              : 'bg-gradient-to-tr from-blue-600 to-indigo-600'
          }`}>
            {toast.icon === 'join' && <Sparkles size={16} />}
            {toast.icon === 'call' && <UserCheck size={16} />}
            {toast.icon === 'done' && <CheckCircle2 size={16} />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 truncate">{toast.title}</h4>
              <span className="text-[10px] text-blue-600 font-semibold ml-2">Just now</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">{toast.descriptionContent || toast.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
