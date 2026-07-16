# Google AdSense setup (not payments)

## Important correction

You asked about a **payment system using AdSense**. AdSense is **not** that.

| What you might want | What it actually is |
|---|---|
| **AdSense** | Advertising monetization — Google shows ads on your site; **you get paid** when visitors see or click those ads |
| **Checkout / Stripe / PayPal** | Real payments — visitors pay *you* for a product or subscription |

AdSense = you earn from ads. It is **not** checkout, invoicing, or collecting money from users. If you later want real payments (donations, premium unlock, etc.), that is a **separate track** (e.g. Stripe). Do not mix the two.

Live site URL for AdSense: `https://jotaeliezer.github.io/StudyBuddy_Planner/`

---

## Checklist: get AdSense running

### 1. Eligibility (before you apply)

Google reviews your **live** site. Rough expectations:

- [ ] Site is publicly reachable over HTTPS (GitHub Pages is fine)
- [ ] Enough **original content** (planner apps / SPAs often struggle — thin UI-only pages get rejected)
- [ ] Working navigation; no broken pages or placeholder “coming soon” shells
- [ ] A clear **Privacy Policy** page (required; see below)
- [ ] Content that follows [AdSense program policies](https://support.google.com/adsense/answer/48182) (no prohibited topics, no misleading claims)
- [ ] Site is yours / you control the domain or GitHub Pages project

Tip: SPAs with little static text often fail review. Adding a short About / How it works / Privacy page with real prose helps.

### 2. Create the AdSense account and add the site

1. Go to [Google AdSense](https://www.google.com/adsense/) and sign in with a Google account.
2. Start application / create account (country, payment address, etc.).
3. Add your site URL: `https://jotaeliezer.github.io/StudyBuddy_Planner/`
4. Follow the on-screen steps to verify site ownership (AdSense usually asks you to add a small snippet or meta tag — **only add that when you are ready and after reading Google’s current instructions**; do not paste publisher IDs into the app until approved and you ask for code work).

### 3. Wait for review

- Approval can take **days to weeks** (sometimes longer).
- SPA / app-like sites are commonly delayed or rejected for “low value content.”
- Check AdSense → Sites for status. Fix issues Google lists, then request another review if needed.

### 4. Privacy policy (required)

Before or during review, publish a Privacy Policy that covers at least:

- What data the app stores (this app uses **localStorage** in the browser; no server account)
- That third-party ads (Google) may use cookies / identifiers for ads and measurement
- Link to [Google’s privacy / ad policies](https://policies.google.com/technologies/ads) as appropriate
- How users can contact you

Host it on the same site (e.g. a `/privacy` route or static page) and link it from the footer.

Live privacy policy URL: `https://jotaeliezer.github.io/StudyBuddy_Planner/privacy.html` (or `./privacy.html` from the site root).

### 5. After approval: ad units (future code — not now)

Only after AdSense shows the site as **Ready / Approved**:

1. In AdSense, create ad units (display / in-article / etc.).
2. Copy the ad unit snippet Google gives you.
3. Place ads in the app (see “Where ads could go later” below).

**Do not implement ad scripts in this repo until approved and you explicitly ask for that work.**

### 6. `ads.txt` on GitHub Pages

Google recommends an [`ads.txt`](https://support.google.com/adsense/answer/7532444) file so buyers know who is authorized to sell ads for your site.

For this project’s GitHub Pages URL (`…/StudyBuddy_Planner/`):

- `ads.txt` must be reachable at the **site root Google expects**. For a project site, that is often:

  `https://jotaeliezer.github.io/ads.txt`

  (user/org Pages root), **not** under `/StudyBuddy_Planner/ads.txt`, depending on how Google resolves the publisher site. Confirm in AdSense when they ask for `ads.txt`.

- Typical line format (example only — use the exact line AdSense shows you):

  `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`

- On GitHub Pages, put `ads.txt` in the repo that publishes to `username.github.io` **or** ensure your build/deploy serves it at the URL AdSense checks.

Do **not** invent a publisher ID; copy it from AdSense after approval.

### 7. Policy tips (protect the account)

- **Never** click your own ads. Don’t ask friends/family to click them either.
- Don’t place ads on empty, broken, or login-walled pages without care.
- Keep content useful and original; avoid scraped or thin duplicate pages.
- Don’t encourage accidental clicks (ads too close to buttons, misleading labels).
- Follow AdSense’s invalid traffic and content policies; violations can mean bans.

---

## Where ads could go later (UX notes)

This app is a planner UI — ads should stay out of the way of printing and focus.

| Placement | Notes |
|---|---|
| **Landing / home footer** | Safest first slot: below the fold, away from primary CTAs. Good for review + light monetization. |
| **Planner sidebar** | Possible on wide screens only; keep narrow; never cover courses/tasks. Hide or omit in print CSS. |
| **Avoid** | Inside the printable sheet, over task cells, mood picker, or drag targets. Don’t interrupt “one page print.” |

When implementing later: load ads only after consent/privacy requirements you choose; hide ads when `window.print` / print media applies.

---

## Do not commit AdSense code yet

Until the site is **approved** and you **ask** for implementation:

- Do **not** commit publisher IDs (`pub-…`)
- Do **not** add `adsbygoogle.js` or ad `<ins>` units to the app
- Do **not** check secrets or account emails into the repo

This document is setup guidance only. No live AdSense integration ships with the app today.

---

## If you wanted payments instead

That is a different product: Stripe Checkout, donations, or similar. Open a separate request for payment work; AdSense will not replace it.
