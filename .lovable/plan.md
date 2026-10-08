# Point of Sale (POS) App for a Generic Store

Build a browser-only POS application for a generic retail store. No backend: all data lives in the browser (localStorage) and survives refreshes on that device. Payments are recorded as cash/card only — no real payment processing.

## Features

1. **Checkout / Cart** (the home screen at `/`)
   - Product grid with search and category filter; tap a product to add it to the cart.
   - Cart panel showing line items, quantities (+/-), per-line and total amounts.
   - Discount entry (percent or fixed amount) on the whole sale.
   - "Complete sale" flow: choose Cash or Card, confirm, record the sale, decrement stock, show a success confirmation.
2. **Product & Inventory** (`/products`)
   - List of products with name, price, SKU, category, and stock level.
   - Add / edit / delete products via a form.
   - Low-stock indicator (highlight products under a threshold, default 5 units).
   - Ships pre-seeded with a small catalog of generic retail demo products.
3. **Sales Reports** (`/reports`)
   - Totals: revenue, number of sales, average sale value (today, last 7 days, all time).
   - Breakdown by payment method (cash vs card).
   - Top-selling products list.
   - Recent sales list with timestamp, items, and total.

## Data & Persistence

- localStorage is the single source of truth, accessed through one small store module (load/save, with a versioned key) so all screens read and write the same data.
- Three collections: `products`, `sales` (each sale: id, timestamp, items snapshot, subtotal, discount, total, payment method).
- Stock decrements when a sale is recorded; deleting a product keeps past sales intact (sale stores its own item snapshot).

## Design

- One cohesive visual direction: a clean, high-contrast retail terminal look — warm neutral background, dark ink text, a single strong accent for primary actions, tabular numerals for money. Fully responsive with the mobile viewport (390px) as a first-class target; on mobile, cart is a bottom sheet / drawer.
- Semantic design tokens in `src/styles.css` (oklch) — no hardcoded colors in components.

## Routes (TanStack Start)

- `src/routes/index.tsx` — Checkout (rewrite the placeholder; this is the main screen).
- `src/routes/products.tsx` — Product & inventory management.
- `src/routes/reports.tsx` — Sales reports.
- Shared top nav (Checkout / Products / Reports) rendered in `src/routes/__root.tsx` around `<Outlet />`.
- Each route gets its own `head()` with unique title/description/og tags.

## Files

- `src/lib/pos-store.ts` — types, localStorage load/save, seed data, sale recording logic.
- `src/lib/currency.ts` — money formatting helper.
- `src/components/` — CartPanel, ProductCard, ProductFormDialog, LowStockBadge, StatCard, Nav.

## Verification

- Check `/tmp/observability/build-errors.log` after edits.
- Drive the app with Playwright: add items to cart, complete a cash sale, confirm stock decrements and the sale appears in Reports; add/edit a product in Products.
