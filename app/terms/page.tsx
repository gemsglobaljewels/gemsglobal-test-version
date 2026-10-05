import { Metadata } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'
import { DEFAULT_TERMS, normalizeTerms, LegalConfig } from '@/lib/terms'
import LegalContent from '@/components/Legal/LegalContent'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'The terms that govern your use of our website and the purchase of our products.',
  alternates: { canonical: '/terms' },
}

async function getConfig(): Promise<LegalConfig> {
  try {
    const { data, error } = await supabaseServer
      .from('terms')
      .select('config')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Terms Page] GET Error:', error)
      return DEFAULT_TERMS
    }
    return normalizeTerms(data?.config)
  } catch (e) {
    console.error('[Terms Page] GET Catch Error:', e)
    return DEFAULT_TERMS
  }
}

export default async function TermsPage() {
  const config = await getConfig()
  return <LegalContent config={config} />
}
