import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid("Conversation is invalid."),
  body: z
    .string()
    .trim()
    .min(1, "Write a message first.")
    .max(4000, "Messages can be up to 4,000 characters."),
});

export const confirmArrivalSchema = z.object({
  exchangeId: z.string().uuid("Exchange is invalid."),
  conversationId: z.string().uuid("Conversation is invalid."),
});
