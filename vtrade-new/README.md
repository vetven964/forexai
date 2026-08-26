# V-Zone AI — Website

Standalone PC/Phone UI for the V-Zone AI project. This folder is intentionally isolated from the legacy phone UI.

## Test

Run:

```bash
node scripts/vtrade-new-smoke.mjs
```

The smoke test validates routes, responsive viewport, drawer behavior, Auto Trade controls, lot/risk settings, symbol manager, persistence, execution guard, and JavaScript parsing.

## Deploy

The GitHub Pages workflow copies this folder as the site root. It is a UI/demo surface only; live MT5 order execution remains disabled until a validated backend/EA execution API is connected.
