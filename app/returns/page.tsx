import { Metadata } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'
import { DEFAULT_RETURNS, normalizeReturns, LegalConfig } from '@/lib/returns'
import LegalContent from '@/components/Legal/LegalContent'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Returns & Exchanges',
  description:
    'Your satisfaction matters. Here is how returns and exchanges work with us.',
  alternates: { canonical: '/returns' },
}

async function getConfig(): Promise<LegalConfig> {
  try {
    const { data, error } = await supabaseServer
      .from('returns')
      .select('config')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Returns Page] GET Error:', error)
      return DEFAULT_RETURNS
    }
    return normalizeReturns(data?.config)
  } catch (e) {
    console.error('[Returns Page] GET Catch Error:', e)
    return DEFAULT_RETURNS
  }
}

export default async function ReturnsPage() {
  const config = await getConfig()
  return <LegalContent config={config} />
}
