import type { LeadInput } from '@/lib/validations';

type PublicLeadResult = {
  trip_id: number;
  trip_reference: string;
  customer_id: number;
  duplicate: boolean;
};

function requiredEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}

function travellerCount(value: string): number {
  const firstNumber = value.match(/\d+/)?.[0];
  return Math.max(1, Number(firstNumber || 1));
}

/**
 * Writes a validated website lead to the CRM-first Supabase RPC.
 * Returns null when the CRM integration is not configured or unavailable so
 * the caller can continue the existing Sheets/email zero-loss fallbacks.
 */
export async function createPublicLead(input: LeadInput): Promise<PublicLeadResult | null> {
  const url = requiredEnv('NEXT_PUBLIC_SUPABASE_URL');
  const secretKey = requiredEnv('SUPABASE_SECRET_KEY');
  if (!url || !secretKey || !input.submissionId) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(`${url}/rest/v1/rpc/create_public_lead`, {
      method: 'POST',
      headers: {
        apikey: secretKey,
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_idempotency_key: input.submissionId,
        p_form_type: input.formType,
        p_name: input.name,
        p_phone: input.phone,
        p_email: input.email,
        p_destination: input.destination,
        p_travel_date: input.travelDate,
        p_travellers: travellerCount(input.travellers),
        p_package: input.package,
        p_message: input.message,
        p_page: input.page,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error('[lead-intake] CRM write failed:', response.status);
      return null;
    }

    const result = (await response.json()) as PublicLeadResult[];
    return Array.isArray(result) && result[0] ? result[0] : null;
  } catch (error) {
    console.error('[lead-intake] CRM request failed:', error instanceof Error ? error.name : 'unknown');
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
