'use client'

import dynamic from 'next/dynamic'
import { Toaster } from '@/components/ui/toaster'


const FloatingButtons = dynamic(() => import('@/components/FloatingButtons'), { ssr: false })
const ScrollToTop = dynamic(() => import('@/components/ScrollToTop'), { ssr: false })
const ChatWidget = dynamic(() => import('@/components/ChatWidget'), {
  ssr: false,
  loading: () => null
})
const AnalyticsTracker = dynamic(() => import('@/components/AnalyticsTracker'), { ssr: false })
const AuthCookieBridge = dynamic(() => import('@/components/AuthCookieBridge'), { ssr: false })
const SmoothScroll = dynamic(() => import('@/components/SmoothScroll'), { ssr: false })

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
        {children}
      <SmoothScroll />
      <AuthCookieBridge />
      <AnalyticsTracker />
      <FloatingButtons />
      <ScrollToTop />
      <ChatWidget />
      <Toaster />
    </>
  )
}
