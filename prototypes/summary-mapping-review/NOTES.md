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

Pairing of groups to accounts is a per-row proposal inside the table. It is not a live Synder rule. Sales, refunds, and wholesale can share an account name such as Stripe sales and still be separate rows. The screen does not group them into batches.

### Compatibility (example only)

A saved mapping counts as valid here only when the account type matches the group: Income, Expense, Bank, or the row’s own subtype. An incompatible choice stays unresolved. This is prototype data, not a verified books rule. Tests do not establish live Synder accounting rules.

### How the screen behaves

- One table. Missing rows sort first. A count button filters to them. There is no separate missing-account list and no suggestion-batch panel.
- Column order puts Group and Account first, then a compact status, then integration, subtype, and payment gateway. Location and Class sit to the right of Account.
- Status words: Needs account, Proposed (a filled suggestion that is not saved), Unsaved (the account draft differs from the saved account — not shown as confirmed), Confirmed.
- **Save mappings** is the only save. It confirms every populated valid account on every page, including rows hidden by the current filter, and it keeps edits. It does not mark a blank account complete. A partial save is allowed. Rows that are already confirmed stay confirmed unless their account or dimensions were edited.
- **Continue to Summaries** is hidden until every row has a valid saved account and there is no unsaved account change. Empty Class and Location do not block it. An unsaved location does not block it. The destination is labelled simulated.
- Checkboxes are optional. The selection bar appears only above the table, and only when something is selected. It shows how many selected rows are on this page and how many are hidden. **Change account** writes the new account onto the exact selected ids and does not save. **Save mappings** commits that draft. The dialog states how many confirmed accounts would be replaced and says class and location are left alone. Filters and tabs do not add rows to the selection. Clearing a checkbox removes that id.
- Revert restores one row. Discard unsaved changes restores every draft. Both are text actions, shown only when something is unsaved.
- Browser storage key: `synder-summary-mapping-review-v2`. Reset demo clears it.

### Other example records

- Integrations besides the observed one: `Example Checkout (PayPal)`, `Example Store (Shopify)`.
- The demo seeds 123 rows (41 per integration), including example companion rows such as Morning blend and Card fee.
- Bank rows start empty. They are confirmed only after a person chooses a Bank account and uses Save mappings.
- The compact Status column is proposed. It is not in the observed column list. The on-screen column order also differs from the live demo so Account sits next to Group.

## How to run the tests

From `prototypes/summary-mapping-review/`:

```bash
npm install
npx playwright install chromium
npm test
```
