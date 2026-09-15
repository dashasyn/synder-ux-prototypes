# Synder · Mappings list — bulk apply (prototype)

Self-contained vanilla HTML/CSS/JS prototype for **account mapping** with:

- Wide mappings table (sticky checkbox + group columns while scrolling horizontally)
- Filters (Integration + search) — **Apply always targets currently filtered rows only**
- Classic path: select rows → selection bar → **Map** → Bulk mapping popup
- In-cell path: change Account / Class / Location / Tax → **Apply to filtered rows** → same popup
- Bulk popup: filtered-row count, multi-integration warning + “Use this integration only”, prefill only the field you came from, Cancel + Save mapping, toast on save

## Open

```bash
# from this folder, or open the file directly in a browser
open index.html
# or: python3 -m http.server 8080  →  http://localhost:8080/index.html
```

Uses the hosted Synder UI kit + Google Fonts / Material Icons (needs network).

## Try this flow

1. Filter **Integration → Stripe**
2. Change **Class** on one row → click **Apply to filtered rows**
3. Confirm popup shows filtered count (+ integration clarity if mixed)
4. **Save mapping** → toast; matching filtered rows update
5. Scroll the table sideways — checkboxes stay visible; select a few → **Map** from the bar
