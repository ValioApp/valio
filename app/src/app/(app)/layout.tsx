import { AppShell } from '@/components/AppShell'

/**
 * Layout del grupo (app): todas las rutas autenticadas (dashboard, valorar,
 * cartera) comparten el shell sin tocar sus URLs. /login y /auth quedan fuera.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
