import { Metadata } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'
import { DEFAULT_SHIPPING, normalizeShipping, LegalConfig } from '@/lib/shipping'
import LegalContent from '@/components/Legal/LegalContent'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description:
    'How and when your order reaches you — fully insured and beautifully packaged.',
  alternates: { canonical: '/shipping' },
}

async function getConfig(): Promise<LegalConfig> {
  try {
    const { data, error } = await supabaseServer
      .from('shipping')
      .select('config')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Shipping Page] GET Error:', error)
      return DEFAULT_SHIPPING
    }
    return normalizeShipping(data?.config)
  } catch (e) {
    console.error('[Shipping Page] GET Catch Error:', e)
    return DEFAULT_SHIPPING
  }
}

export default async function ShippingPage() {
  const config = await getConfig()
  return <LegalContent config={config} />
}
