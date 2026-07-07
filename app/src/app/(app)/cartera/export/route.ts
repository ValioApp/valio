import { NextResponse } from 'next/server'
import { buildCarteraCsv } from '@/lib/csv'
import { createClient } from '@/lib/supabase/server'
import { fetchRecentValuations } from '@/lib/valuations'

/** Export CSV de la cartera de valoraciones del workspace autenticado. */
export async function GET() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const rows = await fetchRecentValuations(supabase)
    const csv = buildCarteraCsv(rows)
    const filename = `valio-cartera-${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generando el export CSV de cartera:', error)
    return NextResponse.json({ error: 'No se pudo generar el export' }, { status: 500 })
  }
}
