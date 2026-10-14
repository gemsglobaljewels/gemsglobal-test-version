import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { createClient } from '@supabase/supabase-js'

import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import ClientProviders from '@/components/ClientProviders'

// Self-hosted (public/fonts, OFL-licensed latin woff2) — identical families,
// weights and CSS variables as before, but the build no longer downloads
// anything from Google Fonts, so deploys never fail on font fetching.
const cormorant = localFont({
  src: [
    { path: '../public/fonts/cormorant-garamond-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: '../public/fonts/cormorant-garamond-latin-300-italic.woff2', weight: '300', style: 'italic' },
    { path: '../public/fonts/cormorant-garamond-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/cormorant-garamond-latin-400-italic.woff2', weight: '400', style: 'italic' },
    { path: '../public/fonts/cormorant-garamond-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/cormorant-garamond-latin-500-italic.woff2', weight: '500', style: 'italic' },
    { path: '../public/fonts/cormorant-garamond-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/cormorant-garamond-latin-600-italic.woff2', weight: '600', style: 'italic' },
    { path: '../public/fonts/cormorant-garamond-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../public/fonts/cormorant-garamond-latin-700-italic.woff2', weight: '700', style: 'italic' },
  ],
  variable: '--font-cormorant',
  display: 'swap',
})

const bodoni = localFont({
  src: [
    { path: '../public/fonts/bodoni-moda-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/bodoni-moda-latin-400-italic.woff2', weight: '400', style: 'italic' },
    { path: '../public/fonts/bodoni-moda-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../public/fonts/bodoni-moda-latin-700-italic.woff2', weight: '700', style: 'italic' },
    { path: '../public/fonts/bodoni-moda-latin-900-normal.woff2', weight: '900', style: 'normal' },
    { path: '../public/fonts/bodoni-moda-latin-900-italic.woff2', weight: '900', style: 'italic' },
  ],
  variable: '--font-bodoni',
  display: 'swap',
})

const dmsans = localFont({
  src: [
    { path: '../public/fonts/dm-sans-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: '../public/fonts/dm-sans-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/dm-sans-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/dm-sans-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/dm-sans-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../public/fonts/dm-sans-latin-800-normal.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-dmsans',
  display: 'swap',
})

// Dynamic Metadata Generation
export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: settingsData } = await supabase
    .from('site_settings')
    .select('key, value')

  const settings: any = settingsData?.reduce((acc: any, item: any) => {
    acc[item.key] = item.value
    return acc
  }, {}) || {}

  const title = settings.site_title || 'Best Gold & Diamond Jewelry in Surat | Gems Global Jewels'
  const description = settings.site_description || 'Gems Global Jewels offers premium diamond jewelry, authentic gold ornaments, and exclusive bridal collections in Surat. Top-rated jewelry shop for handcrafted rings, necklaces, and custom designs.'
  const keywords = settings.site_keywords || 'best gold in surat, best jewelry in surat, best jewels in surat, top jewelry shop in surat, luxury diamond jewelry, handcrafted rings surat, bridal jewelry collections, custom gold ornaments, gems global jewels, engagement rings india, authentic gold jewelry'
  const favicon = settings.favicon_url || '/favicon.ico'
  const siteName = settings.site_name || 'Gems Global Jewels'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gemsglobaljewels.com'

  return {
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    keywords,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: '/',
      languages: {
        'en-IN': '/',
        'en-US': '/',
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName,
      locale: 'en_IN',
      type: 'website',
      images: [
        {
          url: `${siteUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/og-image.jpg`],
      creator: '@gemsglobaljewels',
    },
    verification: {
      google: 'your-google-verification-code', // User can update this in settings
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${cormorant.variable} ${bodoni.variable} ${dmsans.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://ik.imagekit.io" />
        <link rel="preconnect" href="https://pub-5f3798d6e2094791979a906bcf260a07.r2.dev" />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "JewelryStore",
              "name": "Gems Global Jewels",
              "image": "https://gemsglobaljewels.com/logo.png",
              "@id": "https://gemsglobaljewels.com",
              "url": "https://gemsglobaljewels.com",
              "telephone": "+91-XXXXXXXXXX",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Jewelry Market",
                "addressLocality": "Surat",
                "addressRegion": "Gujarat",
                "postalCode": "395003",
                "addressCountry": "IN"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 21.1702,
                "longitude": 72.8311
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday"
                ],
                "opens": "10:00",
                "closes": "20:00"
              },
              "sameAs": [
                "https://www.facebook.com/gemsglobaljewels",
                "https://www.instagram.com/gemsglobaljewels"
              ],
              "priceRange": "$$$"
            })
          }}
        />
      </head>
      <body className="relative" suppressHydrationWarning>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
