# PLG Sandbox onboarding

Interactive static prototype for Synder PLG Pro Sandbox post-payment onboarding: a 3-step survey, a success / next-steps screen, and the in-app Setup Health Score (Main checklist).

Open `index.html` and use the dark top bar to switch **Survey → Success → App**, try Sync mode / Score presets on the App view, and **Reset** to clear survey state.

## Behavior notes
- Survey sits on white (no bordered card). **I’ll fill this in later** advances to the next step only (hidden on step 3 — contact required). Activation-session shortcut jumps to step 3.
- Success uses one neutral header; contact result block kept; no beige CSM callout.
- Health Score is Main-only: rich step cards with where-to-go links and **Mark as done** (manual progress). Sidebar shows a compact progress chip.

Live: GitHub Pages under this repo → `/prototypes/plg-sandbox-onboarding/`.
