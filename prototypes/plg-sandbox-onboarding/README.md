# PLG Sandbox onboarding

Interactive static prototype for Synder PLG Pro Sandbox post-payment onboarding: Choose plan → Checkout → Survey → HubSpot / Success → Thank you (in-app autocharge) → in-app **Setup checklist** (own page; entry via the grey sidebar progress chip — not a Dashboard nav item).

Open `index.html` and use the dark top bar to switch **Plan · Checkout · Survey · HubSpot · Success · Thank you · App**, try Sync mode **Summary | Per transaction** on the App view, and **Reset** to clear survey state.

## Behavior notes
- Survey sits on white (no bordered card). A sticky Subtitle1 welcome line (plan-aware Standard/Max) sits above the question on every step so vertical position stays stable. **I’ll fill this in later** closes the questionnaire and opens **Thank you** (in-app shell). Activation-session shortcut jumps to step 3 (contact still required).
- **Success** is booking confirmation only (“You’re all set.”); contact result block kept; Continue → Thank you.
- **Thank you** matches the product in-app thank-you screen: app shell (sidebar + top bar), left-aligned subscription copy, auto-charge toggle (default ON). No check icon, ready-to-activate list, or Continue CTA. Sidebar **Dashboard** opens App as usual.
- **Setup checklist**: Hybrid-only step copy; score is self-serve only. Soft-locks share one story — **On your setup call** (no per-step lock chips; call divider carries that label). Core-sales CTA uses Settings → Products/Services.

Live: https://dashasyn.github.io/synder-ux-prototypes/prototypes/plg-sandbox-onboarding/
