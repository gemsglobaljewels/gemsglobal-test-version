import { Metadata } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'
import {
  DEFAULT_REPAIRS,
  normalizeRepairs,
  RepairsConfig,
} from '@/lib/repairs'
import RepairsContent from '@/components/Repairs/RepairsContent'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Jewellery Repairs & Restoration — Expert Care for Pieces You Treasure',
  description:
    'Our in-house master goldsmiths repair and restore fine jewellery: ring resizing, claw re-tipping, stone replacement, chain and clasp repair, professional cleaning, rhodium plating and heirloom restoration — with a free assessment and 12-month guarantee.',
  alternates: { canonical: '/repairs' },
  openGraph: {
    title: 'Jewellery Repairs & Restoration — Expert Care for Pieces You Treasure',
    description:
      'From a loose stone to a full restoration, our in-house workshop brings your jewellery back to its best — free assessment, transparent quotes and a 12-month repair guarantee.',
    type: 'article',
  },
}

async function getRepairs(): Promise<RepairsConfig> {
  try {
    const { data, error } = await supabaseServer
      .from('repairs')
      .select('config')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Repairs Page] GET Error:', error)
      return DEFAULT_REPAIRS
    }
    return normalizeRepairs(data?.config)
  } catch (e) {
    console.error('[Repairs Page] GET Catch Error:', e)
    return DEFAULT_REPAIRS
  }
}

export default async function RepairsPage() {
  const config = await getRepairs()
  return <RepairsContent config={config} />
}
