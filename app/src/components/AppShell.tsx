'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Calculator, FolderOpen, LayoutDashboard, LogOut, type LucideIcon } from 'lucide-react'
import { ValioWordmark } from '@/components/ValioWordmark'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { logout } from '@/app/(app)/actions'

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

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Shell de la app autenticada: sidebar fija 260px en desktop,
 * header + bottom-nav en móvil. /login queda fuera del shell.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const t = useTranslations('common')

  return (
    <div className="flex min-h-dvh w-full flex-col">
      {/* Sidebar desktop */}
      <aside className="print-hidden fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-hairline bg-white md:flex">
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
        <div className="flex flex-col gap-3 border-t border-hairline px-6 py-4">
          <LanguageSwitcher />
          <form action={logout}>
            <button
              type="submit"
              className="-mx-3 flex w-[calc(100%+1.5rem)] items-center gap-3 rounded-card px-3 py-2.5 font-display text-sm font-medium text-muted transition-colors duration-200 hover:bg-paper hover:text-ink"
            >
              <LogOut size={18} aria-hidden="true" />
              {t('logout')}
            </button>
          </form>
          <p className="label-caps text-muted/70">VALIO Proptech</p>
        </div>
      </aside>

      {/* Header móvil */}
      <header className="print-hidden sticky top-0 z-40 border-b border-hairline bg-white/80 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/dashboard" aria-label="VALIO — inicio">
            <ValioWordmark size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <form action={logout}>
              <button
                type="submit"
                aria-label={t('logout')}
                className="flex h-9 w-9 items-center justify-center rounded-card text-muted transition-colors duration-200 hover:bg-paper hover:text-ink"
              >
                <LogOut size={18} aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Contenido (las páginas aportan su propio <main>) */}
      <div className="flex flex-1 flex-col pb-24 md:pb-0 md:pl-[260px]">{children}</div>

      {/* Bottom-nav móvil */}
      <nav
        className="print-hidden fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-hairline bg-white px-4 pt-2 pb-4 md:hidden"
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
