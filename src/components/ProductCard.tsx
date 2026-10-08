import type { PriceTier, Product } from "@/lib/pos-store";
import { money, fmtQty } from "@/lib/currency";
import { LowStockBadge } from "./LowStockBadge";

export function ProductCard({
  p,
  tier,
  currency,
  threshold,
  onAdd,
}: {
  p: Product;
  tier: PriceTier;
  currency: string;
  threshold: number;
  onAdd: () => void;
}) {
  const price = tier === "wholesale" ? p.wholesalePrice : p.retailPrice;
  const out = p.stock <= 0;
  return (
    <button
      onClick={onAdd}
      disabled={out}
      className="flex flex-col items-start gap-1 rounded-lg border border-border bg-card p-3 text-left transition hover:border-primary active:scale-[0.98] disabled:opacity-50"
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span className="text-sm font-semibold leading-tight">{p.name}</span>
        <LowStockBadge stock={p.stock} threshold={threshold} />
      </div>
      <span className="text-xs text-muted-foreground">{p.sku}</span>
      <span className="num mt-auto text-base font-semibold text-primary">
        {money(price, currency)}
        <span className="text-xs font-normal text-muted-foreground">/{p.baseUnit}</span>
      </span>
      <span className="text-xs text-muted-foreground">
        Stock: <span className="num">{fmtQty(p.stock)}</span> {p.baseUnit}
        {p.packName && ` · ${p.packName} of ${p.packSize}`}
      </span>
    </button>
  );
}
