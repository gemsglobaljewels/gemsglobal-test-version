import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

// Lucide icon names the admin is allowed to pick for the "how to measure" steps.
// Keep in sync with the ICONS maps in the admin + public pages.
const ALLOWED_ICONS = ['Ruler', 'Scissors', 'Printer', 'Circle', 'Hand', 'PencilRuler', 'Info', 'Sparkles']
const DEFAULT_ICON = 'Ruler'

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

// Fallback returned when the table/row does not exist yet, so the public page
// always renders even before the migration has been run.
const DEFAULT_GUIDE: Guide = {
  welcome:
    'Finding your perfect ring size is the first step towards a piece you will treasure forever. This quick guide will help you measure accurately from the comfort of your home.',
  importance:
    'A well-fitting ring should slide over your knuckle with a little resistance and sit comfortably without pinching. Getting the size right ensures lasting comfort and protects your investment.',
  measure_title: 'How to measure your ring size',
  measure_steps: [
    { id: 's1', icon: 'Scissors', title: 'Cut a strip of paper', text: 'Take a thin strip of paper or string, about 10 cm long and less than 1 cm wide.' },
    { id: 's2', icon: 'Hand', title: 'Wrap it around your finger', text: 'Wrap the strip snugly around the base of the intended finger, below the knuckle.' },
    { id: 's3', icon: 'PencilRuler', title: 'Mark and measure', text: 'Mark where the paper overlaps, then measure the length in millimetres with a ruler.' },
    { id: 's4', icon: 'Ruler', title: 'Match it to the chart', text: 'Compare your circumference or diameter to the chart below to find your size.' },
  ],
  chart_columns: [
    { id: 'c_dia', label: 'Diameter (mm)' },
    { id: 'c_circ', label: 'Circumference (mm)' },
    { id: 'c_india', label: 'India' },
    { id: 'c_us', label: 'US / Canada' },
    { id: 'c_uk', label: 'UK' },
  ],
  chart_rows: [
    { id: 'r1', cells: { c_dia: '14.0', c_circ: '44.0', c_india: '6', c_us: '3', c_uk: 'F' } },
    { id: 'r2', cells: { c_dia: '14.9', c_circ: '46.8', c_india: '8', c_us: '4', c_uk: 'H' } },
    { id: 'r3', cells: { c_dia: '15.7', c_circ: '49.3', c_india: '10', c_us: '5', c_uk: 'J' } },
    { id: 'r4', cells: { c_dia: '16.5', c_circ: '51.9', c_india: '12', c_us: '6', c_uk: 'L' } },
    { id: 'r5', cells: { c_dia: '17.3', c_circ: '54.4', c_india: '14', c_us: '7', c_uk: 'N' } },
    { id: 'r6', cells: { c_dia: '18.2', c_circ: '57.0', c_india: '16', c_us: '8', c_uk: 'P' } },
    { id: 'r7', cells: { c_dia: '19.0', c_circ: '59.5', c_india: '18', c_us: '9', c_uk: 'R' } },
  ],
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

// Normalize an incoming document: coerce shapes, drop malformed entries, and
// clamp icon names to the whitelist so nothing arbitrary reaches the client.
function normalize(body: any): Guide {
  const columns: Column[] = asArray<any>(body?.chart_columns)
    .filter((c) => c && c.id)
    .map((c) => ({ id: String(c.id), label: String(c.label ?? '') }))

  const columnIds = new Set(columns.map((c) => c.id))

  const rows: Row[] = asArray<any>(body?.chart_rows)
    .filter((r) => r && r.id)
    .map((r) => {
      const cells: Record<string, string> = {}
      const src = r.cells && typeof r.cells === 'object' ? r.cells : {}
      // Only keep cells that belong to an existing column.
      for (const cid of columnIds) cells[cid] = String(src[cid] ?? '')
      return { id: String(r.id), cells }
    })

  const steps: Step[] = asArray<any>(body?.measure_steps)
    .filter((s) => s && s.id)
    .map((s) => ({
      id: String(s.id),
      icon: ALLOWED_ICONS.includes(String(s.icon)) ? String(s.icon) : DEFAULT_ICON,
      title: String(s.title ?? ''),
      text: String(s.text ?? ''),
    }))

  return {
    welcome: String(body?.welcome ?? ''),
    importance: String(body?.importance ?? ''),
    measure_title: String(body?.measure_title ?? 'How to measure your ring size'),
    measure_steps: steps,
    chart_columns: columns,
    chart_rows: rows,
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('ring_size_guide')
      .select('welcome, importance, measure_title, measure_steps, chart_columns, chart_rows')
      .eq('id', 1)
      .maybeSingle()

    if (error || !data) return NextResponse.json(DEFAULT_GUIDE)

    return NextResponse.json({
      welcome: data.welcome ?? DEFAULT_GUIDE.welcome,
      importance: data.importance ?? DEFAULT_GUIDE.importance,
      measure_title: data.measure_title ?? DEFAULT_GUIDE.measure_title,
      measure_steps: asArray<Step>(data.measure_steps),
      chart_columns: asArray<Column>(data.chart_columns),
      chart_rows: asArray<Row>(data.chart_rows),
    })
  } catch {
    return NextResponse.json(DEFAULT_GUIDE)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json().catch(() => ({}))
    const doc = normalize(body)

    const { data, error } = await supabaseServer
      .from('ring_size_guide')
      .upsert(
        { id: 1, ...doc, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      )
      .select('welcome, importance, measure_title, measure_steps, chart_columns, chart_rows')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data ?? doc, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Failed to update ring size guide' }, { status: 500 })
  }
}
