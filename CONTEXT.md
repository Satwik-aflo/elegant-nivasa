# Elegant Nivasa Web

The public web presence for the Elegant Nivasa residential project. A single new build
(replacing the legacy WordPress site) made of one main site and three conversion-focused
sub-sites, each aimed at a different ad angle.

## Language

**Main site**:
The primary brand website at the root domain (`elegantnivasa.com`). The new build that
replaces the legacy WordPress site. Holds the lead-capture form.
_Avoid_: homepage, WordPress site, corporate site

**Sub-site**:
One of three distraction-free comparison pages, each proving Elegant Nivasa beats the nearby
builders along one angle — **Cost**, **Handover**, **Rental-yield** — and reachable on its own
**path** under the main domain (`/cost`, `/handover`, `/rental-yield`), never a subdomain. Single
job: drive a WhatsApp enquiry. No main-site nav. Part of the one codebase so metrics stay unified.
_Avoid_: landing page, ad page, variant, micro-site, subdomain

**Nearby builder**:
A competing residential project in the same locality that a sub-site compares Elegant Nivasa
against — the comparison's "them" column. **Always referred to generically, never named** (ASCI
safety). Comparison figures are static, curated content maintained in the repo.
_Avoid_: competitor, rival, branded builder, naming any actual project

**Lead**:
A prospective buyer's contact details captured via the **main-site form**, stored in our own
database first and then pushed to sales. The thing we own and measure. Distinct from an Enquiry.
_Avoid_: contact, prospect, submission

**Enquiry**:
A WhatsApp conversation started from a sub-site's click-to-chat, landing **directly in a sales
rep's personal WhatsApp**. Not stored by us — only the click that started it is tracked.
_Avoid_: lead, chat, message

**Sales rep**:
A named human closer who personally receives sub-site Enquiries on their own WhatsApp number.
There are two.
_Avoid_: agent, salesperson, pre-sales, middleman

**Conversion**:
A success event we count and attribute — either a **Lead** (main-site form submit) or an
**Enquiry** (sub-site WhatsApp click). The same event is fired to every analytics/ad tool
(Clarity, Meta Pixel) so the numbers reconcile.
_Avoid_: goal, signup, win

**Cutover**:
The moment the root domain is pointed at the new build and the legacy WordPress site is
retired. Distinct from the staging period before it (which is not "coexistence").
_Avoid_: go-live, launch, migration
