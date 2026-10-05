import { Metadata } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'
import {
  DEFAULT_CRAFTSMANSHIP,
  normalizeCraftsmanship,
  CraftsmanshipConfig,
} from '@/lib/craftsmanship'
import CraftsmanshipContent from '@/components/Craftsmanship/CraftsmanshipContent'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Craftsmanship — How We Make Our Bespoke Fine Jewellery',
  description:
    'From first sketch to final polish, discover how our bespoke fine jewellery is made by hand — design, CAD modelling, casting, stone-setting, polishing and hallmarking.',
  alternates: { canonical: '/craftsmanship' },
  openGraph: {
    title: 'Craftsmanship — How We Make Our Bespoke Fine Jewellery',
    description:
      'A step-by-step look inside our atelier: how every bespoke piece is designed, cast, set and finished by hand.',
    type: 'article',
  },
}

async function getCraftsmanship(): Promise<CraftsmanshipConfig> {
  try {
    const { data, error } = await supabaseServer
      .from('craftsmanship')
      .select('config')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Craftsmanship Page] GET Error:', error)
      return DEFAULT_CRAFTSMANSHIP
    }
    return normalizeCraftsmanship(data?.config)
  } catch (e) {
    console.error('[Craftsmanship Page] GET Catch Error:', e)
    return DEFAULT_CRAFTSMANSHIP
  }
}

export default async function CraftsmanshipPage() {
  const config = await getCraftsmanship()
  return <CraftsmanshipContent config={config} />
}
