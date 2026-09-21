/**
 * Supabase Storage helpers for the CRM logo (server-only).
 *
 * Uses the Storage REST API directly with the service-role key — no client
 * SDK dependency. The logo lives in a public `crm-logos` bucket so the
 * generated PDF can reference it by URL.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const LOGO_BUCKET = 'crm-logos';
export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function storageConfigured(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_KEY);
}

async function ensureBucket(): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Supabase Storage is not configured');
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: LOGO_BUCKET, public: true, file_size_limit: MAX_LOGO_BYTES }),
  });
  // 409 = already exists — that's fine.
  if (!res.ok && res.status !== 409 && res.status !== 400) {
    const text = await res.text();
    throw new Error(`Could not create storage bucket: ${res.status} ${text.slice(0, 200)}`);
  }
}

function publicUrlFor(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${LOGO_BUCKET}/${path}`;
}

/**
 * Upload a logo file and return its public URL. Replaces (overwrites) any
 * previous logo stored at the same deterministic path.
 */
export async function uploadLogo(file: File): Promise<string> {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Supabase Storage is not configured (missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  }
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    throw new Error('Logo must be a PNG, JPG or WebP image');
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error('Logo must be 2 MB or smaller');
  }

  await ensureBucket();

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  // Deterministic path: uploading a new logo replaces the old one.
  const path = `logo.${ext}`;

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${LOGO_BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': file.type,
      // Overwrite an existing object instead of failing with duplicate error.
      'x-upsert': 'true',
    },
    body: Buffer.from(await file.arrayBuffer()),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Logo upload failed: ${res.status} ${text.slice(0, 200)}`);
  }

  return publicUrlFor(path);
}

/** Best-effort delete of the current logo object(s). Never throws. */
export async function removeLogoObjects(): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/storage/v1/object/${LOGO_BUCKET}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefixes: ['logo.png', 'logo.jpg', 'logo.webp'] }),
    });
  } catch {
    // Non-fatal: the settings row update is what matters.
  }
}
