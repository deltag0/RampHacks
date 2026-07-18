# Member data model

The member model extends Supabase Auth without copying credentials into the
application schema. `auth.users` remains the authentication source of truth,
while `public.members` stores the member's editable product profile.

## Relationships

```text
auth.users 1 ── 1 members 1 ── * households
                       │
                       ├──────── * homes * ── 1 regions
                       │
                       ├──────── * verification_records
                       │
                       ├──────── 1 member_trust_summaries
                       │
                       └──────── * audit_events

members A/B ── * exchanges * ── homes A/B
                         │
                         ├────── 1 conversations ── * messages
                         ├────── * arrival_confirmations
                         └────── * ratings
```

An exchange always has two different members, households, and homes. Database
triggers verify that each household and home belongs to the member on its side
of the exchange.

## History

History is derived from exchange facts rather than stored as member-editable
claims:

- `member_exchange_history` shows the signed-in member's booked home, exchange
  partner, dates, and lifecycle state.
- `member_visited_places` contains only completed exchanges and exposes the
  normalized region rather than a precise address.
- `audit_events` is reserved for security-sensitive and lifecycle activity.
  Members can read their own events but cannot insert or modify them directly.

## Ratings and trust

A member can submit one rating per completed exchange. The database verifies
that the author and subject are the two exchange partners.

`member_trust_summaries` is database-managed and cannot be edited by a member.
Version `trust-v1` uses:

- up to 20 points for recorded verification signals;
- up to 30 points for completed exchanges;
- up to 30 points from completed-exchange ratings;
- a deduction of up to 20 points for exchanges cancelled by that member; and
- a 20-point neutral starting value.

The score is bounded from 0 to 100 and retains its component counts so the
result is explainable. It is a platform trust summary, not a claim that a
person, identity, or home has been comprehensively verified.

## Authorization

All exposed tables use Row Level Security. Member-editable profile columns are
granted individually. Trust and verification values are not member-writable.
Exchange and travel history views run with invoker security and filter on
`auth.uid()`.

## Private coordination

Every exchange receives exactly one conversation. Messages are readable and
writable only by that exchange's two members; message authorship is checked by
both Row Level Security and a database trigger.

Once an exchange is confirmed, each member can record their own arrival after
finding the other home, entering it, and settling in. A member cannot confirm
for their partner. When both confirmations exist, the database advances the
exchange from `confirmed` to `in_progress` and records an audit event for each
confirmation.
