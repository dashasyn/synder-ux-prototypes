# Synder onboarding — transaction organization variants

Open `index.html` in a browser and switch variants from the dark proto-bar. Independent selection state per tab; default is **Per transaction**.

## V2 changes

- **Current** baseline added — mirrors today’s product (Import→Organize→Customize→Sync chevron, long mismatched checkmark lists, Recommended pill, no why-reason, no books preview).
- **Realistic QuickBooks register preview** on A, B, and C: Date | Type | Name / Memo | Account | Amount, labeled “Example in QuickBooks after sync”. Per = 4 lines (Payment, Sales Receipt, Expense, Refund); Summarized = Deposit + Journal fee (2 lines). Caption updates on select.
- **Variant B interaction fixed** — selecting Per vs Summarized highlights the matrix column (blue header, dim other) and swaps the books preview underneath.
- **Why recommended** chip on A, B, and C (Shopify + QBO → close invoices per sale). Selecting Summarized keeps the chip and adds a calm note about bank matching.
- Variant C keeps reversibility copy and now includes the same live preview.

## Variants

| Tab | What it tests |
|-----|----------------|
| **Current** | Baseline: long bullet lists, Recommended badge, chevron flow |
| **A · Outcome + preview** | Short outcome lines + live books register + why chip |
| **B · Criteria matrix** | Shared criteria matrix with column highlight + live preview |
| **C · Why + reversible** | Contextual why, short cards, Settings/another-org reassurance + preview |
