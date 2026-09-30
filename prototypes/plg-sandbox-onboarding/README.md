# PLG Sandbox onboarding

Interactive static prototype for Synder PLG Pro Sandbox post-payment onboarding: Choose plan → Checkout → Welcome → Survey → HubSpot / Success → Thank you (autocharge) → in-app **Setup checklist** (own page; entry via the grey sidebar progress chip — not a Dashboard nav item).

Open `index.html` and use the dark top bar to switch **Plan · Checkout · Welcome · Survey · HubSpot · Success · Thank you · App**, try Sync mode **Summary | Per transaction** on the App view, and **Reset** to clear survey state.

## Behavior notes
- **Welcome** sits between Checkout and Survey (plan-aware title; one-line Synder specialist prep copy; Continue → Survey).
- Survey sits on white (no bordered card; no welcome header). **I’ll fill this in later** closes the questionnaire and opens **Thank you** (not App). Activation-session shortcut jumps to step 3 (contact still required).
- **Success** is booking confirmation only (“You’re all set.”); contact result block kept; Continue → Thank you.
- **Thank you** matches the FDD / thank-you-wizard success look: check icon, next steps, ready-to-activate rows, autocharge toggle (default ON), Continue to Synder → App.
- **Setup checklist**: Hybrid-only step copy; score is self-serve only. Soft-locks share one story — **On your setup call** (no per-step lock chips; call divider carries that label). Core-sales CTA uses Settings → Products/Services.

Live: https://dashasyn.github.io/synder-ux-prototypes/prototypes/plg-sandbox-onboarding/
