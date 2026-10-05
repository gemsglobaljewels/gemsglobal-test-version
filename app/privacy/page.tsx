import { Metadata } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'
import { DEFAULT_PRIVACY, normalizePrivacy, LegalConfig } from '@/lib/privacy'
import LegalContent from '@/components/Legal/LegalContent'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How we collect, use and protect your personal information when you shop with us.',
  alternates: { canonical: '/privacy' },
}

async function getConfig(): Promise<LegalConfig> {
  try {
    const { data, error } = await supabaseServer
      .from('privacy')
      .select('config')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Privacy Page] GET Error:', error)
      return DEFAULT_PRIVACY
    }
    return normalizePrivacy(data?.config)
  } catch (e) {
    console.error('[Privacy Page] GET Catch Error:', e)
    return DEFAULT_PRIVACY
  }
}

export default async function PrivacyPage() {
  const config = await getConfig()
  return <LegalContent config={config} />
}
