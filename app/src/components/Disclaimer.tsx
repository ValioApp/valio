import { Info } from 'lucide-react'

export function Disclaimer() {
  return (
    <aside className="flex items-start gap-3 rounded-card border border-gold/25 bg-gold/5 p-5">
      <Info size={18} className="mt-0.5 shrink-0 text-gold-deep" aria-hidden="true" />
      <div className="space-y-1">
        <p className="label-caps text-gold-deep">Aviso legal y metodología</p>
        <p className="text-sm text-muted">
          Valoración <strong>orientativa</strong> generada automáticamente a partir de testigos
          comparables y datos públicos. No es una tasación oficial ni sustituye el informe de una
          sociedad de tasación homologada por el Banco de España (Orden ECO/805/2003).
        </p>
      </div>
    </aside>
  )
}
