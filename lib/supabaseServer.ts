import { createClient } from '@supabase/supabase-js'

function cleanEnv(value: string | undefined) {
  if (!value) return value
  const trimmed = value.trim()
  // Vercel env vars are often pasted with surrounding quotes; strip them.
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
const serviceKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing Supabase server configuration')
}

export const supabaseServer = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
  },
  global: {
    // Explicitly use global fetch to avoid issues in some Node.js/Next.js environments
    fetch: (...args) => fetch(...args),
  },
})
