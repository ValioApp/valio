import { Info } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function Disclaimer() {
  const t = useTranslations('result')
  return (
    <aside className="break-inside-avoid flex items-start gap-3 rounded-card border border-gold/25 bg-gold/5 p-5">
      <Info size={18} className="mt-0.5 shrink-0 text-gold-deep" aria-hidden="true" />
      <div className="space-y-1">
        <p className="label-caps text-gold-deep">{t('disclaimerTitle')}</p>
        <p className="text-sm text-muted">
          {t.rich('disclaimerBody', { b: (chunks) => <strong>{chunks}</strong> })}
        </p>
      </div>
    </aside>
  )
}
