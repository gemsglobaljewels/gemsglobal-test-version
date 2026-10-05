const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
const envContent = fs.readFileSync('.env', 'utf8')
const env = {}
envContent.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
})

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(url, key)

async function run() {
  console.log('Loading size options migration SQL...')
  const sqlFile = path.join(__dirname, '../migrations/12-size-options-tables.sql')
  const sql = fs.readFileSync(sqlFile, 'utf8')
  
  // Split SQL into statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  console.log(`Executing ${statements.length} SQL statements...`)
  let succeededCount = 0
  let failedCount = 0

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    if (stmt.startsWith('--')) continue // skip comments
    
    console.log(`\nExecuting statement [${i+1}/${statements.length}]:`)
    console.log(stmt.substring(0, 120) + (stmt.length > 120 ? '...' : ''))

    // Attempt 1: exec RPC with 'sql'
    let { error } = await supabase.rpc('exec', { sql: stmt })
    if (error) {
      // Attempt 2: exec RPC with 'query'
      const r2 = await supabase.rpc('exec', { query: stmt })
      if (!r2.error) {
        error = null
      } else {
        // Attempt 3: exec_sql RPC with 'query'
        const r3 = await supabase.rpc('exec_sql', { query: stmt })
        if (!r3.error) {
          error = null
        } else {
          // Attempt 4: exec_sql RPC with 'sql'
          const r4 = await supabase.rpc('exec_sql', { sql: stmt })
          if (!r4.error) {
            error = null
          } else {
            error = r4.error // retain last error
          }
        }
      }
    }

    if (error) {
      console.warn('Execution warning/error:', error.message || error)
      failedCount++
    } else {
      console.log('Statement executed successfully!')
      succeededCount++
    }
  }

  console.log('\nMigration complete report:')
  console.log(`Succeeded statements: ${succeededCount}`)
  console.log(`Failed statements: ${failedCount}`)
  if (failedCount > 0) {
    console.log('\nIMPORTANT: Some statements could not be executed via RPC. Please copy/paste migrations/12-size-options-tables.sql directly into your Supabase SQL Editor.')
  }
}

run().catch(console.error)
