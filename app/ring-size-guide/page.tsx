'use client'

import { useEffect, useState } from 'react'
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from '@/components/footer'
import {
  Ruler, Scissors, Printer, Circle, Hand, PencilRuler, Info, Sparkles,
  Lightbulb,
} from 'lucide-react'
import { motion } from 'framer-motion'

// Icon whitelist — keep in sync with the admin page and the API's ALLOWED_ICONS.
const ICONS: Record<string, any> = { Ruler, Scissors, Printer, Circle, Hand, PencilRuler, Info, Sparkles }

type Step = { id: string; icon: string; title: string; text: string }
type Column = { id: string; label: string }
type Row = { id: string; cells: Record<string, string> }
type Guide = {
  welcome: string
  importance: string
  measure_title: string
  measure_steps: Step[]
  chart_columns: Column[]
  chart_rows: Row[]
}

export default function RingSizeGuidePage() {
  const [guide, setGuide] = useState<Guide | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetch('/api/ring-size-guide', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => { if (alive) setGuide(j) })
      .catch(() => { if (alive) setGuide(null) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const steps = guide?.measure_steps ?? []
  const columns = guide?.chart_columns ?? []
  const rows = guide?.chart_rows ?? []

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      <HeaderMegaMenu />

      <main>
        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="border-b border-neutral-200">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
            <motion.p
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="mb-6 text-[11px] font-medium uppercase tracking-[0.35em] text-neutral-400"
            >
              Ring Size Guide
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.06 }}
              className="font-serif text-4xl font-normal leading-[1.12] tracking-tight text-neutral-900 sm:text-6xl"
            >
              Find your perfect fit
            </motion.h1>
            {guide?.welcome && (
              <motion.p
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }}
                className="mx-auto mt-7 max-w-xl text-[15px] leading-[1.75] text-neutral-500"
              >
                {guide.welcome}
              </motion.p>
            )}
          </div>
        </section>

        {/* ── Importance ─────────────────────────────────────── */}
        {guide?.importance && (
          <section className="border-b border-neutral-200">
            <div className="mx-auto max-w-3xl px-6 py-20">
              <div className="flex flex-col items-center text-center">
                <span className="mb-6 h-px w-10 bg-neutral-900" />
                <h2 className="font-serif text-2xl font-normal text-neutral-900 sm:text-3xl">
                  Why the right size matters
                </h2>
                <p className="mt-6 max-w-2xl text-[16px] leading-[1.85] text-neutral-600">
                  {guide.importance}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── How to measure ─────────────────────────────────── */}
        {steps.length > 0 && (
          <section className="border-b border-neutral-200 bg-neutral-50">
            <div className="mx-auto max-w-5xl px-6 py-24">
              <div className="mb-16 text-center">
                <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.35em] text-neutral-400">
                  Step by step
                </p>
                <h2 className="font-serif text-3xl font-normal text-neutral-900 sm:text-4xl">
                  {guide?.measure_title || 'How to measure your ring size'}
                </h2>
              </div>

              <ol className="grid gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-4">
                {steps.map((s, i) => {
                  const Icon = ICONS[s.icon] || Ruler
                  return (
                    <motion.li
                      key={s.id}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.4, delay: i * 0.06 }}
                      className="group flex flex-col bg-white p-8 transition-colors duration-300 hover:bg-neutral-50"
                    >
                      <div className="mb-6 flex items-center justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-900 text-neutral-900">
                          <Icon size={20} strokeWidth={1.5} />
                        </span>
                        <span className="font-serif text-4xl font-normal leading-none text-neutral-200">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <h3 className="mb-2 text-[15px] font-semibold tracking-tight text-neutral-900">
                        {s.title}
                      </h3>
                      <p className="text-[13.5px] leading-relaxed text-neutral-500">{s.text}</p>
                    </motion.li>
                  )
                })}
              </ol>
            </div>
          </section>
        )}

        {/* ── Size conversion chart ──────────────────────────── */}
        {columns.length > 0 && (
          <section className="border-b border-neutral-200">
            <div className="mx-auto max-w-4xl px-6 py-24">
              <div className="mb-14 text-center">
                <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.35em] text-neutral-400">
                  Conversion
                </p>
                <h2 className="font-serif text-3xl font-normal text-neutral-900 sm:text-4xl">
                  Ring size conversion chart
                </h2>
                <p className="mx-auto mt-5 max-w-lg text-[14px] leading-relaxed text-neutral-500">
                  Match your measurement to a row to read your size across every region.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5 }}
                className="overflow-hidden rounded-2xl border border-neutral-200"
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse text-[14px]">
                    <thead>
                      <tr className="bg-neutral-900 text-white">
                        {columns.map((c) => (
                          <th
                            key={c.id}
                            className="whitespace-nowrap px-6 py-4 text-center font-medium tracking-wide first:text-left"
                          >
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="[font-variant-numeric:tabular-nums]">
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-neutral-400">
                            No sizes have been added yet.
                          </td>
                        </tr>
                      ) : (
                        rows.map((r, ri) => (
                          <tr
                            key={r.id}
                            className={`transition-colors hover:bg-neutral-100 ${ri % 2 ? 'bg-neutral-50/60' : 'bg-white'}`}
                          >
                            {columns.map((c, ci) => (
                              <td
                                key={c.id}
                                className={`whitespace-nowrap border-t border-neutral-200 px-6 py-3.5 text-center text-neutral-600 first:text-left ${
                                  ci === 0 ? 'font-semibold text-neutral-900' : ''
                                }`}
                              >
                                {r.cells[c.id] || '—'}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Tip — clean bordered box with generous padding on all sides */}
              <div className="mt-10 flex items-start gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:p-7">
                <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
                  <Lightbulb size={17} strokeWidth={1.6} />
                </span>
                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-wider text-neutral-900">Tip</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-neutral-600">
                    If you're between two sizes, choose the larger one for a comfortable fit.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {loading && (
          <div className="py-24 text-center text-sm text-neutral-400">Loading…</div>
        )}
      </main>

      <Footer />
    </div>
  )
}
