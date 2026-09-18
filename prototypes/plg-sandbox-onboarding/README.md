# PLG Sandbox onboarding

Interactive static prototype for Synder PLG Pro Sandbox post-payment onboarding: a 3-step survey, a success / next-steps screen, and the in-app **Setup checklist** (own nav page; Dashboard is a normal welcome placeholder).

Open `index.html` and use the dark top bar to switch **Survey → Success → App**, try Sync mode / Progress presets on the App view, and **Reset** to clear survey state.

## Behavior notes
- Survey sits on white (no bordered card). **I’ll fill this in later** advances to the next step only (hidden on step 3 — contact required). Activation-session shortcut jumps to step 3.
- Success uses one neutral header; contact result block kept; no beige CSM callout. Call is booked here.
- **Setup checklist** is its own sidebar page (not Dashboard): rich step cards with where-to-go links and **Mark as done**. Sidebar shows a compact progress chip that opens this page. No blue Next block, no Book call CTAs, no Smart Rules tip. Soft-locks keep Learn + talk-to-specialist only.

Live: GitHub Pages under this repo → `/prototypes/plg-sandbox-onboarding/`.
