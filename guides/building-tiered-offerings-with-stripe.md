---
title: "Building Tiered Offerings with Stripe: A Guide for Creative Powerup Members and Their Claude Code"
role: guide
format: manual
domain: creative-powerup
tags: [stripe, subscriptions, tiers, membership, pricing, webhooks, entitlements, claude-code, offerings]
audience: [creator, engineer]
complexity: intermediate
summary: >
  A general-purpose playbook for turning an offering — a community, a newsletter,
  an AI companion, a course, a service — into a tiered paid membership with
  Stripe. Distilled from the Spark / Flame / Hearth subscription system that
  OpenCosmos designed, built and later removed. Written to be handed to Claude
  Code: it explains the design decisions, gives fill-in templates, provides
  working code patterns for checkout, webhooks and entitlements, and lists the
  mistakes worth not repeating.
curated_at: 2026-10-04
curator: shalom
source: original
corpus_tier: source
related_docs:
  - guides/teaching-your-agent-a-learning-loop.md
---

# Building Tiered Offerings with Stripe

> **How to use this document.** Give it to your Claude Code and say: *"Read this guide, then interview me about my offering and build it."* The guide is written so Claude Code can run the whole process — ask you the design questions, fill in the templates, write the code, and tell you what only you can do (Stripe Dashboard steps, legal text).

OpenCosmos once ran a three-tier paid membership — **Spark, Flame, Hearth** — wired to Stripe. It was built, shipped, and then deliberately removed when the strategy changed. This guide keeps what was learned: the shape of a tier structure that makes sense, the economics behind it, the integration that worked, and the lessons that cost real time. Nothing here is specific to OpenCosmos. Your offering is yours.

---

## Part 0 — Instructions for Claude Code

If you are Claude Code and a member has handed you this guide, follow this sequence. Do not skip to code.

1. **Interview first.** Work through [Part 2](#part-2--design-the-tiers) with the member. Ask the questions in the order given, a few at a time. Do not invent answers for them. Propose defaults where the guide offers one, and let them overrule.
2. **Fill the templates.** Produce the *Offering Sheet* and *Tier Table* ([Part 7](#part-7--templates)) and show them to the member for approval **before writing any code.**
3. **Detect the stack.** Read the member's project. Everything in [Part 5](#part-5--the-integration) is shown in TypeScript on Next.js route handlers because that is what OpenCosmos used; translate faithfully to the member's actual stack and don't impose Next.js on a project that isn't using it. If there is no project yet, ask what they want to build with.
4. **Use test mode only.** Build and verify entirely with Stripe test keys (`sk_test_...`). Never ask for, paste, print or commit a live secret key. Switching to live mode is the member's decision and a Dashboard action ([Part 8](#part-8--going-live-and-leaving-gracefully)).
5. **Check current docs.** Stripe's API changes. The code patterns here are structural, not copy-paste-final. Before writing the integration, check Stripe's current documentation for Checkout Sessions, webhooks and the customer portal, and use the current API version and SDK.
6. **Tell the member what's theirs.** Anything that needs the Stripe Dashboard, a legal page, a tax decision, or a live-mode switch is the member's to do. List these plainly at the end; don't pretend they're done.
7. **Verify.** Run the Stripe CLI's `stripe listen` and trigger test events, and confirm the whole loop works (checkout → entitlement granted → cancellation → entitlement removed) before declaring anything finished.

---

## Part 1 — Why tiers, and when not to

A tier structure is a way of letting people choose *how deeply* they engage with something you've made. It works when the offering genuinely has depth levels. It fails when the tiers are the same thing at different prices with the honest framing removed.

**The OpenCosmos lesson.** Spark ($5) and Flame ($10) were, in the end, "Hearth without the honest framing." Hearth ($50) bundled real community membership plus managed access to the AI companion. The cheaper tiers sold slices of the AI's usage and little else, which made them transactional rather than meaningful, and they were abandoned. Before building tiers, ask whether each one corresponds to a *real difference in what a person gets and who they get to be in your world.*

**Two framings, and why the second wins:**

- **A paywall** says: *pay to continue.* It creates resentment, even when people pay.
- **An invitation** says: *the work is free and always will be; the community that sustains it is here, and it's where people go deeper.* It creates aspiration, and leaves no buyer's remorse.

Design your tiers as a ladder of invitations. The question for every tier is "what does a person who wants to go deeper find here?" — not "what do I lock?"

**Consider not having tiers at all** if you have one offering and one audience. One clear price with an honest description often outperforms three muddy ones. Tiers earn their place when different people want genuinely different levels of involvement.

---

## Part 2 — Design the tiers

Claude Code: ask these. Members: answer in your own words; rough is fine.

### 2.1 The offering

1. **What is the thing?** (A community, newsletter, course, AI companion, coaching, templates, a tool?) One sentence.
2. **Who is it for, and what are they trying to become or do?**
3. **What costs you money or time every time someone uses it?** (This is the most important question for pricing. See 2.3.)
4. **What's free, forever?** Decide this deliberately. A strong free layer is how people find you.

### 2.2 Find the real depth levels

A tier is only worth creating if it passes this test: **"Name one specific thing a person at this tier gets that the tier below doesn't, which they would actually notice."**

Typical axes of real difference:

| Axis | Example |
|---|---|
| **Access** | More content, earlier access, a private space |
| **Usage** | More of a metered resource (AI conversations, API calls, storage, seats) |
| **Community** | A seat at the table: live sessions, a members' forum, peer cohort |
| **Contact** | Direct time with you: office hours, reviews, 1:1 |
| **Bundles** | Membership in something else you run |

Avoid tiers that differ only by a number slightly larger than the one below. Avoid more than three tiers at the start; you can add one later more easily than you can remove one.

### 2.3 Price from your costs, not from your nerves

If your offering has **marginal cost** (AI usage, compute, a human's hour), price from it. If it has near-zero marginal cost (a community, a newsletter), price from the value and from what keeps you sustainable.

**Net revenue per charge** (Stripe's standard US card fee is roughly 2.9% + $0.30; check your actual rate):

```
net = price − (price × 0.029 + 0.30)
```

| Price | Stripe fee | Net |
|---|---|---|
| $5 | ~$0.45 | ~$4.55 |
| $10 | ~$0.59 | ~$9.41 |
| $50 | ~$1.75 | ~$48.25 |

**Note what the fixed $0.30 does:** at low prices it is a large percentage. A $5 tier loses ~9% to fees; a $50 tier loses ~3.5%. If you plan a low tier, know this up front.

**Budget for marginal cost as a fraction of net, not of price.** OpenCosmos allotted:

| Tier | Price | Share of net spent on marginal cost | Why |
|---|---|---|---|
| Low | $5 | ~50% | Thin tier; usage *is* the product |
| Mid | $10 | ~50% | Same |
| Top | $50 | ~20% | Most of the value was community with near-zero marginal cost; the rest was margin |

A reasonable rule: **no more than half of net revenue may be spendable on marginal cost at any tier**, and the more of a tier's value is non-metered (community, content), the smaller that share should be.

### 2.4 Metering (only if you have marginal cost)

If a tier includes a metered resource, decide two things:

- **A monthly budget** (derived from 2.3).
- **A weekly cap of monthly ÷ 4**, enforced alongside the monthly cap. Without it, one enthusiastic week can burn the whole month and leave the person with nothing for three weeks. That feels like a trap even though it was their own use.

Track cost in the smallest practical integer unit, not floats (see [Part 5.6](#56-metering-usage)).

### 2.5 What each tier includes

Fill the Tier Table in [Part 7](#part-7--templates). Name the tiers evocatively and consistently — OpenCosmos used a progression of warmth (**Spark → Flame → Hearth**): a first light, a sustained fire, a place to gather. Names should tell people where they are on a path.

### 2.6 What happens at the edges

Decide these *before* building. They are policy questions, not code questions:

- **Upgrade / downgrade:** immediate or at next renewal? Prorated?
- **Cancellation:** what do they keep, and until when? (Default: access to the end of the paid period.)
- **Failed payment:** how long is the grace period before access lapses?
- **Refunds:** your policy, in writing.
- **When a tier is cancelled, do bundled benefits (newsletter, community seat) get revoked?** OpenCosmos chose to *revoke the community seat but never unsubscribe the newsletter*. Revoking a newsletter on cancellation is punitive and costs goodwill. Be deliberate.

---

## Part 3 — Architecture in one picture

Three systems, three jobs. Keep them separate.

```
 Stripe                      Your app                         Your data store
 ──────                      ────────                         ───────────────
 Products & Prices   ◄────── Checkout route                   Entitlement record
 Checkout (hosted)   ──────► (creates session)                  userId → tier, status,
 Billing portal      ◄────── Portal route                       stripe ids, period
 Webhooks            ──────► Webhook handler  ──writes──►     Reverse lookup
                              (the source of truth)             stripeCustomerId → userId
                                    │                         Usage counters (optional)
                                    ▼
                             Access check (every
                             gated request reads
                             the entitlement)
```

The principle that makes this reliable: **Stripe is the source of truth for billing; your webhook handler is the only thing that writes entitlements; your access check only ever reads them.** The browser returning from Checkout is *not* proof of payment. Only the webhook is.

---

## Part 4 — Stripe setup (the member's job, with Claude Code's help)

Everything in this part is done in the Stripe Dashboard, in **Test mode**, except where noted.

1. **Create or choose a Stripe account.** If you already run a Stripe account for another business, consider whether to keep them separate. OpenCosmos used a separate account from Creative Powerup so the two businesses' books, payouts and webhooks never tangled.
2. **Create one Product per tier** (Products → Add product). Name, description, and a **recurring monthly price**. Copy each **Price ID** (`price_...`).
3. **Create a webhook endpoint** (Developers → Webhooks). URL: `https://<your-domain>/api/webhooks/stripe`. Select these events and no more to begin with:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   
   Optionally add `invoice.payment_failed` if you want to message people about failed payments. Copy the **Signing secret** (`whsec_...`).
4. **Configure the Customer Portal** (Settings → Billing → Customer portal). Turn on: cancel subscription, update payment method, view invoices, and (if you want self-serve) switch plans between your tiers. **This is not optional** — see [Part 8](#part-8--going-live-and-leaving-gracefully).
5. **Get your API keys** (Developers → API keys). Test keys for now.

### Environment variables

| Variable | Where from | Purpose |
|---|---|---|
| `STRIPE_SECRET_KEY` | Dashboard → Developers → API keys | Server-side API access. `sk_test_...` in test, `sk_live_...` in production. **Never in client code or git.** |
| `STRIPE_WEBHOOK_SECRET` | Dashboard → Developers → Webhooks → endpoint → Signing secret | Verifies webhooks really came from Stripe |
| `STRIPE_PRICE_<TIER>` | Dashboard → Products → tier → Price ID | One per tier (e.g. `STRIPE_PRICE_SPARK`) |

Add them to `.env.local` for development (and make sure `.env*` is in `.gitignore`) and to your hosting provider's environment settings for production.

> **Hosting gotcha — monorepos with Turborepo.** If your project uses Turborepo, environment variables are *silently dropped* at build and runtime unless declared in `turbo.json` under `globalPassThroughEnv`. The build succeeds; the variables are just `undefined`. OpenCosmos lost real time to a webhook that failed only because its secret never arrived. If webhooks verify locally but fail in production, check this first. Use `globalPassThroughEnv`, not `globalEnv`, so secrets aren't hashed into the cache key.

---

## Part 5 — The integration

TypeScript / Next.js route handlers shown. The structure matters more than the syntax.

### 5.1 Tier definitions — one file, one source of truth

```ts
// lib/tiers.ts
export const TIERS = {
  spark: {
    priceId: process.env.STRIPE_PRICE_SPARK!,
    name: 'Spark',
    description: 'One line a person would actually say yes to.',
    monthlyUSD: 5,
    features: ['…', '…'],
    // Only if you meter anything:
    monthlyBudgetMicrodollars: 2_280_000,   // from Part 2.3
    weeklyBudgetMicrodollars:    570_000,   // monthly ÷ 4
  },
  // flame, hearth …
} as const

export type Tier = keyof typeof TIERS

// Map a Stripe price ID back to your tier key. Null if unrecognized.
export function tierFromPriceId(priceId: string): Tier | null {
  for (const [key, val] of Object.entries(TIERS)) {
    if (val.priceId === priceId) return key as Tier
  }
  return null
}
```

Everything else — pricing page, checkout validation, webhook mapping, access checks — reads from this file. Change a tier in one place.

### 5.2 Create the Stripe client lazily

```ts
// lib/stripe.ts
import Stripe from 'stripe'

// Instantiate inside handlers, not at module scope. Env vars can be undefined
// during build-time static analysis, which would crash the build.
export function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)  // use the current API version per Stripe's docs
}
```

### 5.3 Checkout route

Creates a Stripe Checkout Session and returns a URL for the browser to redirect to.

```ts
// app/api/stripe/checkout/route.ts
export async function POST(req: NextRequest) {
  const user = await getSignedInUser(req)          // however your app does auth
  if (!user) return NextResponse.json({ error: 'Sign in to subscribe.' }, { status: 401 })

  const { tier } = await req.json().catch(() => ({}))
  if (!tier || !(tier in TIERS)) {
    return NextResponse.json({ error: 'Invalid tier.' }, { status: 400 })
  }

  const origin = req.headers.get('origin') ?? 'https://your-domain.com'

  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: TIERS[tier as Tier].priceId, quantity: 1 }],
    // THE LINK between Stripe and your user system. The webhook reads this.
    client_reference_id: user.id,
    customer_email: user.email,
    success_url: `${origin}/welcome`,
    cancel_url: `${origin}/account`,
    subscription_data: { metadata: { user_id: user.id, tier } },
  })

  return NextResponse.json({ url: session.url })
}
```

Key decisions embedded here:

- **Require sign-in before checkout.** You need a user ID to attach the subscription to. Anonymous checkout creates orphan subscriptions you'll have to reconcile by hand.
- **`client_reference_id` carries your user's ID.** It is how the webhook knows *who* paid.
- **Validate `tier` against your own table.** Never pass a client-supplied price ID straight to Stripe.

### 5.4 The webhook handler — the heart of it

```ts
// app/api/webhooks/stripe/route.ts
export async function POST(req: NextRequest) {
  // RAW string body. Do not parse it first.
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break
      const userId = session.client_reference_id
      if (!userId) break

      const sub = await getStripe().subscriptions.retrieve(session.subscription as string)
      const priceId = sub.items.data[0]?.price.id ?? ''
      const tier = tierFromPriceId(priceId)
      if (!tier) break

      await setEntitlement(userId, {
        tier,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: sub.id,
        status: sub.status === 'active' ? 'active' : 'past_due',
      })
      await provisionBenefits(tier, userId)      // best-effort, see 5.5
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = await userIdFromCustomerId(sub.customer as string)
      if (!userId) break                          // safe to ignore: not ours yet

      const tier = tierFromPriceId(sub.items.data[0]?.price.id ?? '')
      if (!tier) break

      await setEntitlement(userId, {
        tier,
        stripeCustomerId: sub.customer as string,
        stripeSubscriptionId: sub.id,
        status: sub.status === 'active' ? 'active'
              : sub.status === 'past_due' ? 'past_due'
              : 'canceled',
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = await userIdFromCustomerId(sub.customer as string)
      if (userId) {
        await deleteEntitlement(userId, sub.customer as string)
        await revokeBenefits(tierFromPriceId(sub.items.data[0]?.price.id ?? ''), userId)
      }
      break
    }

    default:
      break   // acknowledge everything else so Stripe stops retrying it
  }

  return NextResponse.json({ received: true })
}
```

**The rules this handler follows, and why:**

1. **Verify the signature on the raw body.** Stripe's SDK wants the raw string. If you call `req.json()` first and re-serialize, the signature will never match. This is the single most common failure.
2. **Return 200 for events you don't handle.** Otherwise Stripe retries them for days.
3. **Webhooks arrive out of order and more than once.** Make every write idempotent: "set entitlement to this state" is safe to repeat; "add one to a counter" is not. Compare against Stripe's current state when in doubt.
4. **Treat `canceled` and `deleted` differently from `past_due`.** `past_due` is a payment problem Stripe is still retrying; `deleted` is over.
5. **Map by price ID, and handle unknown ones loudly.** Log unrecognized price IDs. A new price you forgot to add to your tier table should be visible, not silent.
6. **Never let side effects break the acknowledgement.** Return 200 even if provisioning a benefit fails ([5.5](#55-benefits-side-effects-of-a-subscription)); log it for manual repair instead.

### 5.5 Benefits — side effects of a subscription

If a tier includes things outside your app — a newsletter, a community seat, a course enrollment, a Discord role — grant and revoke them from the webhook.

OpenCosmos's matrix:

| Tier | Newsletter (Substack) | Community (Circle) |
|---|---|---|
| Spark | — | — |
| Flame | ✓ | — |
| Hearth | ✓ | ✓ |

```
checkout.session.completed
  → look up the user's email + name in your user system
  → provisionBenefits(tier, email, name)
        → addNewsletterSubscriber()   (if tier includes it)
        → addCommunityMember()        (if tier includes it)

customer.subscription.deleted
  → revokeBenefits(tier, email)
        → removeCommunityMember()     (if tier included it)
        → (newsletter: left subscribed on purpose)
```

Patterns that held up:

- **`Promise.allSettled`, never `Promise.all`.** One failing integration must not block the others, and none may block the webhook's 200.
- **Best-effort and loud.** Log failures with a greppable prefix (`[benefits/circle] add member failed`). Manual repair path: find the subscriber in Stripe, add them by hand.
- **Revocation by lookup.** Many community platforms delete by member ID, not email. Look up the ID by email first; if the member isn't found (they left on their own, or provisioning originally failed), skip cleanly instead of throwing.
- **Know your platform's limits.** OpenCosmos could add people to Substack only as *free* subscribers through the public form; programmatic paid-subscription gifting required a partner program that wasn't available. Flame and Hearth members got the newsletter, but weren't marked "paid" there. Check what your platform's API actually permits before promising it in a tier description.
- **Public endpoints vs. keyed ones.** Some "add subscriber" endpoints need no credentials; others need an API key. Treat keys like `STRIPE_SECRET_KEY`: environment variables only.

### 5.6 Metering usage

Only needed if a tier includes a metered resource (AI conversation, API calls, etc.).

**Store cost as integers in the smallest unit, not as dollars.** OpenCosmos tracked *microdollars* (1 µ$ = $0.000001) so every counter increment was an atomic integer `INCRBY`. Floating-point accumulation drifts and can't be incremented atomically in most stores.

For an LLM, convert per-token pricing into per-token microdollars (price per million tokens equals microdollars per token numerically — e.g. $3 per million input tokens is 3 µ$ per token). **Use the provider's current price list;** prices change, and the numbers in this guide are illustrative.

Counters, with TTLs that outlive their period so late events don't vanish:

| Key pattern | Value | TTL |
|---|---|---|
| `entitlement:{userId}` | JSON: tier, status, Stripe IDs | ~13 months, refreshed on each webhook |
| `stripe_customer:{customerId}` | `userId` (reverse lookup for webhooks) | ~13 months |
| `usage:monthly:{userId}:{YYYY-M}` | integer µ$ | ~40 days |
| `usage:weekly:{userId}:{YYYY-WW}` | integer µ$ | ~12 days |

Redis (e.g. Upstash) was the store. Any store with atomic increments and expiry works.

**Why the reverse lookup matters.** The checkout session carries your `userId`, but later subscription events (`updated`, `deleted`) carry only the Stripe *customer* ID. Write `customerId → userId` the first time a subscription is created, or you will not be able to find the person when they cancel.

**Prompt caching reduces the cost of conversational AI substantially.** If your metered resource is an LLM and your provider supports prompt caching, cache the stable system prompt on every request. OpenCosmos found this the largest single cost reduction (roughly three-quarters or more of input cost eliminated after the first exchange of a session) and chose to *not* count cached reads against the subscriber's budget — generous to them, and cheap for the business.

### 5.7 The access check

Every gated request evaluates, in priority order. OpenCosmos's order, as a template:

1. **Owner/admin bypass** (your own secret cookie or role) — never rate-limit yourself.
2. **Bring-your-own-key** — if the person supplies their own API key, they pay their provider directly, and are unlimited on your side.
3. **Active subscriber within budget** — read entitlement, check weekly *and* monthly counters, serve from your key, record usage.
4. **Subscriber over budget** — respond `429` and say *which* period was exhausted (`weekly` or `monthly`) so the UI can tell them honestly when it resets.
5. **Free tier** — bot check (e.g. Cloudflare Turnstile), then per-IP and monthly caps.

The access check only *reads* entitlements. It never calls Stripe on the hot path.

### 5.8 The account page

A person must be able to see and manage what they're paying for:

- **Current tier, status, and usage** — an honest gauge. Show remaining budget in terms they understand (conversations, hours), not microdollars.
- **A "Manage billing" button** that creates a Billing Portal session (`stripe.billingPortal.sessions.create({ customer, return_url })`) and redirects. This is how they cancel, change cards, and download invoices.
- **Hide subscription UI for people it doesn't apply to** (e.g. bring-your-own-key users).

```ts
// app/api/stripe/portal/route.ts
export async function POST(req: NextRequest) {
  const user = await getSignedInUser(req)
  if (!user) return NextResponse.json({ error: 'Sign in.' }, { status: 401 })
  const ent = await getEntitlement(user.id)
  if (!ent) return NextResponse.json({ error: 'No active subscription.' }, { status: 404 })

  const session = await getStripe().billingPortal.sessions.create({
    customer: ent.stripeCustomerId,
    return_url: `${new URL(req.url).origin}/account`,
  })
  return NextResponse.json({ url: session.url })
}
```

---

## Part 6 — Hard-won lessons

These are the things that actually went wrong or nearly did.

**1. Parse nothing before you verify.** Stripe verification needs the raw body string. Other providers differ — OpenCosmos's WorkOS webhooks needed the opposite (a *parsed* object, which the SDK re-serializes internally). Never assume; read the SDK for the provider you're calling. A mismatch produces a permanent `400 Invalid signature` on every delivery, with no other symptom.

**2. Environment variables vanish quietly.** See the Turborepo note in [Part 4](#part-4--stripe-setup-the-members-job-with-claude-codes-help). Also: Vercel and similar hosts need the variables set separately from your local `.env.local`, and must be redeployed afterward.

**3. Auth middleware can silently return "not logged in."** With some auth libraries (WorkOS AuthKit on Next.js 16+ in OpenCosmos's case), a required `proxy.ts` / `middleware.ts` file injects a header that the session helper needs. Without it, the helper returns `user: null` for every request even with a valid cookie — the user looks logged in everywhere except where it matters. If checkout returns 401 for a signed-in user, check this before anything else. Use a broad matcher with static-asset exclusions, not a catch-all, or you'll intercept CSS assets and break styling.

**4. Webhook handlers are the product.** Most of the effort in a Stripe integration is not checkout; it's making the webhook handler correct under retries, reordering, partial failure and unknown inputs.

**5. Test the whole lifecycle, not the happy path.** Use the Stripe CLI to trigger:

```
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

Also test: payment failure (use Stripe's failing test cards), upgrade, downgrade, cancel-at-period-end, and a webhook delivered twice.

**6. Don't build on a tier you've decided to abandon.** OpenCosmos's tier code sat in production for five months after the strategy changed, "kept only so existing subscribers can manage billing" — a surface to keep working and something every future reader had to reason around. If you stop selling a tier, plan its exit ([Part 8](#part-8--going-live-and-leaving-gracefully)).

**7. Keep unrelated things in separate files.** The original subscription module held three unrelated concerns — subscription records, usage budget counters, and bring-your-own-key tracking. Removing the tiers meant careful surgery rather than a deletion. Keep entitlements, metering and each side-feature in their own modules from the start.

---

## Part 7 — Templates

Claude Code: produce these with the member, and keep them in the project (e.g. `docs/offerings.md`) so future sessions have them.

### 7.1 Offering Sheet

```markdown
# Offering Sheet — <name>

**The thing, in one sentence:**
**Who it's for:**
**What they're trying to become or do:**
**What I give away free, forever:**
**What costs me something each time it's used:**
**The invitation (one or two sentences that explain, without pressure, why someone would go deeper):**
**Brand voice (three adjectives, and one thing we never say):**
```

### 7.2 Tier Table

```markdown
| | <Tier 1> | <Tier 2> | <Tier 3> |
|---|---|---|---|
| **Name** | | | |
| **One-line description** | | | |
| **Price / month** | | | |
| **Stripe fee** (price × 2.9% + $0.30) | | | |
| **Net revenue** | | | |
| **Marginal-cost budget** (% of net) | | | |
| **Monthly budget / weekly cap** | | | |
| **Included: access** | | | |
| **Included: usage** | | | |
| **Included: community** | | | |
| **Included: contact** | | | |
| **Bundled benefits** | | | |
| **"What do they notice?"** (one thing this tier has that the one below doesn't) | | | |
```

### 7.3 Edge-Case Policy

```markdown
**Upgrade:** immediate / next renewal · prorated yes/no
**Downgrade:** immediate / next renewal
**Cancellation:** keeps access until end of paid period yes/no
**Failed payment grace period:** __ days
**Refund policy:** 
**Benefits revoked on cancellation:** (list each, and which are intentionally kept)
```

### 7.4 Stripe Checklist

```markdown
- [ ] Stripe account chosen (shared or separate): 
- [ ] Product + recurring price created per tier; price IDs recorded in env
- [ ] Webhook endpoint created with the three events; signing secret in env
- [ ] Customer Portal configured (cancel, payment method, invoices, plan switching)
- [ ] Env vars set locally AND on the host (and declared in turbo.json if applicable)
- [ ] Test-mode lifecycle verified with `stripe listen` / `stripe trigger`
- [ ] Failed-payment, upgrade, downgrade, cancel tested
- [ ] Terms, privacy and refund pages published
- [ ] Tax settings reviewed (Stripe Tax or advice)
- [ ] Live keys swapped in by the member, and a real small purchase made and refunded
```

### 7.5 Tier definition snippet (per tier)

```ts
<key>: {
  priceId: process.env.STRIPE_PRICE_<KEY>!,
  name: '<Name>',
  description: '<one line>',
  monthlyUSD: <n>,
  features: ['<…>'],
  monthlyBudgetMicrodollars: <n>,   // omit if nothing is metered
  weeklyBudgetMicrodollars: <n>,    // monthly ÷ 4
},
```

---

## Part 8 — Going live, and leaving gracefully

### Going live

1. Complete Stripe account activation (business details, bank account).
2. Recreate the Products, Prices, webhook endpoint and portal configuration **in live mode** — test-mode objects do not carry over. New `price_...` IDs and a new `whsec_...` signing secret result.
3. Swap the live keys into your host's production environment yourself. A coding assistant should never see them.
4. Make one real purchase with your own card, confirm the whole loop, then refund it.

### Leaving gracefully — the rule worth remembering

OpenCosmos's tiers were removed from the code in September 2026. The Stripe products, prices and webhook endpoints **were still sitting in the Stripe account**, and the removal of the billing portal meant that **any subscriber who was still active kept being billed and could no longer cancel from the site.** Deleting code does not end a subscription.

If you ever retire a tier or the whole system:

1. **Stop selling first.** Archive the products and prices in Stripe (so no new subscriptions can start) *before* touching code.
2. **Deal with existing subscribers deliberately.** Cancel them, migrate them, or grandfather them — and tell them. Do this in Stripe, with their knowledge.
3. **Keep the portal and webhook alive until the last subscription ends.** Remove them last.
4. **Write down what you configured and why** before removing anything. Products, price IDs, webhook endpoints, events. OpenCosmos kept a record of this, and it is what made it possible to reason about the Stripe account months afterwards.
5. **Check the Stripe Dashboard directly.** The codebase can no longer tell you what is live once you've removed it.

---

## A closing thought

The tiers OpenCosmos built were, in the end, replaced by something simpler: **community as the compounding asset.** A subscription is linear — five dollars a month, per person. A community compounds: every member who shows up makes membership more valuable for the next. Build tiers if your offering truly has depths. But whatever you charge, make it an invitation — *free at the door, deeper where the community gathers* — and let the tiers describe the paths people can take, not the walls they run into.

*Source: this guide is distilled from OpenCosmos's retired subscription system (Stripe integration, tier economics, microdollar metering, webhook handling, and Substack/Circle benefit provisioning), preserved in the OpenCosmos repository's archive of removed documentation.*
