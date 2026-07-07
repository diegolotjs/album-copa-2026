import { useToast } from '../lib/toast'

export default function Toast() {
  const msg = useToast((s) => s.msg)
  if (!msg) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/85 px-4 py-2 text-sm text-white shadow-lg"
    >
      {msg}
    </div>
  )
}
