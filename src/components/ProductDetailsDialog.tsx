import { useMemo, useState } from "react";
import { initialStockOf, type PosState, type Product, type Sale } from "@/lib/pos-store";
import { money, fmtQty } from "@/lib/currency";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InvoiceView } from "@/components/InvoiceView";

export function ProductDetailsDialog({
  product,
  state,
  onOpenChange,
}: {
  product: Product | null;
  state: PosState;
  onOpenChange: (o: boolean) => void;
}) {
  const [invoice, setInvoice] = useState<Sale | null>(null);
  const m = (n: number) => money(n, state.settings.currency);

  const stats = useMemo(() => {
    if (!product) return null;
    let qty = 0, revenue = 0, cost = 0;
    const byUnit = new Map<string, number>();
    const rows: { sale: Sale; qty: number; unit: string; total: number }[] = [];
    for (const sale of state.sales) {
      for (const it of sale.items) {
        if (it.productId !== product.id) continue;
        qty += it.qtyInBaseUnits;
        revenue += it.lineTotal;
        cost += Math.round(it.unitCost * it.qtyInBaseUnits);
        byUnit.set(it.unit, (byUnit.get(it.unit) ?? 0) + it.qty);
        rows.push({ sale, qty: it.qty, unit: it.unit, total: it.lineTotal });
      }
    }
    rows.sort((a, b) => b.sale.timestamp - a.sale.timestamp);
    return { qty, revenue, profit: revenue - cost, byUnit: [...byUnit], rows };
  }, [product, state.sales]);

  if (!product || !stats) return null;
  const low = product.stock <= state.settings.lowStockThreshold;
  const margin = stats.revenue ? Math.round((stats.profit / stats.revenue) * 100) : 0;
  const initial = initialStockOf(product, state.sales);
  const soldPct = initial > 0 ? Math.min(100, Math.round((stats.qty / initial) * 100)) : 0;
  const stat = (label: string, value: string) => (
    <div className="rounded-md border border-border bg-muted/40 p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="num font-semibold">{value}</div>
    </div>
  );

  return (
    <>
      <Dialog open={!!product} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
            <p className="text-xs text-muted-foreground">
              {product.sku} · {product.category}
              {product.packName && ` · ${product.packName} of ${product.packSize} ${product.baseUnit}`}
            </p>
          </DialogHeader>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Stock</h3>
            <div className="grid grid-cols-2 gap-2">
              {stat("In stock", `${fmtQty(product.stock)} ${product.baseUnit}`)}
              {stat("Status", low ? "Low stock" : "OK")}
              {stat("Stock value (cost)", m(Math.round(product.stock * product.costPrice)))}
              {product.packSize
                ? stat(`Full ${product.packName}s`, String(Math.floor(product.stock / product.packSize)))
                : stat("Low-stock alert at", `${state.settings.lowStockThreshold} ${product.baseUnit}`)}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Sales performance</h3>
            <div className="grid grid-cols-2 gap-2">
              {stat("Total sold", `${fmtQty(stats.qty)} ${product.baseUnit}`)}
              {stat("Times sold", String(stats.rows.length))}
              {stat("Revenue", m(stats.revenue))}
              {stat("Profit", `${m(stats.profit)} (${margin}%)`)}
            </div>
            {stats.byUnit.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Sold as: {stats.byUnit.map(([u, q]) => `${fmtQty(q)} × ${u}`).join(", ")}
              </p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Sales history</h3>
            {stats.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border text-sm">
                {stats.rows.slice(0, 50).map((r, i) => (
                  <li key={r.sale.id + i}>
                    <button
                      className="flex w-full items-center justify-between gap-2 p-2 text-left hover:bg-muted"
                      onClick={() => setInvoice(r.sale)}
                    >
                      <span>
                        <span className="font-medium">{r.sale.invoiceNo}</span>
                        <span className="block text-xs text-muted-foreground">
                          {new Date(r.sale.timestamp).toLocaleString()}
                          {r.sale.customerName && ` · ${r.sale.customerName}`}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="num block font-medium">{m(r.total)}</span>
                        <span className="text-xs text-muted-foreground">{fmtQty(r.qty)} × {r.unit}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </DialogContent>
      </Dialog>

      <Dialog open={!!invoice} onOpenChange={(o) => !o && setInvoice(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Invoice</DialogTitle></DialogHeader>
          {invoice && <InvoiceView sale={invoice} settings={state.settings} />}
          <Button className="no-print" onClick={() => window.print()}>Print</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
