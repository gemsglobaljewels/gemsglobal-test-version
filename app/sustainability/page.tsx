import { Metadata } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'
import {
  DEFAULT_SUSTAINABILITY,
  normalizeSustainability,
  SustainabilityConfig,
} from '@/lib/sustainability'
import SustainabilityContent from '@/components/Sustainability/SustainabilityContent'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Sustainability — Beautiful Jewellery, Made Responsibly',
  description:
    'Our commitment to responsible fine jewellery: conflict-free lab-grown diamonds, ethically sourced metals, responsible manufacturing, lasting quality, thoughtful packaging and jewellery care.',
  alternates: { canonical: '/sustainability' },
  openGraph: {
    title: 'Sustainability — Beautiful Jewellery, Made Responsibly',
    description:
      'Luxury and responsibility, hand in hand — lab-grown diamonds, ethical sourcing, responsible manufacturing and jewellery designed to last for generations.',
    type: 'article',
  },
}

async function getSustainability(): Promise<SustainabilityConfig> {
  try {
    const { data, error } = await supabaseServer
      .from('sustainability')
      .select('config')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Sustainability Page] GET Error:', error)
      return DEFAULT_SUSTAINABILITY
    }
    return normalizeSustainability(data?.config)
  } catch (e) {
    console.error('[Sustainability Page] GET Catch Error:', e)
    return DEFAULT_SUSTAINABILITY
  }
}

export default async function SustainabilityPage() {
  const config = await getSustainability()
  return <SustainabilityContent config={config} />
}
