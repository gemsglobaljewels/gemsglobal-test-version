import { Metadata } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'
import {
  DEFAULT_CONTACT_US,
  normalizeContactUs,
  ContactUsConfig,
} from '@/lib/contactUs'
import ContactUsContent from '@/components/Contact/ContactUsContent'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Contact Us — We Would Love to Hear From You',
  description:
    'Questions about a piece, an order or a bespoke commission? Reach our jewellery specialists by email, book an appointment, or send us a message — we reply personally, usually within one business day.',
  alternates: { canonical: '/contact-us' },
  openGraph: {
    title: 'Contact Us — We Would Love to Hear From You',
    description:
      'Email support, customer care hours, custom order and personalization help — our team replies personally, usually within one business day.',
    type: 'website',
  },
}

async function getConfig(): Promise<ContactUsConfig> {
  try {
    const { data, error } = await supabaseServer
      .from('contact_us')
      .select('config')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Contact Us Page] GET Error:', error)
      return DEFAULT_CONTACT_US
    }
    return normalizeContactUs(data?.config)
  } catch (e) {
    console.error('[Contact Us Page] GET Catch Error:', e)
    return DEFAULT_CONTACT_US
  }
}

export default async function ContactUsPage() {
  const config = await getConfig()
  return <ContactUsContent config={config} />
}
