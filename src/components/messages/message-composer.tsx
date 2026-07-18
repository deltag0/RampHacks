"use client";

import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";
import { sendMessage } from "@/app/messages/actions";

export function MessageComposer({
  conversationId,
}: {
  conversationId: string;
}) {
  return (
    <form action={sendMessage} className="flex items-end gap-3">
      <input type="hidden" name="conversationId" value={conversationId} />
      <label className="flex-1">
        <span className="sr-only">Message</span>
        <textarea
          name="body"
          required
          maxLength={4000}
          rows={2}
          placeholder="Write a message…"
          className="block w-full resize-none rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm leading-6 transition outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
        />
      </label>
      <SendButton />
    </form>
  );
}

function SendButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-700 text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
      aria-label={pending ? "Sending message" : "Send message"}
    >
      <Send size={19} aria-hidden="true" />
    </button>
  );
}
