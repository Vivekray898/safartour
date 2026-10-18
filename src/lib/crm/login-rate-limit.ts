const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRACKED_IPS = 10_000;

const failedAttempts = new Map<string, number[]>();

function prune(now: number): void {
  for (const [key, timestamps] of failedAttempts) {
    const active = timestamps.filter((timestamp) => now - timestamp < WINDOW_MS);
    if (active.length === 0) {
      failedAttempts.delete(key);
    } else {
      failedAttempts.set(key, active);
    }
  }
}

export function getRequestIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const forwardedIp = forwarded?.split(',')[0]?.trim();
  return forwardedIp || request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export function isLoginRateLimited(ip: string): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  prune(now);

  const timestamps = failedAttempts.get(ip) ?? [];
  if (timestamps.length < MAX_FAILED_ATTEMPTS) {
    return { limited: false, retryAfterSeconds: 0 };
  }

  const oldest = timestamps[0] ?? now;
  return {
    limited: true,
    retryAfterSeconds: Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000)),
  };
}

export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  prune(now);

  if (!failedAttempts.has(ip) && failedAttempts.size >= MAX_TRACKED_IPS) {
    const oldestKey = failedAttempts.keys().next().value;
    if (oldestKey) failedAttempts.delete(oldestKey);
  }

  const timestamps = failedAttempts.get(ip) ?? [];
  timestamps.push(now);
  failedAttempts.set(ip, timestamps);
}

export function clearFailedLogins(ip: string): void {
  failedAttempts.delete(ip);
}
