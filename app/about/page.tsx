import { Metadata } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'
import { DEFAULT_ABOUT, normalizeAbout, AboutConfig } from '@/lib/aboutPage'
import AboutContent from '@/components/About/AboutContent'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'About Us — Gems Global Jewels',
  description:
    'Discover the story behind Gems Global Jewels — master artisans blending traditional artistry with modern design to craft fine jewelry made to be cherished for generations.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Us — Gems Global Jewels',
    description:
      'The story behind our atelier: master craftsmanship, ethical sourcing, and jewelry made to be passed down.',
    type: 'article',
  },
}

async function getAbout(): Promise<AboutConfig> {
  try {
    const { data, error } = await supabaseServer
      .from('about_page')
      .select('config')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[About Page] GET Error:', error)
      return DEFAULT_ABOUT
    }
    return normalizeAbout(data?.config)
  } catch (e) {
    console.error('[About Page] GET Catch Error:', e)
    return DEFAULT_ABOUT
  }
}

export default async function AboutPage() {
  const config = await getAbout()
  return <AboutContent config={config} />
}
