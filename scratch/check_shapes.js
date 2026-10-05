const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://hfkwglrtslnurdztudgz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhma3dnbHJ0c2xudXJkenR1ZGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjAyODgsImV4cCI6MjA4NjUzNjI4OH0.KMlab1m2RQMx0MIsxpeKJ5pl44uYuP2vZlGIyWFxRFc";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('diamond_shapes').select('*');
  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}

run();
