import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartLine, PriceTier, Product } from "@/lib/pos-store";
import { lineInfo } from "@/lib/pos-store";
import { money, fmtQty } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  lines: CartLine[];
  products: Product[];
  tier: PriceTier;
  currency: string;
  customer: string;
  setCustomer: (v: string) => void;
  discountType: "percent" | "fixed";
  setDiscountType: (v: "percent" | "fixed") => void;
  discountValue: number;
  setDiscountValue: (v: number) => void;
  totals: { subtotal: number; discount: number; tax: number; total: number };
  taxRate: number;
  updateLine: (i: number, patch: Partial<CartLine>) => void;
  removeLine: (i: number) => void;
  onCheckout: () => void;
  error?: string;
}

export function CartPanel(p: Props) {
  const m = (n: number) => money(n, p.currency);
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {p.lines.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Tap a product to add it.</p>
        )}
        {p.lines.map((line, i) => {
          const prod = p.products.find((x) => x.id === line.productId);
          if (!prod) return null;
          const li = lineInfo(prod, line, p.tier);
          const step = prod.baseUnit === "kg" && !line.usePack ? 0.5 : 1;
          return (
            <div key={i} className="rounded-md border border-border bg-card p-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold leading-tight">{prod.name}</div>
                  <div className="num text-xs text-muted-foreground">
                    {m(li.unitPrice)} / {li.unit}
                  </div>
                </div>
                <button aria-label="Remove" onClick={() => p.removeLine(i)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {prod.packName && (
                  <select
                    className="h-8 rounded-md border border-input bg-background px-1 text-xs"
                    value={line.usePack ? "pack" : "base"}
                    onChange={(e) => p.updateLine(i, { usePack: e.target.value === "pack", qty: 1 })}
                  >
                    <option value="base">{prod.baseUnit}</option>
                    <option value="pack">
                      {prod.packName} ({prod.packSize})
                    </option>
                  </select>
                )}
                <div className="flex items-center">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => p.updateLine(i, { qty: Math.max(step, line.qty - step) })}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <input
                    aria-label="Quantity"
                    type="number"
                    inputMode="decimal"
                    step={prod.baseUnit === "kg" && !line.usePack ? "0.001" : "1"}
                    min={0}
                    value={fmtQty(line.qty)}
                    onChange={(e) => {
                      let v = parseFloat(e.target.value) || 0;
                      if (!(prod.baseUnit === "kg" && !line.usePack)) v = Math.floor(v);
                      p.updateLine(i, { qty: Math.max(0, v) });
                    }}
                    className="num h-8 w-16 border-y border-input bg-background text-center text-sm"
                  />
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => p.updateLine(i, { qty: line.qty + step })}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="num ml-auto text-sm font-semibold">{m(li.lineTotal)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="space-y-2 border-t border-border bg-card p-3">
        <Input placeholder="Customer name (optional)" value={p.customer} onChange={(e) => p.setCustomer(e.target.value)} />
        <div className="flex gap-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={p.discountType}
            onChange={(e) => p.setDiscountType(e.target.value as "percent" | "fixed")}
          >
            <option value="percent">Discount %</option>
            <option value="fixed">Discount {p.currency}</option>
          </select>
          <Input
            type="number"
            min={0}
            inputMode="decimal"
            value={p.discountValue || ""}
            placeholder="0"
            onChange={(e) => p.setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
          />
        </div>
        <div className="num space-y-0.5 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{m(p.totals.subtotal)}</span></div>
          {p.totals.discount > 0 && <div className="flex justify-between text-muted-foreground"><span>Discount</span><span>- {m(p.totals.discount)}</span></div>}
          {p.taxRate > 0 && <div className="flex justify-between text-muted-foreground"><span>Tax ({p.taxRate}%)</span><span>{m(p.totals.tax)}</span></div>}
          <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{m(p.totals.total)}</span></div>
        </div>
        {p.error && <p className="text-xs font-medium text-destructive">{p.error}</p>}
        <Button className="h-12 w-full text-base" disabled={p.lines.length === 0 || !!p.error} onClick={p.onCheckout}>
          Complete sale
        </Button>
      </div>
    </div>
  );
}
