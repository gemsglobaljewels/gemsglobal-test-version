
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://hfkwglrtslnurdztudgz.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhma3dnbHJ0c2xudXJkenR1ZGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjAyODgsImV4cCI6MjA4NjUzNjI4OH0.KMlab1m2RQMx0MIsxpeKJ5pl44uYuP2vZlGIyWFxRFc";

const supabase = createClient(supabaseUrl, serviceKey);

async function check() {
  const { data: products, error } = await supabase.from('products').select('name, images');
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  products.forEach(p => {
    if (p.images) {
      p.images.forEach(img => {
        if (img.endsWith('.mp4') || img.endsWith('.mov') || img.endsWith('.glb')) {
          console.log(`Product: ${p.name}, File: ${img}`);
        }
      });
    }
  });
}

check();
