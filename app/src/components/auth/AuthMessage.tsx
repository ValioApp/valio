import type { ReactNode } from 'react'
import { AlertCircle, MailCheck } from 'lucide-react'

/** Banner de estado (éxito/error) accesible para los formularios de auth. */
export function AuthMessage({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  const isSuccess = tone === 'success'
  const Icon = isSuccess ? MailCheck : AlertCircle
  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 rounded-card border p-3 text-sm ${
        isSuccess ? 'border-success/25 bg-success/5 text-success' : 'border-error/25 bg-error/5 text-error'
      }`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  )
}
