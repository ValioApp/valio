import { createClient } from '@/lib/supabase/server'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { Hero } from '@/components/landing/Hero'
import { TrustStrip } from '@/components/landing/TrustStrip'
import { PortalesSection } from '@/components/landing/PortalesSection'
import { Features } from '@/components/landing/Features'
import { Pricing } from '@/components/landing/Pricing'
import { Faq } from '@/components/landing/Faq'
import { LandingFooter } from '@/components/landing/LandingFooter'

/**
 * Landing pública editorial de VALIO (dirección "precisión editorial").
 * Server component: la cabecera se adapta a la sesión real (Supabase getUser).
 * Todo el copy vive en next-intl (`landing`/`common`); nada hardcodeado.
 */
export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="valio-grain relative flex min-h-dvh flex-col">
      <LandingHeader hasSession={Boolean(user)} />
      <main className="relative z-[1] flex-1">
        <Hero />
        <TrustStrip />
        <PortalesSection />
        <Features />
        <Pricing />
        <Faq />
      </main>
      <LandingFooter />
    </div>
  )
}
