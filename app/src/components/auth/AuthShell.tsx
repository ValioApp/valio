import Link from 'next/link'
import type { ReactNode } from 'react'
import { ValioWordmark } from '@/components/ValioWordmark'
import { ContourMotif } from '@/components/landing/ContourMotif'

/**
 * Marco visual de las pantallas de auth (fuera del AppShell): fondo "paper" con
 * grano, motivo cartográfico sutil y tarjeta centrada con titular Fraunces.
 * Presentacional: recibe título/subtítulo ya traducidos.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <main className="valio-grain relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-12">
      <ContourMotif className="left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2" />

      <div className="relative z-[1] w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" aria-label="VALIO — inicio">
            <ValioWordmark size="lg" />
          </Link>
        </div>

        <div className="rounded-2xl border border-hairline bg-white p-8 shadow-ambient">
          <div className="mb-7 text-center">
            <h1 className="font-serif-display text-[1.9rem] font-medium leading-tight tracking-tight text-ink">
              {title}
            </h1>
            {subtitle && <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>}
          </div>
          {children}
        </div>

        {footer && <p className="mt-6 text-center text-sm text-muted">{footer}</p>}
        <p className="mt-6 text-center label-caps text-muted/50">VALIO Proptech</p>
      </div>
    </main>
  )
}
