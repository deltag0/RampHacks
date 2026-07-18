import { describe, expect, it } from "vitest";
import { confirmArrivalSchema, sendMessageSchema } from "./validation";

describe("messaging validation", () => {
  it("trims valid messages", () => {
    const result = sendMessageSchema.parse({
      conversationId: "a90bca26-0adf-4ff7-a928-70d784e0f470",
      body: "  We found the key.  ",
    });

    expect(result.body).toBe("We found the key.");
  });

  it("rejects empty messages", () => {
    expect(
      sendMessageSchema.safeParse({
        conversationId: "a90bca26-0adf-4ff7-a928-70d784e0f470",
        body: "   ",
      }).success,
    ).toBe(false);
  });

  it("requires valid exchange and conversation identifiers", () => {
    expect(
      confirmArrivalSchema.safeParse({
        exchangeId: "not-an-id",
        conversationId: "also-not-an-id",
      }).success,
    ).toBe(false);
  });
});
