"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  confirmArrivalSchema,
  sendMessageSchema,
} from "@/domain/messaging/validation";
import { createClient } from "@/lib/supabase/server";

function formField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

async function authenticatedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const memberId = data?.claims?.sub;

  if (!memberId) {
    redirect("/auth/login?next=/messages");
  }

  return { supabase, memberId };
}

export async function sendMessage(formData: FormData) {
  const parsed = sendMessageSchema.safeParse({
    conversationId: formField(formData, "conversationId"),
    body: formField(formData, "body"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, memberId } = await authenticatedClient();
  const { error } = await supabase.from("messages").insert({
    conversation_id: parsed.data.conversationId,
    author_member_id: memberId,
    body: parsed.data.body,
  });

  if (!error) {
    revalidatePath(`/messages/${parsed.data.conversationId}`);
    revalidatePath("/messages");
  }
}

export async function confirmArrival(formData: FormData) {
  const parsed = confirmArrivalSchema.safeParse({
    exchangeId: formField(formData, "exchangeId"),
    conversationId: formField(formData, "conversationId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase } = await authenticatedClient();
  const { error } = await supabase.rpc("confirm_exchange_arrival", {
    target_exchange_id: parsed.data.exchangeId,
  });

  if (!error) {
    revalidatePath(`/messages/${parsed.data.conversationId}`);
    revalidatePath("/messages");
  }
}
