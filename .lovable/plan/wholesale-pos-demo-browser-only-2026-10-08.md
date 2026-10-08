# Wholesale POS Demo (browser-only)

Build a browser-only POS demo for a wholesale/retail store. No backend: all data lives in localStorage and survives refreshes. Payments are recorded as cash/card only. Currency is PKR (configurable in Settings). Keep the build lean: implement exactly what is listed, nothing more.

## Features

1. **Checkout** (`/`)
   - Product grid with search (name/SKU) and category filter; tap to add to cart.
   - Retail / Wholesale toggle for the whole sale; all cart prices switch together.
   - Each product has a base unit (pcs, kg) and an optional pack (e.g. carton = 12 pcs). Cart line lets the cashier choose base unit or pack. kg allows decimal quantities.
   - Cart: line items, +/- buttons, tap the quantity to type it directly, per-line and total amounts.
   - Optional customer name field.
   - Whole-sale discount (percent or fixed), capped so total never goes below 0.
   - Tax applied from Settings (shown as its own line).
   - Complete sale: choose Cash or Card. For Cash, enter amount tendered and show change due. Record sale, decrement stock (in base units), block selling more than available stock, then show the success screen with a "Print invoice" button.
   - Printable invoice (browser print, A4/A5 friendly via @media print): store name, address, invoice number (INV-0001), date, customer name, items with unit and price tier, subtotal, discount, tax, total, payment method, tendered/change.

2. **Products** (`/products`)
   - List: name, SKU, category, retail price, wholesale price, cost price, stock (in base unit), low-stock highlight (threshold from Settings, default 5).
   - Add / edit / delete via a form: name, SKU, category, base unit, pack name + pack size (optional), retail, wholesale, cost, stock.
   - Pre-seeded with ~12 generic wholesale demo products across 3-4 categories (mix of pcs, kg, and carton packs).

3. **Reports** (`/reports`)
   - Cards for today / last 7 days / all time: revenue, profit, number of sales, average sale.
   - Payment method split (cash vs card).
   - Top-selling products.
   - Recent sales list (invoice no., time, customer, items, total); click to reopen/print the invoice.

4. **Settings** (`/settings`)
   - Store name, address, currency symbol, tax rate % (default 0), low-stock threshold.
   - "Load demo sales" button: generates ~2 weeks of realistic fake sales so Reports isn't empty.
   - "Reset demo" button (with confirm) that restores the seed catalog and clears sales.
   - Changing store name updates the invoice live.

## Data & persistence
- One store module, versioned localStorage key, with a migration hook.
- Collections: `products`, `sales`, `settings`.
- Money stored as integers (paisa). Quantities may be decimal.
- Product: id, name, sku, category, baseUnit, packName?, packSize?, retailPrice, wholesalePrice, costPrice, stock.
- Sale: id, invoiceNo, timestamp, customerName?, priceTier, items[], subtotal, discount, tax, total, paymentMethod, amountPaid, tendered?, change?, status ("completed").
- Sale item snapshot: productId, name, unit sold, qty, qtyInBaseUnits, unitPrice, unitCost, lineTotal. Deleting a product or changing prices must never alter past sales.

## Design
- Clean, high-contrast retail terminal look: warm neutral background, dark ink text, one strong accent for primary actions, tabular numerals for money.
- Semantic oklch design tokens in `src/styles.css`; no hardcoded colors in components.
- Mobile (390px) is a first-class target; cart is a bottom sheet/drawer on mobile.
- Small "Demo mode: data stays in this browser" note in the footer.

## Routes (TanStack Start)
- `src/routes/index.tsx` (Checkout), `products.tsx`, `reports.tsx`, `settings.tsx`.
- Shared top nav (Checkout / Products / Reports / Settings) in `__root.tsx` around `<Outlet />`.
- Each route has its own `head()` with a unique title/description/og tags.

## Files
- `src/lib/pos-store.ts` (types, load/save, seed data, sale recording, demo sales generator)
- `src/lib/currency.ts` (money formatting)
- `src/components/`: CartPanel, ProductCard, ProductFormDialog, LowStockBadge, StatCard, Nav, InvoiceView

## Technical notes
- Pages render on the server first, so localStorage is read only after the page loads in the browser (a short loading state avoids flicker/mismatch).
- Seed data and demo-sales generation run inside functions, never at file load time (random IDs at load time crash the published app).

## Verification
- Check `/tmp/observability/build-errors.log` after edits.
- With Playwright: switch to wholesale, add a carton item, complete a cash sale with change, confirm stock drops by the right base units, open the invoice, and confirm the sale appears in Reports.
