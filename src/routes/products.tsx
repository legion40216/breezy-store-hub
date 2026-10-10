import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { type Product, deleteProduct, usePos } from "@/lib/pos-store";
import { money, fmtQty } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LowStockBadge } from "@/components/LowStockBadge";
import { ProductFormDialog } from "@/components/ProductFormDialog";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products & Inventory — Wholesale POS Demo" },
      { name: "description", content: "Manage products, pack sizes, retail and wholesale prices, costs and stock levels." },
      { property: "og:title", content: "Products & Inventory — Wholesale POS Demo" },
      { property: "og:description", content: "Manage products, pack sizes, retail and wholesale prices, costs and stock levels." },
    ],
  }),
  component: Products,
});

function Products() {
  const s = usePos();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | undefined>();
  if (!s) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  const { currency, lowStockThreshold } = s.settings;
  const m = (n: number) => money(n, currency);
  const list = s.products.filter((p) => (p.name + p.sku + p.category).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto max-w-7xl space-y-3 p-3 md:p-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Products</h1>
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Add product
        </Button>
      </div>
      <Input placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-2">Name</th><th className="p-2">SKU</th><th className="p-2">Category</th>
              <th className="p-2 text-right">Retail</th><th className="p-2 text-right">Wholesale</th>
              <th className="p-2 text-right">Cost</th><th className="p-2 text-right">Stock</th><th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} onClick={() => setViewing(p)} className={`cursor-pointer border-t border-border hover:bg-muted/60 ${p.stock <= lowStockThreshold ? "bg-warning/15" : ""}`}>
                <td className="p-2 font-medium">
                  <span className="text-primary underline-offset-2 hover:underline">{p.name}</span>
                  {p.packName && <div className="text-xs text-muted-foreground">{p.packName} of {p.packSize}</div>}
                </td>
                <td className="p-2 text-muted-foreground">{p.sku}</td>
                <td className="p-2">{p.category}</td>
                <td className="num p-2 text-right">{m(p.retailPrice)}</td>
                <td className="num p-2 text-right">{m(p.wholesalePrice)}</td>
                <td className="num p-2 text-right">{m(p.costPrice)}</td>
                <td className="p-2 text-right">
                  <span className="inline-flex items-center gap-1">
                    <LowStockBadge stock={p.stock} threshold={lowStockThreshold} />
                    <span className="num">{fmtQty(p.stock)}</span> {p.baseUnit}
                  </span>
                </td>
                <td className="p-2 text-right whitespace-nowrap">
                  <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => { setEditing(p); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => confirm(`Delete ${p.name}?`) && deleteProduct(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ProductFormDialog open={open} onOpenChange={setOpen} product={editing} />
    </div>
  );
}
