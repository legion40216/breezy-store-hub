import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, Printer, ShoppingCart } from "lucide-react";
import {
  type CartLine,
  type PaymentMethod,
  type PriceTier,
  type Sale,
  computeTotals,
  lineInfo,
  recordSale,
  usePos,
} from "@/lib/pos-store";
import { money, fmtQty } from "@/lib/currency";
import { ProductCard } from "@/components/ProductCard";
import { CartPanel } from "@/components/CartPanel";
import { InvoiceView } from "@/components/InvoiceView";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Checkout — Wholesale POS Demo" },
      { name: "description", content: "Fast retail and wholesale checkout with packs, discounts, tax and printable invoices." },
      { property: "og:title", content: "Checkout — Wholesale POS Demo" },
      { property: "og:description", content: "Fast retail and wholesale checkout with packs, discounts, tax and printable invoices." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const s = usePos();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [tier, setTier] = useState<PriceTier>("retail");
  const [lines, setLines] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState(0);
  const [payOpen, setPayOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [tendered, setTendered] = useState("");
  const [done, setDone] = useState<Sale | null>(null);

  const products = s?.products ?? [];
  const settings = s?.settings;
  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const filtered = products.filter(
    (p) =>
      (cat === "All" || p.category === cat) &&
      (p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())),
  );

  const subtotal = lines.reduce((a, l) => {
    const p = products.find((x) => x.id === l.productId);
    return p ? a + lineInfo(p, l, tier).lineTotal : a;
  }, 0);
  const t = computeTotals(subtotal, discountType, discountValue, settings?.taxRate ?? 0);
  const totals = { subtotal, ...t };

  // stock check
  const stockError = useMemo(() => {
    const need = new Map<string, number>();
    for (const l of lines) {
      const p = products.find((x) => x.id === l.productId);
      if (!p) continue;
      need.set(p.id, (need.get(p.id) ?? 0) + lineInfo(p, l, tier).qtyInBaseUnits);
    }
    for (const [id, n] of need) {
      const p = products.find((x) => x.id === id)!;
      if (n > p.stock + 1e-9) return `Only ${fmtQty(p.stock)} ${p.baseUnit} of ${p.name} in stock.`;
    }
    if (lines.some((l) => l.qty <= 0)) return "Remove items with zero quantity.";
    return "";
  }, [lines, products, tier]);

  if (!s || !settings) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  const m = (n: number) => money(n, settings.currency);

  const add = (id: string) => {
    setLines((ls) => {
      const i = ls.findIndex((l) => l.productId === id && !l.usePack);
      if (i >= 0) return ls.map((l, k) => (k === i ? { ...l, qty: l.qty + 1 } : l));
      return [...ls, { productId: id, usePack: false, qty: 1 }];
    });
  };

  const tenderedPaisa = Math.round((parseFloat(tendered) || 0) * 100);
  const change = tenderedPaisa - totals.total;

  const complete = () => {
    const items = lines.map((l) => {
      const p = products.find((x) => x.id === l.productId)!;
      return { productId: p.id, name: p.name, qty: l.qty, ...lineInfo(p, l, tier) };
    });
    const sale = recordSale({
      timestamp: Date.now(),
      customerName: customer.trim() || undefined,
      priceTier: tier,
      items,
      subtotal,
      ...t,
      paymentMethod: method,
      amountPaid: totals.total,
      tendered: method === "cash" ? tenderedPaisa : undefined,
      change: method === "cash" ? change : undefined,
    });
    setDone(sale);
    setPayOpen(false);
    setCartOpen(false);
    setLines([]);
    setCustomer("");
    setDiscountValue(0);
    setTendered("");
  };

  const cart = (
    <CartPanel
      lines={lines}
      products={products}
      tier={tier}
      currency={settings.currency}
      customer={customer}
      setCustomer={setCustomer}
      discountType={discountType}
      setDiscountType={setDiscountType}
      discountValue={discountValue}
      setDiscountValue={setDiscountValue}
      totals={totals}
      taxRate={settings.taxRate}
      updateLine={(i, patch) => setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)))}
      removeLine={(i) => setLines((ls) => ls.filter((_, k) => k !== i))}
      onCheckout={() => {
        setMethod("cash");
        setTendered("");
        setPayOpen(true);
      }}
      error={stockError}
    />
  );

  return (
    <div className="mx-auto flex max-w-7xl gap-4 md:h-[calc(100vh-57px)] md:p-4">
      <h1 className="sr-only">Checkout</h1>
      <section className="flex-1 overflow-y-auto p-3 pb-28 md:p-0 md:pb-0">
        <div className="sticky top-0 z-10 space-y-2 bg-background pb-3">
          <div className="flex gap-2">
            <Input placeholder="Search name or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="flex shrink-0 rounded-md border border-border bg-card p-0.5">
              {(["retail", "wholesale"] as const).map((x) => (
                <button
                  key={x}
                  onClick={() => setTier(x)}
                  className={`rounded px-3 text-xs font-semibold capitalize ${tier === x ? "bg-ink text-ink-foreground" : "text-muted-foreground"}`}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} p={p} tier={tier} currency={settings.currency} threshold={settings.lowStockThreshold} onAdd={() => add(p.id)} />
          ))}
        </div>
        {filtered.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No products found.</p>}
      </section>

      <aside className="hidden w-96 shrink-0 overflow-hidden rounded-lg border border-border bg-muted md:block">{cart}</aside>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card p-3 md:hidden">
        <Button className="h-12 w-full justify-between text-base" onClick={() => setCartOpen(true)}>
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Cart ({lines.length})
          </span>
          <span className="num">{m(totals.total)}</span>
        </Button>
      </div>
      <Drawer open={cartOpen} onOpenChange={setCartOpen}>
        <DrawerContent className="h-[88vh]">
          <DrawerHeader className="py-2">
            <DrawerTitle className="capitalize">Cart · {tier}</DrawerTitle>
          </DrawerHeader>
          <div className="min-h-0 flex-1">{cart}</div>
        </DrawerContent>
      </Drawer>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment</DialogTitle>
          </DialogHeader>
          <div className="num text-center text-3xl font-bold">{m(totals.total)}</div>
          <div className="grid grid-cols-2 gap-2">
            {(["cash", "card"] as const).map((x) => (
              <Button key={x} variant={method === x ? "default" : "outline"} onClick={() => setMethod(x)} className="capitalize">
                {x}
              </Button>
            ))}
          </div>
          {method === "cash" && (
            <div className="space-y-2">
              <Input autoFocus type="number" inputMode="decimal" placeholder="Amount tendered" value={tendered} onChange={(e) => setTendered(e.target.value)} />
              <div className={`num flex justify-between text-lg font-semibold ${change < 0 ? "text-destructive" : "text-success"}`}>
                <span>{change < 0 ? "Remaining" : "Change due"}</span>
                <span>{m(Math.abs(change))}</span>
              </div>
            </div>
          )}
          <Button className="h-12 text-base" disabled={method === "cash" && change < 0} onClick={complete}>
            Confirm {method} payment
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!done} onOpenChange={(o) => !o && setDone(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto">
          <DialogHeader className="no-print">
            <DialogTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" /> Sale completed
            </DialogTitle>
          </DialogHeader>
          {done && <InvoiceView sale={done} settings={settings} />}
          <div className="no-print grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setDone(null)}>New sale</Button>
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
