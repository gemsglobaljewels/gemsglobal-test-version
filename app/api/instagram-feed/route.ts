import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

const DEFAULT_INSTAGRAM_SETTINGS = {
    username: "gemsglobaljewels",
    instagramLink: "https://instagram.com/gemsglobaljewels",
    logoUrl: ""
}

const DEFAULT_INSTAGRAM_REELS = [
    {
        id: "r1",
        videoUrl: "https://pub-5f3798d6e2094791979a906bcf260a07.r2.dev/feed-media/1781521346018-virtus.mp4",
        thumbnail: null,
        productIds: [],
        isEnabled: true,
        position: 0
    },
    {
        id: "r2",
        videoUrl: "https://pub-5f3798d6e2094791979a906bcf260a07.r2.dev/feed-media/1781521346018-virtus.mp4",
        thumbnail: null,
        productIds: [],
        isEnabled: true,
        position: 1
    },
    {
        id: "r3",
        videoUrl: "https://pub-5f3798d6e2094791979a906bcf260a07.r2.dev/feed-media/1781521346018-virtus.mp4",
        thumbnail: null,
        productIds: [],
        isEnabled: true,
        position: 2
    }
]

export async function GET() {
    try {
        console.log('GET /api/instagram-feed starting...')
        // First get Instagram settings - use dedicated table!
        let settings = DEFAULT_INSTAGRAM_SETTINGS
        const { data: settingsData, error: settingsError } = await supabaseServer
            .from('instagram_settings')
            .select('instagram_username, instagram_link, instagram_logo_url')
            .eq('id', 'default')
            .single()

        console.log('instagram_settings data:', settingsData)
        console.log('instagram_settings error:', settingsError)

        if (!settingsError && settingsData) {
            settings = {
                username: settingsData.instagram_username || DEFAULT_INSTAGRAM_SETTINGS.username,
                instagramLink: settingsData.instagram_link || DEFAULT_INSTAGRAM_SETTINGS.instagramLink,
                logoUrl: settingsData.instagram_logo_url || DEFAULT_INSTAGRAM_SETTINGS.logoUrl
            }
        }
        console.log('Final settings to return:', settings)

        // Now get Instagram reels
        let reels = DEFAULT_INSTAGRAM_REELS
        const { data: reelsData, error: reelsError } = await supabaseServer
            .from('instagram_reels')
            .select('id, video_url, thumbnail_url, product_ids, is_enabled, position')
            .order('position', { ascending: true })

        console.log('instagram_reels data:', reelsData)
        console.log('instagram_reels error:', reelsError)

        if (!reelsError && reelsData && reelsData.length > 0) {
            reels = reelsData.map((r: any) => ({
                id: r.id,
                videoUrl: r.video_url,
                thumbnail: r.thumbnail_url,
                productIds: r.product_ids || [],
                isEnabled: r.is_enabled !== false,
                position: r.position
            }))
        }
        console.log('Final reels to return:', reels)

        return NextResponse.json({
            settings,
            reels
        })
    } catch (e) {
        console.error('Instagram feed GET error:', e)
        return NextResponse.json({
            settings: DEFAULT_INSTAGRAM_SETTINGS,
            reels: DEFAULT_INSTAGRAM_REELS
        })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { settings, reels } = body
        console.log('PUT /api/instagram-feed body:', body)

        // Save settings if provided to dedicated table
        if (settings) {
            const settingsPayload = {
                instagram_username: settings.username,
                instagram_link: settings.instagramLink,
                instagram_logo_url: settings.logoUrl,
                updated_at: new Date().toISOString()
            }

            // Upsert to dedicated table with id='default'
            await supabaseServer
                .from('instagram_settings')
                .upsert({
                    id: 'default',
                    ...settingsPayload
                }, { onConflict: 'id' })

            console.log('Settings saved to instagram_settings:', settingsPayload)
        }

        // Save reels if provided
        if (Array.isArray(reels)) {
            for (const reel of reels) {
                await supabaseServer
                    .from('instagram_reels')
                    .upsert({
                        id: reel.id,
                        video_url: reel.videoUrl,
                        thumbnail_url: reel.thumbnail,
                        product_ids: reel.productIds,
                        is_enabled: reel.isEnabled,
                        position: reel.position,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'id' })
            }
            console.log('Reels saved:', reels)
        }

        // Return the updated data
        return await GET()
    } catch (e) {
        console.error('Instagram feed PUT error:', e)
        return NextResponse.json({ error: 'Failed to save Instagram feed' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const id = request.nextUrl.searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

        await supabaseServer
            .from('instagram_reels')
            .delete()
            .eq('id', id)

        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('Instagram reel DELETE error:', e)
        return NextResponse.json({ error: 'Failed to delete reel' }, { status: 500 })
    }
}