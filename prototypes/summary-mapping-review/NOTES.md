# Summary mapping review — data notes

This file is for reviewers of the prototype. It is not part of the product UI.

Org observed: **DS_test_2_dasha**, 6 November 2026. The reference this replaces is Ignat’s premapped flow at `projects/summary-premapped/` (look and mappings-list chrome). That file was not modified.

## Observed in the live Synder demo

- Mappings list columns, in order: checkbox, Group, Account subtype, Payment gateway, Integration, Location, Class, Account.
- Account, Class, and Location cells are dropdowns. Empty cells use the placeholder `Search or start typing...`.
- Location values: Berlin, Stripe, Test.
- Class dropdown empty state, two lines:
  - `No classes found in your books`
  - `The classes list in your books seems to be empty. Create classes in your accounting first to map them in Synder.`
- Mapping status filter values: All, Mapped, Not mapped.
- Suggested account names seen: Stripe fees, Stripe expenses, Accounts Receivable (A/R), Stripe clearing (Synder), Exchange Gain or Loss, Stripe sales.
- Default groups: Transfers to balance, Chargebacks, Refunds, Sales, Clearing, Expenses, Fees, Invoices, Sales tax payable, Shipping income, Discounts, Tax withheld by marketplace, Inventory assets, Cost of Goods sold, Balance Reserves, Stored Balances, Gift card liability, Customer Balance, Bad Debts, Deferred Revenue, Shipping fees, Unapplied cash payment income, Tips.
- Custom group: `Stripe transfers` with account subtype Bank.
- Integration name example: `Test account_1 (Stripe)`.
- Page title `Mappings list` and subtitle `Create mappings between transactions and your Chart of Accounts.`

## Observed in the Synder UI kit (and used here)

- Font: Roboto. Minimum text size 14px.
- Primary `#0053CC` (hover `#1A43A2`). Sidebar and top-bar blue `#007AFF`.
- Borders `#DFE4EC`. Text `#1A1B24`. Secondary text `#6B778C`.
- Controls use a 4px radius. Buttons and fields are 32px tall.
- Sidebar shell matches the kit’s production “current” frame: `#F6F6F6` background, `#555555` item text, `#C8C7CC` divider, active row `#007AFF` with white text.

## Seen in the reference prototype, not re-checked in the live demo for this task

- Payment gateway text `Online Sales` on mapping rows. This prototype uses that string as example gateway text.
- Unmapped rows use a light amber row tint (`#FFF1DD`). Needs-account rows use the same tint.
- Top bar shows a balance, “How it works?”, and icon buttons. The balance figure is example chrome.

## Proposed — example data and rules

These are not verified product rules. They exist so the prototype can be reviewed and tested.

### Chart of accounts

Observed names are used as-is and typed as follows:

| Account | Type used here |
| --- | --- |
| Stripe fees | Expense |
| Stripe expenses | Expense |
| Accounts Receivable (A/R) | Accounts Receivable |
| Stripe clearing (Synder) | Other Current Asset |
| Exchange Gain or Loss | Other Expense |
| Stripe sales | Income |

Everything else in the dropdown is an example account (PayPal and Shopify equivalents, liability and income accounts, `Example checking`, `Example savings`).

### Which rows start with a suggestion

Per integration, most default groups start with a proposed account. These start empty, each with a visible reason:

- Bank rows (`Stripe transfers`, plus example `PayPal transfers` and `Shopify payouts`): “Bank accounts are entered by hand. Synder does not suggest an account for this row.”
- Tax withheld by marketplace, Balance Reserves, Stored Balances, and the example groups Duties and Reserve release: “No compatible account was proposed for this group.”

Pairing of the other groups to accounts is a proposal. Notably:

- Sales, Refunds, and Wholesale sales can share an account name such as Stripe sales and still stay in different batches, because the purpose differs.
- Fees and Commissions can share Stripe fees and stay apart for the same reason.
- Expenses, Shipping fees, Advertising, and Packaging can share Stripe expenses and stay apart.
- Exchange adjustments and Rounding differences can share Exchange Gain or Loss and stay apart.
- Sales tax payable is not placed in the sales batch.

### Compatibility

A row can be confirmed only when its account type matches the group:

- Income groups accept Income.
- Expense groups accept Expense.
- Bank groups accept Bank only.
- Other subtypes accept that subtype only.

An incompatible choice stays on the row, is marked invalid, counts as **Needs account**, and blocks Continue to Summaries. Bulk apply skips incompatible rows and lists them. It does not change them.

### Bank rows are never auto-confirmed

Bank rows have no suggestion, are excluded from batches, and are not confirmed by “accept this batch”. They become confirmed only when a person chooses a Bank account and uses the scoped Save/Accept action. Loading the demo never marks them confirmed.

### Batches

A batch is the set of rows that share all three of: purpose, proposed account, and integration. Example companion rows (Morning blend, Card fee, and similar) exist only to give a few batches more than one row. They are not observed Synder groups.

Accepting a batch confirms only rows that still have that proposed account and have no individual pending edit. A row someone changes is left out of that accept.

### States, filters, and gating

- **Needs account** — draft account empty or incompatible.
- **Suggested — needs confirmation** — draft account is valid and the row is not confirmed. A premapped suggestion starts here. It is not confirmed.
- **Confirmed** — a valid account has been accepted and nothing is pending.
- **Pending** is separate. It means the draft differs from the last accepted values. Counters for the three states ignore filters and paging. Pending is an extra counter and also ignores filters and paging.
- Mapping status **Mapped** means Confirmed and not pending. **Not mapped** is everything else. That reading of the observed filter is proposed.
- Class and Location may stay empty. They never block Continue.
- Continue to Summaries turns on only when every row is confirmed, every account is valid, and nothing is pending. The destination is labelled simulated.
- One Save/Accept button renames itself to the active scope: selected on this page, all results (current integration, search, and filters, every page), or the open batch.
- Selected-on-page changes only checked rows on the current page. Same group name on another integration is a different row.

### Other example records

- Integrations besides the observed one: `Example Checkout (PayPal)`, `Example Store (Shopify)`.
- The demo seeds 123 rows (41 per integration).
- Browser storage key: `synder-summary-mapping-review-v1`. Reset demo clears it and restores the seed.
- The Status column and the batch/exception panels are proposed. They are not in the observed column list.

## How to run the tests

From `prototypes/summary-mapping-review/`:

```bash
npm install
npx playwright install chromium
npm test
```
