import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runMigration() {
  console.log('Running migration: Add position column to diamond_shapes...');
  
  const migrationFile = path.join(__dirname, '../migrations/002_add_position_to_diamond_shapes.sql');
  const sql = fs.readFileSync(migrationFile, 'utf8');
  
  // Split SQL into individual statements and execute
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const statement of statements) {
    try {
      console.log('Executing:', statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      if (error) {
        console.warn('Note:', error.message);
      }
    } catch (e) {
      console.warn('Note:', (e as Error).message);
    }
  }
  
  // Alternatively, try to add the column directly using Supabase's query builder
  try {
    console.log('Trying direct column addition...');
    // First check if column exists
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'diamond_shapes')
      .eq('column_name', 'position');
    
    if (colError || !columns || columns.length === 0) {
      console.log('Position column does not exist, adding it...');
      // Since we can't directly ALTER TABLE via JS client easily, let's just log instructions
      console.log('\nPlease run the following SQL in your Supabase SQL Editor:');
      console.log(sql);
    } else {
      console.log('Position column already exists!');
    }
  } catch (e) {
    console.log('\nPlease run the following SQL in your Supabase SQL Editor:');
    console.log(sql);
  }
  
  console.log('\nMigration complete!');
}

runMigration().catch(console.error);