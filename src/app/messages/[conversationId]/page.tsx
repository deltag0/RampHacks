import { notFound, redirect } from "next/navigation";
import { Check, KeyRound, LockKeyhole } from "lucide-react";
import { confirmArrival } from "@/app/messages/actions";
import { MessageComposer } from "@/components/messages/message-composer";
import { MessagesHeader } from "@/components/messages/messages-header";
import { RealtimeRefresh } from "@/components/messages/realtime-refresh";
import { createClient } from "@/lib/supabase/server";

type ConversationPageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const memberId = authData?.claims?.sub;

  if (!memberId) {
    redirect(`/auth/login?next=/messages/${conversationId}`);
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, exchange_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation) notFound();

  const [{ data: exchange }, { data: messages }, { data: confirmations }] =
    await Promise.all([
      supabase
        .from("exchanges")
        .select("id, member_a_id, member_b_id, starts_on, ends_on, state")
        .eq("id", conversation.exchange_id)
        .single(),
      supabase
        .from("messages")
        .select("id, author_member_id, body, sent_at")
        .eq("conversation_id", conversationId)
        .order("sent_at", { ascending: true })
        .limit(200),
      supabase
        .from("arrival_confirmations")
        .select("member_id, confirmed_at")
        .eq("exchange_id", conversation.exchange_id),
    ]);

  if (!exchange) notFound();
  const partnerId =
    exchange.member_a_id === memberId
      ? exchange.member_b_id
      : exchange.member_a_id;
  const { data: partner } = await supabase
    .from("members")
    .select("display_name")
    .eq("id", partnerId)
    .maybeSingle();

  const ownConfirmation = confirmations?.find(
    (item) => item.member_id === memberId,
  );
  const partnerConfirmed = confirmations?.some(
    (item) => item.member_id === partnerId,
  );
  const arrivalAvailable = ["confirmed", "in_progress"].includes(
    exchange.state,
  );

  return (
    <main className="flex min-h-screen flex-col bg-stone-50">
      <MessagesHeader back />
      <RealtimeRefresh conversationId={conversationId} />
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 py-6 sm:px-8">
        <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
            <div>
              <h1 className="font-semibold text-stone-950">
                {partner?.display_name ?? "Exchange partner"}
              </h1>
              <p className="mt-1 text-xs text-stone-500">
                {exchange.starts_on} – {exchange.ends_on}
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
              <LockKeyhole size={14} />
              Exchange participants only
            </span>
          </div>

          {arrivalAvailable ? (
            <div className="border-b border-amber-200 bg-amber-50 px-5 py-4">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex gap-3">
                  <KeyRound
                    className="mt-0.5 shrink-0 text-amber-700"
                    size={20}
                  />
                  <div>
                    <strong className="text-sm text-amber-950">
                      Arrival check-in
                    </strong>
                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      Confirm only after you have found the home, entered, and
                      settled in.{" "}
                      {partnerConfirmed ? "Your partner has confirmed." : ""}
                    </p>
                  </div>
                </div>
                {ownConfirmation ? (
                  <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-emerald-700">
                    <Check size={18} /> You’re settled in
                  </span>
                ) : (
                  <form action={confirmArrival}>
                    <input
                      type="hidden"
                      name="exchangeId"
                      value={exchange.id}
                    />
                    <input
                      type="hidden"
                      name="conversationId"
                      value={conversationId}
                    />
                    <button className="shrink-0 rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-800">
                      Confirm I’m settled in
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : null}

          <div className="min-h-[420px] space-y-4 px-5 py-6">
            {messages?.length ? (
              messages.map((message) => {
                const own = message.author_member_id === memberId;
                return (
                  <div
                    key={message.id}
                    className={`flex ${own ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                        own
                          ? "rounded-br-md bg-emerald-700 text-white"
                          : "rounded-bl-md bg-stone-100 text-stone-900"
                      }`}
                    >
                      <p className="text-sm leading-6 whitespace-pre-wrap">
                        {message.body}
                      </p>
                      <time
                        className={`mt-1 block text-[11px] ${
                          own ? "text-emerald-100" : "text-stone-400"
                        }`}
                      >
                        {new Intl.DateTimeFormat("en", {
                          hour: "numeric",
                          minute: "2-digit",
                        }).format(new Date(message.sent_at))}
                      </time>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid min-h-[360px] place-items-center text-center">
                <div>
                  <p className="font-semibold text-stone-700">
                    Start planning your exchange
                  </p>
                  <p className="mt-2 text-sm text-stone-500">
                    Messages here are private to you and your exchange partner.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-stone-200 bg-stone-50 p-4 sm:p-5">
            <MessageComposer conversationId={conversationId} />
          </div>
        </section>
      </div>
    </main>
  );
}
