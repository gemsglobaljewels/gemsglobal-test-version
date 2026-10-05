import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Proxy for 3D model files from R2 — adds CORS headers so <model-viewer> can fetch them.
 * R2 bucket may not have CORS configured; this route bridges the gap.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'url parameter required' }, { status: 400 });
  }

  // SSRF guard: only allow files from our own R2 public bucket (or configured host).
  const allowedHosts = [
    process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).hostname : null,
    'pub-5f3798d6e2094791979a906bcf260a07.r2.dev',
  ].filter(Boolean) as string[];

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }
  if (parsed.protocol !== 'https:' || !allowedHosts.includes(parsed.hostname)) {
    return NextResponse.json({ error: 'host not allowed' }, { status: 403 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Next.js)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch model: ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'model/gltf-binary';
    // Stream the body — model files can be tens of MB; don't buffer in memory.
    // NOTE: no manual Content-Length — Next applies its own transfer encoding
    // and a mismatched length makes the browser abort mid-download.
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('[proxy-model] Fetch error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch model' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
    },
  });
}
