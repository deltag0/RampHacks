import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { MessagesHeader } from "@/components/messages/messages-header";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const memberId = authData?.claims?.sub;

  if (!memberId) {
    redirect("/auth/login?next=/messages");
  }

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, exchange_id, created_at")
    .order("created_at", { ascending: false });

  const exchangeIds = conversations?.map((item) => item.exchange_id) ?? [];
  const { data: exchanges } = exchangeIds.length
    ? await supabase
        .from("exchanges")
        .select("id, member_a_id, member_b_id, starts_on, ends_on, state")
        .in("id", exchangeIds)
    : { data: [] };

  const partnerIds =
    exchanges?.map((exchange) =>
      exchange.member_a_id === memberId
        ? exchange.member_b_id
        : exchange.member_a_id,
    ) ?? [];
  const { data: partners } = partnerIds.length
    ? await supabase
        .from("members")
        .select("id, display_name, avatar_url")
        .in("id", partnerIds)
    : { data: [] };

  const exchangeMap = new Map(exchanges?.map((item) => [item.id, item]));
  const partnerMap = new Map(partners?.map((item) => [item.id, item]));

  return (
    <main className="min-h-screen bg-stone-50">
      <MessagesHeader />
      <section className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <p className="text-sm font-semibold text-emerald-700">Private inbox</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
          Messages
        </h1>
        <p className="mt-2 text-stone-600">
          Coordinate each exchange privately with your exchange partner.
        </p>

        {conversations?.length ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            {conversations.map((conversation) => {
              const exchange = exchangeMap.get(conversation.exchange_id);
              if (!exchange) return null;
              const partnerId =
                exchange.member_a_id === memberId
                  ? exchange.member_b_id
                  : exchange.member_a_id;
              const partner = partnerMap.get(partnerId);

              return (
                <Link
                  key={conversation.id}
                  href={`/messages/${conversation.id}`}
                  className="flex items-center gap-4 border-b border-stone-100 px-5 py-5 transition last:border-0 hover:bg-stone-50"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-100 font-semibold text-emerald-800">
                    {(partner?.display_name ?? "M").slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-stone-950">
                      {partner?.display_name ?? "Exchange partner"}
                    </strong>
                    <small className="mt-1 block text-stone-500">
                      {exchange.starts_on} – {exchange.ends_on}
                    </small>
                  </span>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 capitalize">
                    {exchange.state.replace("_", " ")}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
            <MessageCircle className="mx-auto text-stone-400" size={32} />
            <h2 className="mt-4 text-lg font-semibold text-stone-950">
              No conversations yet
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              A private conversation opens when an exchange is proposed.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
