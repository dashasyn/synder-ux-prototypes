# Synder UX prototypes

Public gallery of simple, static UX prototypes for Synder. No frameworks — open any `index.html` in a browser or via GitHub Pages.

## View on GitHub Pages

**https://dashasyn.github.io/synder-ux-prototypes/**

## Folders

| Folder | Path |
|--------|------|
| Reconciliation | `/folders/reconciliation/` |
| Payment application | `/folders/payment-application/` |
| Dashboard | `/folders/dashboard/` |
| Settings | `/folders/settings/` |
| Onboarding | `/folders/onboarding/` |

## Structure

```
index.html                          # hub: Folders + Singles
folders/<slug>/index.html           # folder page (Back → hub, same tab)
prototypes/<slug>/index.html        # prototype (open in new tab from hub/folder)
```

Folders open in the same tab. Prototypes always open in a new tab. Min font size 14px on hub/folder pages.

## Local preview

```bash
cd synder-ux-prototypes
python3 -m http.server 8080
```

Then open `http://localhost:8080/`.
