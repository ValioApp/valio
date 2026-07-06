'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calculator, FolderOpen, LayoutDashboard, type LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/valorar', label: 'Valorar', icon: Calculator },
  { href: '/cartera', label: 'Cartera', icon: FolderOpen },
]

/** Marca VALIO: isotipo (V petrol + punto dorado) + wordmark en Geist. */
function ValioWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg
        width={compact ? 22 : 26}
        height={compact ? 22 : 26}
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M40 60L100 160L160 60"
          stroke="var(--color-petrol)"
          strokeWidth="24"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="100" cy="160" r="14" fill="var(--color-gold)" />
        <path
          d="M70 40H130"
          stroke="var(--color-petrol)"
          strokeWidth="12"
          strokeLinecap="round"
        />
      </svg>
      <span
        className={`font-display font-bold tracking-tight text-petrol-deep ${
          compact ? 'text-lg' : 'text-xl'
        }`}
      >
        VALIO
      </span>
    </span>
  )
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Shell de la app autenticada: sidebar fija 260px en desktop,
 * header + bottom-nav en móvil. /login queda fuera del shell.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-dvh w-full flex-col">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-hairline bg-white md:flex">
        <div className="px-6 py-6">
          <Link href="/dashboard" aria-label="VALIO — inicio">
            <ValioWordmark />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Navegación principal">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-card px-3 py-2.5 font-display text-sm font-medium transition-colors duration-200 ${
                  active
                    ? 'bg-petrol/10 text-petrol-deep'
                    : 'text-muted hover:bg-paper hover:text-ink'
                }`}
              >
                <Icon size={18} className={active ? 'text-petrol' : undefined} aria-hidden="true" />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-hairline px-6 py-4">
          <p className="label-caps text-muted/70">VALIO Proptech</p>
        </div>
      </aside>

      {/* Header móvil */}
      <header className="sticky top-0 z-40 border-b border-hairline bg-white/80 backdrop-blur md:hidden">
        <div className="flex items-center px-4 py-3">
          <Link href="/dashboard" aria-label="VALIO — inicio">
            <ValioWordmark compact />
          </Link>
        </div>
      </header>

      {/* Contenido (las páginas aportan su propio <main>) */}
      <div className="flex flex-1 flex-col pb-24 md:pb-0 md:pl-[260px]">{children}</div>

      {/* Bottom-nav móvil */}
      <nav
        className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-hairline bg-white px-4 pt-2 pb-4 md:hidden"
        aria-label="Navegación principal"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 rounded-card px-4 py-1.5 transition-transform duration-200 active:scale-95 ${
                active ? 'bg-petrol/10 text-petrol-deep' : 'text-muted'
              }`}
            >
              <Icon size={22} className={active ? 'text-petrol' : undefined} aria-hidden="true" />
              <span className="font-display text-[10px] font-semibold tracking-wide">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
