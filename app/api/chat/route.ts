import { NextResponse } from 'next/server'

type Msg = { role: 'user' | 'assistant' | 'system'; content: string }

export async function POST(req: Request) {
  try {
    const { messages, context } = (await req.json()) as { messages: Msg[]; context?: { email?: string; userId?: string; name?: string } }
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN
    const lastUser = [...(messages || [])].reverse().find((m) => m.role === 'user')?.content || ''

    const wantList =
      /(\blist\b|\bshow\b|\ball\b|\bcatalog\b|\bcollection\b)/i.test(lastUser) &&
      /(product|ring|necklace|earring|bracelet|jewell?ery|items?)/i.test(lastUser)
    if (wantList) {
      try {
        const origin = new URL(req.url).origin
        const r = await fetch(`${origin}/api/products`, { cache: 'no-store' })
        const arr = await r.json()
        if (Array.isArray(arr) && arr.length > 0) {
          const top = (arr as any[]).slice(0, 8).map((p: any) => {
            const cat = String(p.category_slug || p.category || '').toLowerCase().replace(/\s+/g, '-')
            const slug = String(p.slug || '')
            let url = '/products/' + slug
            if (cat && slug) url = `/collection/${cat}/${slug}`
            return {
              name: p.name,
              priceUSD: Number(p.price || 0),
              image: p.image || p.images?.[0] || null,
              url,
            }
          })
          return NextResponse.json({ type: 'products', items: top })
        }
        return NextResponse.json({ type: 'products', items: [] })
      } catch {
        // continue to AI / fallback
      }
    }

    // Orders intent
    if (/\border(s)?\b|my order|order status/i.test(lastUser) && (context?.email || context?.userId)) {
      try {
        const origin = new URL(req.url).origin
        const qs = context?.userId ? `userId=${encodeURIComponent(context.userId)}` : `email=${encodeURIComponent(context?.email || '')}`
        const r = await fetch(`${origin}/api/orders?${qs}&limit=20`, { cache: 'no-store' })
        const orders = await r.json()
        const items = (Array.isArray(orders) ? orders : []).map((o: any) => ({
          id: o.id,
          total: Number(o.total || o.total_price || 0),
          status: o.status,
          createdAt: o.createdAt,
        }))
        return NextResponse.json({ type: 'orders', items })
      } catch {
        // ignore
      }
    }

    // Appointments intent
    if (/appointment|booking|consult/i.test(lastUser) && (context?.email || context?.userId)) {
      try {
        const origin = new URL(req.url).origin
        const qs = context?.userId ? `userId=${encodeURIComponent(context.userId)}` : `email=${encodeURIComponent(context?.email || '')}`
        const r = await fetch(`${origin}/api/appointments?${qs}&limit=20`, { cache: 'no-store' })
        const appts = await r.json()
        const items = (Array.isArray(appts) ? appts : []).map((a: any) => ({
          id: a.id,
          service: a.service,
          date: a.date,
          time: a.time,
          status: a.status,
        }))
        return NextResponse.json({ type: 'appointments', items })
      } catch {
        // ignore
      }
    }

    // Profile intent
    if (/\bprofile\b|\baccount\b|\bme\b/i.test(lastUser) && (context?.email || context?.name)) {
      return NextResponse.json({
        type: 'profile',
        user: {
          email: context?.email || null,
          name: context?.name || null,
          userId: context?.userId || null,
        },
      })
    }

    // Login status / identity intent
    if (/\b(login|logged in|sign(ed)? in)\b|\bwho am i\b|kya (me|mai?n) login hu/i.test(lastUser)) {
      const isLoggedIn = !!(context?.email || context?.userId || context?.name)
      return NextResponse.json({
        type: 'auth',
        isLoggedIn,
        user: {
          email: context?.email || null,
          name: context?.name || null,
          userId: context?.userId || null,
        },
      })
    }

    // If OpenAI key exists, try remote AI; fallback to local rule-based
    if (OPENAI_API_KEY) {
      try {
        const sys =
          'You are an assistant for a luxury jewellery store. Always respond in English. Answer briefly and helpfully. If asked about products, ordering, or appointments, guide the user and provide short actionable steps. Keep replies under 120 words.'
        const body = {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: sys },
            ...(Array.isArray(messages) ? messages : []).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ],
          temperature: 0.3,
        }
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify(body),
        })
        const j = await r.json()
        const reply: string =
          j?.choices?.[0]?.message?.content ||
          'I can help with collections, orders, sizing, or appointments. How can I assist?'
        return NextResponse.json({ reply })
      } catch {
        // fallthrough to rule-based
      }
    }

    // Simple rule-based fallback
    const q = lastUser.toLowerCase()
    let reply =
      'I can help with jewelry, delivery, pricing, or appointments. How can I assist?'
    if (/(price|cost|kitna|₹|\$)/i.test(q)) {
      reply = 'For pricing, please check the product details on the Collection page. Share a specific item and I’ll guide you.'
    } else if (/appointment|consult|book|slot|visit/i.test(q)) {
      reply = 'To book an appointment, go to the /appointments page. Choose a date/time and confirm.'
    } else if (/return|refund|exchange/i.test(q)) {
      reply = 'Returns are possible within 30 days (unused condition). Share your order details and I’ll provide steps.'
    } else if (/custom|bespoke|design/i.test(q)) {
      reply = 'For custom designs, share your requirements—stone, metal, and budget—and we’ll prepare a proposal.'
    }
    return NextResponse.json({ reply })
  } catch (e: any) {
    return NextResponse.json({ reply: 'Server error. Please try again in a moment.' }, { status: 200 })
  }
}
