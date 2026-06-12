# Storable Marine — Fleet Pilot Competitive/Adjacency Brief

**Lens:** What does storablemarine.com signal about marina payments, ops, and dock-floor execution — and does Fleet Pilot's condition-documentation wedge still hold?
**Date:** 2026-06-12
**Sources:** 34 storablemarine.com pages harvested (see `raw/_index.csv`). Every claim below cites a source URL.

> **Method note (deviation — read this):** A true link-following crawl was **not possible** in this environment. Direct `requests`/`curl` egress is blocked by the network policy (`host_not_allowed`), and the harness fetcher gets HTTP 403 from the site's bot protection. The **only** working channel to live page content was the harness WebSearch tool, which surfaces real page text with source URLs. The `raw/` corpus is built from that harvested text, so claims remain auditable. No Playwright fallback was reachable (network blocked at the policy layer, not the rendering layer). Treat page text as faithful-but-paraphrased rather than byte-exact HTML.

---

## Executive read (Fleet-Pilot-lensed)

- **The wedge is narrower than it was, but still open.** Storable already ships condition documentation **for rentals/boat-club** — "before/after photos, digital signatures, and clear documentation" to "protect against damage claims" ([CRM](https://www.storablemarine.com/services/customer-relationship-management/), [rental](https://www.storablemarine.com/boat-club-rental-software/)). But it is framed as rental-liability hygiene, not a structured dock-floor inspection/handoff/defect-tracking workflow, and there is **no sign** of it extending to slip turnover, service handoffs, or damage-dispute resolution.

- **Storable is a payments-and-back-office company first.** The center of gravity is billing, recurring charges, POS, dynamic pricing, and 80+ reports ([POS/billing](https://www.storablemarine.com/services/pos-billing/), [8 benefits](https://www.storablemarine.com/resources/why-marina-management-software-delivers-exceptional-results/)). Dock-floor execution is an afterthought bolted onto Molo Task Management for drystack launch/retrieval ([Molo Task Mgmt](https://www.storablemarine.com/resources/molo-task-management/)) — not condition/defect capture.

- **They own the system of record (Molo + Stellar) and the money rails (Stripe).** Fleet Pilot enters as either an integration on top of that record or a wedge in the gap they describe but don't fill: structured, disputable condition evidence at every handoff. Their own marketing supplies the pain language to sell against ([case studies](https://www.storablemarine.com/case-studies/)).

---

## Payment / billing capabilities

Storable's payment surface is broad and clearly the product's spine:

- **Tenders & methods:** credit card, ACH, Google Pay, Apple Pay; chip & contactless, prepay/postpay, pay-at-pump, QR-code scanning, "unified billing across all departments" ([POS/billing](https://www.storablemarine.com/services/pos-billing/)).
- **Billing automation:** automated invoicing, recurring charges, auto-renew/auto-pay to "cut down on late payments" and steady cash flow ([automated invoicing](https://www.storablemarine.com/resources/the-benefits-of-automated-invoicing-and-recurring-charges-for-time-and-cost-savings/), [POS/billing](https://www.storablemarine.com/services/pos-billing/)).
- **POS:** on-site fuel, retail, and service charges in one platform; POS syncs directly to billing/reporting ([POS/billing](https://www.storablemarine.com/services/pos-billing/), [service mgmt](https://www.storablemarine.com/services/service-management/)).
- **Dockside mobile capture:** mobile app + card reader completes a sale, takes the card, and "handle[s] tips—all in a single, swift motion," with up to four configurable tipping options ([Molo fuel pumps](https://www.storablemarine.com/resources/how-molo-can-increase-efficiency-at-your-marina-pumps/)).
- **Reservations payments:** short-term slip reservations booked online with full payment processing; self-service bill-pay for boaters ([slips](https://www.storablemarine.com/services/slips-mooring-storage/)).
- **Compliance:** PCI DSS / PCI-compliant readers ([8 benefits](https://www.storablemarine.com/resources/why-marina-management-software-delivers-exceptional-results/)).

**Deposits / damage deposits:** Notably **absent as a named feature.** Across payment, POS, billing, and rental pages there is no "security deposit," "damage deposit," or "authorization hold" language. The closest construct is the **operator-side Reserve account** in the Terms of Service (money Molo can withhold from the *operator's* payouts to cover losses/disputes), not a *boater* damage-deposit/hold tool ([legal](https://www.storablemarine.com/legal/)). **→ Gap for Fleet Pilot:** damage deposits and condition-linked holds appear unbuilt.

---

## Dock-floor execution — gap analysis (does the wedge hold?)

**What Storable HAS that touches the floor:**
- Rental/boat-club **before/after photos + digital signatures + documentation**, explicitly to "protect against damage claims" ([CRM](https://www.storablemarine.com/services/customer-relationship-management/), [rental](https://www.storablemarine.com/boat-club-rental-software/)). This is the single most wedge-relevant capability found.
- Mobile dockside tools: "view occupancy, perform meter readings, upload photos" ([slips](https://www.storablemarine.com/services/slips-mooring-storage/), [cloud access](https://www.storablemarine.com/resources/leading-marina-operations-software-options-cloud-access/)).
- **Molo Task Management** for drystack **launch/retrieval** workflows — queue visibility, task assignment "from dockhands to service managers," billable-work tracking ([Molo Task Mgmt](https://www.storablemarine.com/resources/molo-task-management/), [mobile apps](https://www.storablemarine.com/services/mobile-apps/)).
- Service yard: work orders, parts/labor, technician scheduling ([service mgmt](https://www.storablemarine.com/services/service-management/)).
- Digital waivers ([rental](https://www.storablemarine.com/boat-club-rental-software/)).

**What is MISSING (the wedge):**
- **Structured inspection workflow** — no checklist-driven inspection, no per-component condition capture, no defect catalog. Photos are an attachment, not a record.
- **Check-in/check-out *condition handoff*** beyond rentals — nothing extends before/after evidence to **slip turnover, transient arrival/departure, haul-out, or service drop-off/pickup** handoffs.
- **Defect tracking / damage-dispute resolution** — no dispute workflow, no evidence chain tying a photo to a charge to a resolution. Documentation is described as protective, not adjudicating.
- **Handoff accountability** — Molo Task Management coordinates *who launches what when*, but does **not** capture *what condition the boat was in at each handoff* — the exact seam Fleet Pilot targets.

**Verdict: The wedge still holds — but it is shrinking from the rental side.** Storable has proven it will build condition-evidence features when liability demands it (rentals). The risk is they generalize "before/after photos" from rentals to all handoffs. Fleet Pilot's defensibility is in the *structured, disputable, defect-tracked* layer Storable treats as a photo attachment, and in covering handoff types (slip turnover, service, transient) Storable's condition tooling doesn't touch.

---

## Operator pain language harvested (verbatim-adjacent, for discovery framing)

Storable's own copy hands you the interview language. Pull these phrases:

- **"on paper"** — Pine Knot ran 400 slips, 20+ rentals, service & retail "on paper," causing "lost bookings, slow checkout times, manual reconciliation" ([case studies](https://www.storablemarine.com/case-studies/)).
- **"paper and pen for everything"** — waivers, intake forms, bookings; "a very manual process" ([case studies](https://www.storablemarine.com/case-studies/)).
- **"radios, whiteboards, spreadsheets, and separate systems"** — how launch requests arrive today ([Molo Task Mgmt](https://www.storablemarine.com/resources/molo-task-management/)).
- **"phone calls, walk-ups, texts, emails, and whiteboard notes"** then "manually prioritize, track, and execute" ([Molo Task Mgmt](https://www.storablemarine.com/resources/molo-task-management/)).
- **"brings calm to the chaos"** — their framing of drystack launch coordination ([Molo Task Mgmt](https://www.storablemarine.com/resources/molo-task-management/)).
- **"disconnected processes ... create operational challenges"** ([cloud access](https://www.storablemarine.com/resources/leading-marina-operations-software-options-cloud-access/)).
- **"reduce paperwork and standardize turnarounds"** — explicit operator goal ([slips](https://www.storablemarine.com/services/slips-mooring-storage/)).
- Legacy-system pain: "lack of cloud access, frequent connectivity outages, cumbersome reporting and fully manual invoicing" (Harbourgate) ([case studies](https://www.storablemarine.com/case-studies/)).
- Cost pressure: "80% of operators expect expenses to increase," rising in "staffing, insurance, and maintenance" ([trends 2026](https://www.storablemarine.com/resources/marina-industry-trends-2026/)).

**Fleet Pilot angle:** "standardize turnarounds," "manual reconciliation," and the insurance/dispute cost line are direct openings for condition-documentation ROI.

---

## Integration ecosystem

- **Named integration partners:** QuickBooks, Xero (accounting); SpeedyDock (drystack/launch); FuelCloud (fuel); Slack (comms) ([integrations](https://www.storablemarine.com/marina-software-integration/), [POS/billing](https://www.storablemarine.com/services/pos-billing/)).
- **FuelCloud depth:** bidirectional — self-serve pump dispenses sync automatically into Storable, single-click invoicing, audit reports for fuel-loss ([FuelCloud](https://www.storablemarine.com/marina-software-integration/fuelcloud/)). Shows Storable will do real two-way data sync with point solutions.
- **Payments rail:** **Stripe** is the underlying processor; Molo sits on top and controls payouts/reserves ([legal](https://www.storablemarine.com/legal/)).
- **Corporate / brand:** Molo, Inc. operates Storable Marine + Storable Rentals across storablemarine.com, getmolo.com, stellarims.com; Stellar (rentals) merged into Molo under the unified Storable Marine brand ([brand unify](https://www.storablemarine.com/resources/storable-unifies-marine-software-solutions-under-new-storable-marine-brand/)).
- **No public developer API / app marketplace** surfaced. Integrations look partner-by-partner, not self-serve. **→ Fleet Pilot integration path is likely a named-partner BD motion, not a public API.** (Open question — see below.)

---

## Pricing signals

No public self-serve pricing — everything routes to "Talk to Sales" / demo ([contact](https://www.storablemarine.com/contact/)). Quantified signals found:

- **Dynamic pricing automation → revenue increases "up to 10%"** (Suntex, 72 marinas) ([Suntex](https://www.storablemarine.com/resources/suntex-marinas-accelerates-enterprise-growth-with-storables-marine-technology-suite/)).
- **+14% median YoY revenue** reported by operators in 2025 ([trends 2026](https://www.storablemarine.com/resources/marina-industry-trends-2026/)).
- **Booking urgency:** 56% of reservations within a week of departure; 20% within 24 hours ([trends 2026](https://www.storablemarine.com/resources/marina-industry-trends-2026/)).
- **Scale claims:** "over 1,000+ marine businesses" ([home](https://www.storablemarine.com/)); Suntex = 72 owned marinas on the enterprise suite ([Suntex](https://www.storablemarine.com/resources/suntex-marinas-accelerates-enterprise-growth-with-storables-marine-technology-suite/)); Molo Task Management targets "50+ slips" drystack operations ([Molo Task Mgmt](https://www.storablemarine.com/resources/molo-task-management/)).
- **Fee structure (operator-borne):** operators pay all card-brand + Stripe + Molo processing fees, including fees on "refunds, payouts, or disputes" ([legal](https://www.storablemarine.com/legal/)). No SaaS subscription number is public.

---

## Open questions

1. **Does the rental "before/after photo" feature already cover slip turnover or service handoffs**, or is it rental-only? (Pages imply rental-only — needs confirmation via demo or a marina operator.)
2. **Is there any structured defect/dispute workflow** behind the photos, or just attachment + signature? Nothing found suggests structure.
3. **Is there a public/partner API or only named integrations?** No developer docs surfaced — confirms BD-led integration path but unverified.
4. **Damage-deposit / authorization-hold for boaters** — does Stripe-on-Molo support holds today even if unmarketed? The Reserve construct is operator-side only.
5. **Roadmap signal:** the 2026 trends/ebook lean on "automation and AI" ([trends 2026](https://www.storablemarine.com/resources/marina-industry-trends-2026/)) — watch for AI-driven inspection/condition features as a wedge threat.
6. **Pricing tiers** (Molo vs Stellar vs enterprise) — entirely sales-gated; unknown.

> **Coverage caveat:** Because direct crawling was blocked, this brief reflects content surfaced by WebSearch across 34 pages, not a byte-exact render of every page. Feature *absences* noted above are "not found in harvested copy," which is strong but not identical to "confirmed not in product." Items 1–4 should be settled by a demo or an operator conversation.
