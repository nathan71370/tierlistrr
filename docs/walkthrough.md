# Walkthrough

A quick tour of how tierlistrr works, from browsing to the group verdict.

## 1. Browse tier lists

The home page lists every tier list on the instance. Anyone can browse — no
account needed. Each card shows the subject and who created it.

![Home — browse all tier lists](screenshots/home.png)

## 2. Create a subject

Sign in with your email (you'll get a one-time code — no password). Then
**Create a tier list**: give it a title and description. As the creator, you own
the **items** — the things everyone will rank.

Add items by hand (with your own images), or, if the instance has a `GROQ_API_KEY`
configured, hit **Generate** to have an LLM propose items for the topic and
Pollinations draw an image for each. Items appear instantly and are usable right
away; images download in the background.

## 3. Rank it — everyone gets their own board

Every signed-in participant builds **their own ranking** by dragging items from
the pool into tiers (S, A, B, …). Your placements are saved to your account and
are independent of everyone else's.

![Board — a shared cheese tier list, ranked per participant](screenshots/board.png)

## 4. Compare and see the verdict

Use the participant selector to switch between each person's ranking, or pick
**Average** to see the aggregated **leaderboard** — the consensus of who the
group elected best and worst. Share the list with the link button; viewers
without an account see everything read-only.

## Language

Switch the UI language with the flag picker in the header (English and French
ship by default). Adding a language is a one-file contribution — see
[CONTRIBUTING.md](../CONTRIBUTING.md#-add-a-language-great-first-contribution).
