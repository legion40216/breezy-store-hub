import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { type Sale, usePos } from "@/lib/pos-store";
import { money } from "@/lib/currency";
import { StatCard } from "@/components/StatCard";
import { InvoiceView } from "@/components/InvoiceView";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Sales Reports — Wholesale POS Demo" },
      { name: "description", content: "Revenue, profit, payment split, top products and recent invoices at a glance." },
      { property: "og:title", content: "Sales Reports — Wholesale POS Demo" },
      { property: "og:description", content: "Revenue, profit, payment split, top products and recent invoices at a glance." },
    ],
  }),
  component: Reports,
});

function summarize(sales: Sale[]) {
  const revenue = sales.reduce((a, x) => a + x.total, 0);
  const cost = sales.reduce((a, x) => a + x.items.reduce((b, i) => b + Math.round(i.unitCost * i.qty), 0), 0);
  const net = sales.reduce((a, x) => a + x.total - x.tax, 0);
  return { revenue, profit: net - cost, count: sales.length, avg: sales.length ? Math.round(revenue / sales.length) : 0 };
}

function Reports() {
  const s = usePos();
  const [open, setOpen] = useState<Sale | null>(null);
  const data = useMemo(() => {
    if (!s) return null;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const today = s.sales.filter((x) => x.timestamp >= start.getTime());
    const week = s.sales.filter((x) => x.timestamp >= start.getTime() - 6 * 86400000);
    const cash = s.sales.filter((x) => x.paymentMethod === "cash").reduce((a, x) => a + x.total, 0);
    const card = s.sales.filter((x) => x.paymentMethod === "card").reduce((a, x) => a + x.total, 0);
    const top = new Map<string, { name: string; revenue: number; qty: number }>();
    for (const sale of s.sales) for (const i of sale.items) {
      const t = top.get(i.productId) ?? { name: i.name, revenue: 0, qty: 0 };
      t.revenue += i.lineTotal; t.qty += i.qtyInBaseUnits; top.set(i.productId, t);
    }
    return {
      periods: [["Today", summarize(today)], ["Last 7 days", summarize(week)], ["All time", summarize(s.sales)]] as const,
      cash, card,
      top: [...top.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      recent: [...s.sales].reverse().slice(0, 30),
    };
  }, [s]);
  if (!s || !data) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  const m = (n: number) => money(n, s.settings.currency);
  const payTotal = data.cash + data.card || 1;

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-3 md:p-4">
      <h1 className="text-xl font-bold">Reports</h1>
      {data.periods.map(([label, d]) => (
        <section key={label}>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{label}</h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <StatCard label="Revenue" value={m(d.revenue)} />
            <StatCard label="Profit" value={m(d.profit)} />
            <StatCard label="Sales" value={String(d.count)} />
            <StatCard label="Avg sale" value={m(d.avg)} />
          </div>
        </section>
      ))}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-3">
          <h2 className="mb-3 font-semibold">Payment methods</h2>
          {([["Cash", data.cash, "bg-success"], ["Card", data.card, "bg-primary"]] as const).map(([l, v, c]) => (
            <div key={l} className="mb-2">
              <div className="num flex justify-between text-sm"><span>{l}</span><span>{m(v)}</span></div>
              <div className="h-2 rounded bg-muted"><div className={`h-2 rounded ${c}`} style={{ width: `${(v / payTotal) * 100}%` }} /></div>
            </div>
          ))}
        </section>
        <section className="rounded-lg border border-border bg-card p-3">
          <h2 className="mb-3 font-semibold">Top products</h2>
          {data.top.length === 0 && <p className="text-sm text-muted-foreground">No sales yet.</p>}
          <ol className="space-y-1 text-sm">
            {data.top.map((t, i) => (
              <li key={i} className="flex justify-between"><span>{i + 1}. {t.name}</span><span className="num">{m(t.revenue)}</span></li>
            ))}
          </ol>
        </section>
      </div>
      <section className="rounded-lg border border-border bg-card">
        <h2 className="p-3 font-semibold">Recent sales</h2>
        {data.recent.length === 0 && <p className="px-3 pb-3 text-sm text-muted-foreground">No sales yet. Load demo sales from Settings.</p>}
        <ul>
          {data.recent.map((x) => (
            <li key={x.id}>
              <button onClick={() => setOpen(x)} className="flex w-full items-center justify-between gap-2 border-t border-border p-3 text-left text-sm hover:bg-muted">
                <div>
                  <div className="num font-semibold">{x.invoiceNo}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(x.timestamp).toLocaleString()} · {x.customerName || "Walk-in"} · {x.items.length} items
                  </div>
                </div>
                <div className="text-right">
                  <div className="num font-semibold">{m(x.total)}</div>
                  <div className="text-xs uppercase text-muted-foreground">{x.paymentMethod}</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto">
          <DialogHeader className="no-print"><DialogTitle>Invoice</DialogTitle></DialogHeader>
          {open && <InvoiceView sale={open} settings={s.settings} />}
          <Button className="no-print" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print invoice</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
