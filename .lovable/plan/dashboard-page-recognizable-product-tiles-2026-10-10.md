# Dashboard page + recognizable product tiles

## Part 1 — Checkout: color tiles on the product grid
- Each product card gets a colored tile at the top showing the product's initials (e.g. "BR" for Basmati Rice) and a small category icon.
- Color comes from the category (Grocery, Beverages, Household, Personal Care each get a fixed color); unknown categories get a stable color picked from the name.
- Category filter chips on Checkout use the same colors so cashiers learn them.
- Larger touch targets (min ~44px) kept at 390px width; low-stock badge stays on the tile.
- No photo upload (keeps data small in the browser); can be added later.

## Part 2 — Owner Dashboard (`/dashboard`)
- "Dashboard" becomes the first item in the top nav; `/` stays Checkout.
- Cards: today's revenue, today's profit, today's sales count, low-stock product count, total stock value (stock x cost).
- Bar chart: revenue per day, last 14 days (recharts is already installed).
- Reorder list: products at or below the low-stock threshold, each linking to Products.
- Top 5 selling products (by revenue, last 14 days) and 5 most recent sales; tapping a sale opens its invoice.
- Empty state with a hint to "Load demo sales" in Settings.
- Own page title and description; same colors and fonts; mobile-first at 390px.

## Technical details
- pos-store.ts currently has no report helpers (Reports computes inline), so add shared pure helpers in `src/lib/reports.ts`: `salesInRange`, `revenueProfit`, `dailyRevenue(days)`, `topProducts`, `stockValue`, `lowStock`. Reports page is left untouched.
- New `src/lib/category-colors.ts` mapping categories to semantic tokens; add `--cat-1..--cat-6` tokens in `src/styles.css` (no hardcoded colors).
- Edit `ProductCard.tsx`, the category chips in `routes/index.tsx`, `Nav.tsx`; add `routes/dashboard.tsx` reusing `StatCard`, `LowStockBadge`, and `InvoiceView` in a dialog.

## Verification
- Build log clean; Playwright at 390px: tiles render with colors on Checkout; load demo sales, open Dashboard, check cards, chart, reorder list, and that a recent sale opens its invoice.
