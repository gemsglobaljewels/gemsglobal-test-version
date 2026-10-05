import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idOrSlug } = await params;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    let query = supabaseServer.from('blogs').select('*');
    if (isUUID) {
      query = query.eq('id', idOrSlug);
    } else {
      query = query.ilike('slug', idOrSlug);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Blog API Detail] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabaseServer
      .from('blogs')
      .update({
        title: body.title,
        slug: body.slug,
        content: body.content,
        excerpt: body.excerpt,
        image_url: body.image_url,
        author: body.author,
        is_visible: body.is_visible,
        published_at: body.published_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Blog API Detail] PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { error } = await supabaseServer
      .from('blogs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Blog API Detail] DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
