import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';
import { getAddinManifestUrl } from '@/lib/excel-launch';
import { handleOptions } from '@/lib/route-handler';

const MANIFEST_FILENAME = 'silkview-connect-manifest.xml';

async function readLocalManifestFallback(): Promise<string | null> {
  if (process.env.NODE_ENV !== 'development') return null;
  try {
    return await readFile(
      join(process.cwd(), '..', 'addin', 'public', 'manifest.xml'),
      'utf8'
    );
  } catch {
    return null;
  }
}

async function loadManifestBody(): Promise<string | null> {
  const manifestUrl = getAddinManifestUrl();
  try {
    const upstream = await fetch(manifestUrl, { next: { revalidate: 300 } });
    if (upstream.ok) return upstream.text();
  } catch {
    // Local add-in often uses a self-signed cert that Node fetch rejects.
  }
  return readLocalManifestFallback();
}

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET() {
  const body = await loadManifestBody();

  if (!body) {
    return NextResponse.json(
      { error: 'Failed to fetch add-in manifest.' },
      { status: 502 }
    );
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${MANIFEST_FILENAME}"`,
      'Cache-Control': 'public, max-age=300',
    },
  });
}
