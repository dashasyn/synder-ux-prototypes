# PLG Sandbox onboarding

Interactive static prototype for Synder PLG Pro Sandbox post-payment onboarding: a 3-step survey, a success / next-steps screen, and the in-app **Setup checklist** (own page; entry via the grey sidebar progress chip — not a Dashboard nav item).

Open `index.html` and use the dark top bar to switch **Survey → HubSpot → Success → App**, try Sync mode **Summary | Per transaction** on the App view, and **Reset** to clear survey state.

## Behavior notes
- Survey sits on white (no bordered card). **I’ll fill this in later** closes the whole questionnaire and drops into App with a 24h snooze banner (also on step 3). Activation-session shortcut jumps to step 3 (contact still required).
- Success uses one neutral header (“You’re all set.”); contact result block kept; no beige specialist callout. Call is booked here.
- **Setup checklist**: Hybrid-only step copy; score is self-serve only. Soft-locks share one story — **On your setup call** (no per-step lock chips; call divider carries that label). Core-sales CTA uses Settings → Products/Services.

Live: https://dashasyn.github.io/synder-ux-prototypes/prototypes/plg-sandbox-onboarding/
