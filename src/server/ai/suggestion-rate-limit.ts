const WINDOW_MS = 60_000;
const MAX_REQUESTS = 6;
const requestsByMember = new Map<string, number[]>();

export function takeSuggestionRateLimit(memberId: string, now = Date.now()) {
  const cutoff = now - WINDOW_MS;
  const recent = (requestsByMember.get(memberId) ?? []).filter(
    (timestamp) => timestamp > cutoff,
  );

  if (recent.length >= MAX_REQUESTS) {
    return {
      allowed: false as const,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((recent[0] + WINDOW_MS - now) / 1_000),
      ),
    };
  }

  recent.push(now);
  requestsByMember.set(memberId, recent);
  return { allowed: true as const };
}
