import { describe, expect, it } from "vitest";
import { takeSuggestionRateLimit } from "./suggestion-rate-limit";

describe("suggestion rate limit", () => {
  it("limits repeated requests and recovers after the window", () => {
    const memberId = crypto.randomUUID();

    for (let request = 0; request < 6; request += 1) {
      expect(takeSuggestionRateLimit(memberId, 1_000).allowed).toBe(true);
    }

    expect(takeSuggestionRateLimit(memberId, 1_000)).toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });
    expect(takeSuggestionRateLimit(memberId, 61_001).allowed).toBe(true);
  });
});
