# FoxLink — SEO Content Plan

_Last updated: 2026-07-27_

## Reality check

FoxLink is a **new domain with low authority**. Don't chase head terms like
"CRM" — chase **long-tail, lower-competition, high-intent** queries and **UK
modifiers**. Comparison / "alternative" posts convert best and rank fastest for a
young site. Expect **3–6 months** to see meaningful movement. Publish
consistently (**~1 post/week**) and interlink.

**Positioning to lean on:** simple / lightweight, anti-bloat, small sales teams,
**built-in AI**, **UK / GDPR**, transparent £19/seat pricing.

## Measurement

- Set up **Google Search Console** for `foxlink.network`, submit `sitemap.xml`.
- After ~4–8 weeks, use **Performance → Queries** to see which posts pick up
  impressions. Expand the winners; prune/merge the duds.

---

## Post backlog (priority order)

Status key: ✅ published · ⬜ to write

### Cluster 1 — Comparison & "alternative" (bottom-funnel, ship first)
_Highest conversion, lowest competition. This is the wedge._

1. ✅ **Best CRM for small sales teams (UK, 2026)** — `best crm for small sales teams`
2. ⬜ **HubSpot too much? Simpler CRM alternatives for small teams** — `hubspot alternative small business`
3. ⬜ **Pipedrive alternatives for teams that want less admin** — `pipedrive alternative`
4. ⬜ **Affordable CRM for small business: what £19/seat actually gets you** — `affordable/cheap crm small business`
5. ⬜ **CRM for consultants & agencies (that you'll actually keep using)** — `crm for consultants` / `crm for agencies`

### Cluster 2 — Category / problem-aware (middle-funnel)
6. ✅ **Sales pipeline stages explained (with a template)** — `sales pipeline stages` _(pillar)_
7. ⬜ **What is lead scoring? A plain-English guide** — `what is lead scoring`
8. ⬜ **Spreadsheet vs CRM: when to make the switch** — `spreadsheet vs crm`
9. ⬜ **How to manage a sales pipeline without a full-time admin** — `how to manage a sales pipeline`

### Cluster 3 — How-to / jobs-to-be-done (top-of-funnel, links & authority)
10. ✅ **How to log sales calls so the notes are actually useful** — `how to log sales calls`
11. ⬜ **7 follow-up email templates for after a sales call** — `sales follow up email templates`
12. ⬜ **Building a simple daily sales routine** — `daily sales routine`

### Cluster 4 — AI differentiator (trend + moat)
13. ⬜ **AI in CRM: hype vs. the 6 features that save real time** — `ai crm` / `ai crm features`
14. ⬜ **AI lead scoring: how it works and when to trust it** — `ai lead scoring`

---

## Execution notes

- **Pillar + clusters:** make #1 (best-CRM roundup) and #6 (pipeline) *pillar*
  pages; link the how-tos up into them and back down. Internal links pass
  authority and help Google map the topic.
- **Every post:** unique `<title>` ≤60 chars, meta description ≤155, one `<h1>`,
  descriptive `<h2>`s that match sub-queries, a natural CTA to the 14-day trial,
  and `BlogPosting` + `BreadcrumbList` JSON-LD (copy the pattern from any existing
  post `<head>`).
- **New post checklist:**
  1. Create `blog/<slug>.html` from an existing post as the template.
  2. Set title / description / canonical / OG / Twitter / `article:published_time`.
  3. Update the JSON-LD (`headline`, `description`, `datePublished`, breadcrumb).
  4. Add an `<article class="article-card">` to `blog/index.html` (newest first).
  5. Add a `<url>` entry to `sitemap.xml`.
- **Honesty:** never invent competitor pricing/specs or fake review ratings
  (`aggregateRating`) — Google penalises the latter and inaccuracies erode trust.
- **URLs:** the host currently serves `.html` (extensionless 404s). Keep links,
  canonicals and sitemap on `.html`. If clean URLs are enabled later
  (e.g. Vercel `"cleanUrls": true`), switch canonicals/sitemap to extensionless.
