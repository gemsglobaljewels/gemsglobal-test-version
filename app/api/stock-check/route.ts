import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Fetch product stock
    const { data: product, error } = await supabaseServer
      .from('products')
      .select('id, name, stock_quantity')
      .eq('id', productId)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: 'Product is out of stock' }, { status: 404 });
    }

    return NextResponse.json({
      productId: product.id,
      name: product.name,
      stock_quantity: product.stock_quantity ?? 0,
      inStock: (product.stock_quantity ?? 0) > 0,
    });
  } catch (error) {
    console.error('[Stock Check API] Error:', error);
    return NextResponse.json({ error: 'Failed to check stock' }, { status: 500 });
  }
}
