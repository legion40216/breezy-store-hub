import type { PriceTier, Product } from "@/lib/pos-store";
import { money, fmtQty } from "@/lib/currency";
import { catColor, initials } from "@/lib/category-colors";
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
  const c = catColor(p.category);
  return (
    <button
      onClick={onAdd}
      disabled={out}
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition hover:border-primary active:scale-[0.98] disabled:opacity-50"
    >
      <div className={`relative flex h-16 w-full items-center justify-center ${c.bg} text-cat-foreground`}>
        <span className="text-2xl font-extrabold tracking-tight">{initials(p.name)}</span>
        <span className="absolute left-2 top-1.5 text-[10px] font-semibold uppercase opacity-90">{p.category}</span>
        <span className="absolute right-1.5 top-1.5">
          <LowStockBadge stock={p.stock} threshold={threshold} />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-sm font-semibold leading-tight">{p.name}</span>
        <span className="text-xs text-muted-foreground">{p.sku}</span>
        <span className="num mt-auto text-base font-semibold text-primary">
          {money(price, currency)}
          <span className="text-xs font-normal text-muted-foreground">/{p.baseUnit}</span>
        </span>
        <span className="text-xs text-muted-foreground">
          Stock: <span className="num">{fmtQty(p.stock)}</span> {p.baseUnit}
          {p.packName && ` · ${p.packName} of ${p.packSize}`}
        </span>
      </div>
    </button>
  );
}
