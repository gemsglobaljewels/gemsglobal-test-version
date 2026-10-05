import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

// GET /api/reviews?product_id=...&user_id=... — Fetch reviews for a product
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('product_id')
  const currentUserId = searchParams.get('user_id')

  if (!productId) {
    return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
  }

  // Get reviews
  let { data: reviews, error } = await supabaseServer
    .from('reviews')
    .select('*, users:users(full_name)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (currentUserId && reviews && reviews.length > 0) {
    // Check which reviews were liked by this user
    const { data: likes } = await supabaseServer
      .from('review_likes')
      .select('review_id')
      .eq('user_id', currentUserId)
      .in('review_id', reviews.map(r => r.id))

    const likedIds = new Set(likes?.map(l => l.review_id) || [])
    reviews = reviews.map(r => ({
      ...r,
      isLiked: likedIds.has(r.id)
    }))
  }

  return NextResponse.json(reviews)
}

// POST /api/reviews — Submit or update a review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, user_id, rating, title, content, images } = body

    if (!product_id || !user_id || rating === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const numericRating = parseFloat(rating)
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: 'Invalid rating value' }, { status: 400 })
    }

    // Check if user has already reviewed this product
    const { data: existingReview } = await supabaseServer
      .from('reviews')
      .select('id')
      .eq('product_id', product_id)
      .eq('user_id', user_id)
      .single()

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 })
    }

    // Insert new review
    const { data, error } = await supabaseServer
      .from('reviews')
      .insert({
        product_id,
        user_id,
        rating: numericRating,
        title,
        content,
        images: Array.isArray(images) ? images : [],
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .select('*, users:users(full_name)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Recalculate the product's average rating and review count
    const { data: allReviews, error: fetchError } = await supabaseServer
      .from('reviews')
      .select('rating')
      .eq('product_id', product_id)

    if (!fetchError && allReviews) {
      const totalReviews = allReviews.length
      const avgRating = totalReviews > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : numericRating

      // Update the product record
      await supabaseServer
        .from('products')
        .update({
          rating: avgRating,
          reviews: totalReviews
        })
        .eq('id', product_id)
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
