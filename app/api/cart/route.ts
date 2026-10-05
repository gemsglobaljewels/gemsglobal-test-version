import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Store in-memory cart (in production, this would be database)
    const cartItem = {
      id: Math.random().toString(36).substring(7),
      ...body,
      addedAt: new Date().toISOString(),
    }

    return NextResponse.json(
      { success: true, cartItem },
      { status: 200 }
    )
  } catch (error) {
    console.log('[v0] Error adding to cart:', error)
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 400 }
    )
  }
}

export async function GET() {
  try {
    // Return empty cart for now
    return NextResponse.json([])
  } catch (error) {
    console.log('[v0] Error fetching cart:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 400 }
    )
  }
}
