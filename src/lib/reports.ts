import type { Product, Sale } from "./pos-store";

export const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const salesInRange = (sales: Sale[], from: number, to = Infinity) =>
  sales.filter((s) => s.timestamp >= from && s.timestamp < to);

export function revenueProfit(sales: Sale[]) {
  let revenue = 0;
  let cost = 0;
  for (const s of sales) {
    revenue += s.total - s.tax;
    for (const i of s.items) cost += Math.round(i.unitCost * i.qty);
  }
  return { revenue, profit: revenue - cost, count: sales.length };
}

export function dailyRevenue(sales: Sale[], days: number) {
  const today = startOfDay(Date.now());
  return Array.from({ length: days }, (_, k) => {
    const from = today - (days - 1 - k) * 86400000;
    const d = new Date(from);
    const rev = salesInRange(sales, from, from + 86400000).reduce((a, s) => a + s.total, 0);
    return { label: `${d.getDate()}/${d.getMonth() + 1}`, revenue: rev / 100 };
  });
}

export function topProducts(sales: Sale[], n: number) {
  const map = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const s of sales)
    for (const i of s.items) {
      const e = map.get(i.productId) ?? { name: i.name, qty: 0, revenue: 0 };
      e.qty += i.qtyInBaseUnits;
      e.revenue += i.lineTotal;
      map.set(i.productId, e);
    }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, n);
}

export const stockValue = (products: Product[]) =>
  products.reduce((a, p) => a + Math.max(0, p.stock) * p.costPrice, 0);

export const lowStock = (products: Product[], threshold: number) =>
  products.filter((p) => p.stock <= threshold).sort((a, b) => a.stock - b.stock);
