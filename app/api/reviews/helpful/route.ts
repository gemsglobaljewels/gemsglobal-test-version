import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

// POST /api/reviews/helpful — Toggle like/helpful for a review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { review_id, user_id } = body

    if (!review_id || !user_id) {
      return NextResponse.json({ error: 'Review ID and User ID required' }, { status: 400 })
    }

    // 1. Check if already liked
    const { data: existingLike, error: checkError } = await supabaseServer
      .from('review_likes')
      .select('id')
      .eq('review_id', review_id)
      .eq('user_id', user_id)
      .single()

    if (existingLike) {
      // 2. Unlike: Remove from review_likes and decrement helpful_count
      const { error: deleteError } = await supabaseServer
        .from('review_likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) throw deleteError

      const { error: updateError } = await supabaseServer.rpc('decrement_helpful_count', { row_id: review_id })
      // Fallback if RPC doesn't exist (though we should create it)
      if (updateError) {
          // Manual decrement if RPC fails
          const { data: review } = await supabaseServer.from('reviews').select('helpful_count').eq('id', review_id).single()
          await supabaseServer.from('reviews').update({ helpful_count: Math.max(0, (review?.helpful_count || 1) - 1) }).eq('id', review_id)
      }

      return NextResponse.json({ liked: false })
    } else {
      // 3. Like: Add to review_likes and increment helpful_count
      const { error: insertError } = await supabaseServer
        .from('review_likes')
        .insert([{ review_id, user_id }])

      if (insertError) throw insertError

      const { error: updateError } = await supabaseServer.rpc('increment_helpful_count', { row_id: review_id })
      if (updateError) {
          // Manual increment if RPC fails
          const { data: review } = await supabaseServer.from('reviews').select('helpful_count').eq('id', review_id).single()
          await supabaseServer.from('reviews').update({ helpful_count: (review?.helpful_count || 0) + 1 }).eq('id', review_id)
      }

      return NextResponse.json({ liked: true })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
