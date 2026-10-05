import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { requireAdmin } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for migration

async function migrateImage(supabaseUrl: string, folder: string) {
  if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) return supabaseUrl;

  try {
    const response = await fetch(supabaseUrl);
    if (!response.ok) return supabaseUrl;

    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName = supabaseUrl.split('/').pop() || `migrated-${Date.now()}`;
    const key = `${folder}/${fileName}`;
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return `${R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error(`Failed to migrate ${supabaseUrl}:`, error);
    return supabaseUrl;
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'products'; // products, blogs, reviews, messages, settings, categories, hero

  const results = {
    total: 0,
    migrated: 0,
    failed: 0,
  };

  try {
    if (type === 'products') {
      const { data: products, error } = await supabaseServer.from('products').select('id, images, image, videos');
      if (error) throw error;

      for (const product of products) {
        results.total++;
        let updated = false;

        if (product.image && product.image.includes('supabase.co')) {
          const newUrl = await migrateImage(product.image, 'products');
          if (newUrl !== product.image) { product.image = newUrl; updated = true; }
        }

        if (Array.isArray(product.images)) {
          const newImages = [];
          for (const img of product.images) {
            if (img && img.includes('supabase.co')) {
              const newUrl = await migrateImage(img, 'products');
              newImages.push(newUrl);
              if (newUrl !== img) updated = true;
            } else { newImages.push(img); }
          }
          product.images = newImages;
        }

        if (Array.isArray(product.videos)) {
          const newVideos = [];
          for (const vid of product.videos) {
            if (vid && vid.includes('supabase.co')) {
              const newUrl = await migrateImage(vid, 'product-videos');
              newVideos.push(newUrl);
              if (newUrl !== vid) updated = true;
            } else { newVideos.push(vid); }
          }
          product.videos = newVideos;
        }

        if (updated) {
          const { error: upErr } = await supabaseServer.from('products').update({ images: product.images, image: product.image, videos: product.videos }).eq('id', product.id);
          if (upErr) results.failed++; else results.migrated++;
        }
      }
    }

    if (type === 'shapes') {
      const { data: shapes, error } = await supabaseServer.from('diamond_shapes').select('*');
      if (error) throw error;
      for (const shape of shapes) {
        results.total++;
        let updated = false;
        if (shape.image && shape.image.includes('supabase.co')) {
          const newUrl = await migrateImage(shape.image, 'diamond-shape-images');
          if (newUrl !== shape.image) { shape.image = newUrl; updated = true; }
        }
        if (shape.model_3d && shape.model_3d.includes('supabase.co')) {
          const newUrl = await migrateImage(shape.model_3d, 'diamond-shape-3d');
          if (newUrl !== shape.model_3d) { shape.model_3d = newUrl; updated = true; }
        }
        if (updated) {
          const { error: upErr } = await supabaseServer.from('diamond_shapes').update({ image: shape.image, model_3d: shape.model_3d }).eq('key', shape.key);
          if (upErr) results.failed++; else results.migrated++;
        }
      }
    }

    if (type === 'styles') {
      const { data: styles, error } = await supabaseServer.from('ring_styles').select('*');
      if (error) throw error;
      for (const style of styles) {
        results.total++;
        if (style.image && style.image.includes('supabase.co')) {
          const newUrl = await migrateImage(style.image, 'style-images');
          if (newUrl !== style.image) {
            const { error: upErr } = await supabaseServer.from('ring_styles').update({ image: newUrl }).eq('key', style.key);
            if (upErr) results.failed++; else results.migrated++;
          }
        }
      }
    }

    if (type === 'ledger') {
      const { data: entries, error } = await supabaseServer.from('ledger_entries').select('id, item_photo');
      if (error) throw error;
      for (const entry of entries) {
        results.total++;
        if (entry.item_photo && entry.item_photo.includes('supabase.co')) {
          const newUrl = await migrateImage(entry.item_photo, 'ledger-photos');
          if (newUrl !== entry.item_photo) {
            const { error: upErr } = await supabaseServer.from('ledger_entries').update({ item_photo: newUrl }).eq('id', entry.id);
            if (upErr) results.failed++; else results.migrated++;
          }
        }
      }
    }

    if (type === 'offline') {
      const { data: items, error } = await supabaseServer.from('offline_sale_items').select('id, product_image');
      if (error) throw error;
      for (const item of items) {
        results.total++;
        if (item.product_image && item.product_image.includes('supabase.co')) {
          const newUrl = await migrateImage(item.product_image, 'offline-sale-assets');
          if (newUrl !== item.product_image) {
            const { error: upErr } = await supabaseServer.from('offline_sale_items').update({ product_image: newUrl }).eq('id', item.id);
            if (upErr) results.failed++; else results.migrated++;
          }
        }
      }
    }

    if (type === 'users') {
      const { data: users, error } = await supabaseServer.from('users').select('id, avatar_url');
      if (error) throw error;
      for (const user of users) {
        results.total++;
        if (user.avatar_url && user.avatar_url.includes('supabase.co')) {
          const newUrl = await migrateImage(user.avatar_url, 'avatars');
          if (newUrl !== user.avatar_url) {
            const { error: upErr } = await supabaseServer.from('users').update({ avatar_url: newUrl }).eq('id', user.id);
            if (upErr) results.failed++; else results.migrated++;
          }
        }
      }
    }

    if (type === 'blogs') {
      // Trying image first, then image_url if it fails is handled by the try-catch or explicit check
      const { data: blogs, error } = await supabaseServer.from('blogs').select('*').limit(100);
      if (error) throw error;
      for (const blog of blogs) {
        results.total++;
        const imgField = blog.image_url ? 'image_url' : blog.image ? 'image' : null;
        if (imgField && blog[imgField] && blog[imgField].includes('supabase.co')) {
          const newUrl = await migrateImage(blog[imgField], 'blog');
          if (newUrl !== blog[imgField]) {
            const { error: upErr } = await supabaseServer.from('blogs').update({ [imgField]: newUrl }).eq('id', blog.id);
            if (upErr) results.failed++; else results.migrated++;
          }
        }
      }
    }

    if (type === 'reviews') {
      const { data: reviews, error } = await supabaseServer.from('reviews').select('id, images');
      if (error) throw error;
      for (const review of reviews) {
        results.total++;
        let updated = false;
        if (Array.isArray(review.images)) {
          const newImages = [];
          for (const img of review.images) {
            if (img && img.includes('supabase.co')) {
              const newUrl = await migrateImage(img, 'reviews');
              newImages.push(newUrl);
              if (newUrl !== img) updated = true;
            } else { newImages.push(img); }
          }
          if (updated) {
            const { error: upErr } = await supabaseServer.from('reviews').update({ images: newImages }).eq('id', review.id);
            if (upErr) results.failed++; else results.migrated++;
          }
        }
      }
    }

    if (type === 'messages') {
      const { data: messages, error } = await supabaseServer.from('messages').select('id, file_url').not('file_url', 'is', null);
      if (error) throw error;
      for (const msg of messages) {
        results.total++;
        if (msg.file_url && msg.file_url.includes('supabase.co')) {
          const newUrl = await migrateImage(msg.file_url, 'message-attachments');
          if (newUrl !== msg.file_url) {
            const { error: upErr } = await supabaseServer.from('messages').update({ file_url: newUrl }).eq('id', msg.id);
            if (upErr) results.failed++; else results.migrated++;
          }
        }
      }
    }

    if (type === 'categories') {
      const { data: cats, error } = await supabaseServer.from('categories').select('*').limit(100);
      if (error) throw error;
      for (const cat of cats) {
        results.total++;
        // Check for common image column names
        const imgField = cat.image ? 'image' : cat.image_url ? 'image_url' : null;
        if (imgField && cat[imgField] && cat[imgField].includes('supabase.co')) {
          const newUrl = await migrateImage(cat[imgField], 'categories');
          if (newUrl !== cat[imgField]) {
            const { error: upErr } = await supabaseServer.from('categories').update({ [imgField]: newUrl }).eq('id', cat.id);
            if (upErr) results.failed++; else results.migrated++;
          }
        }
      }
    }

    if (type === 'settings') {
      const { data: settings, error } = await supabaseServer.from('site_settings').select('key, value').in('key', ['logo_url', 'favicon_url']);
      if (error) throw error;
      for (const s of settings) {
        results.total++;
        if (s.value && s.value.includes('supabase.co')) {
          const newUrl = await migrateImage(s.value, 'site-assets');
          if (newUrl !== s.value) {
            const { error: upErr } = await supabaseServer.from('site_settings').update({ value: newUrl }).eq('key', s.key);
            if (upErr) results.failed++; else results.migrated++;
          }
        }
      }
    }

    if (type === 'hero') {
      const { data: heros, error } = await supabaseServer.from('hero_sections').select('*');
      if (error) throw error;
      const imgCols = ['ring_img', 'necklace_img', 'earrings_img', 'bracelet_img', 'ring2_img', 'video_url'];
      for (const hero of heros) {
        results.total++;
        let updated = false;
        const updates: any = {};
        for (const col of imgCols) {
          if (hero[col] && hero[col].includes('supabase.co')) {
            const newUrl = await migrateImage(hero[col], 'hero-assets');
            if (newUrl !== hero[col]) { updates[col] = newUrl; updated = true; }
          }
        }
        if (updated) {
          const { error: upErr } = await supabaseServer.from('hero_sections').update(updates).eq('id', hero.id);
          if (upErr) results.failed++; else results.migrated++;
        }
      }
    }

    return NextResponse.json({ message: `Migration for ${type} completed`, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
