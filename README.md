# Synder UX prototypes

Public gallery of simple, static UX prototypes for Synder. No frameworks — open any `index.html` in a browser or via GitHub Pages.

## View on GitHub Pages

**https://dashasyn.github.io/synder-ux-prototypes/**

- Gallery home (folders + singles): `/`
- Folder — Payment application: `/folders/payment-application/`
- Folder — Transaction reconciliation setup: `/folders/txnrecon-setup/`
- Prototype — Payment matching rules (v4.0): `/prototypes/payment-matching-rules/`
- Prototype — TxnRecon compare (Var 1 vs 2): `/prototypes/txnrecon-setup-compare/`

## Structure

```
index.html                          # hub: Folders + Singles
folders/<slug>/index.html           # folder page (Back → hub, same tab)
prototypes/<slug>/index.html        # prototype (open in new tab from hub/folder)
```

Folders open in the same tab. Prototypes always open in a new tab.

## Local preview

```bash
cd synder-ux-prototypes
python3 -m http.server 8080
```

Then open `http://localhost:8080/`.

## Adding content

1. Put the prototype under `prototypes/<slug>/`.
2. Either add a card on a folder page (`folders/<slug>/index.html`) or under **Singles** on the hub.
3. Update the folder’s prototype count on the hub card.

HTML comments in each file show the copy-paste card pattern.

## Maintenance

Ignat’s assistant updates this repository when new prototypes are ready.
