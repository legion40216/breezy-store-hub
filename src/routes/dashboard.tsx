import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePos, type Sale } from "@/lib/pos-store";
import { money, fmtQty } from "@/lib/currency";
import { dailyRevenue, lowStock, revenueProfit, salesInRange, startOfDay, stockValue, topProducts } from "@/lib/reports";
import { StatCard } from "@/components/StatCard";
import { LowStockBadge } from "@/components/LowStockBadge";
import { InvoiceView } from "@/components/InvoiceView";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Owner Dashboard — Wholesale POS" },
      { name: "description", content: "Today's revenue, profit, stock value, reorder alerts and top sellers at a glance." },
      { property: "og:title", content: "Owner Dashboard — Wholesale POS" },
      { property: "og:description", content: "Today's revenue, profit, stock value, reorder alerts and top sellers at a glance." },
    ],
  }),
  component: Dashboard,
});

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-3">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Dashboard() {
  const pos = usePos();
  const [open, setOpen] = useState<Sale | null>(null);
  const data = useMemo(() => {
    if (!pos) return null;
    const today = revenueProfit(salesInRange(pos.sales, startOfDay(Date.now())));
    const last14 = salesInRange(pos.sales, startOfDay(Date.now()) - 13 * 86400000);
    return {
      today,
      low: lowStock(pos.products, pos.settings.lowStockThreshold),
      value: stockValue(pos.products),
      daily: dailyRevenue(pos.sales, 14),
      top: topProducts(last14, 5),
      recent: [...pos.sales].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5),
    };
  }, [pos]);

  if (!pos || !data) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  const m = (n: number) => money(n, pos.settings.currency);

  return (
    <div className="mx-auto max-w-7xl space-y-3 p-3">
      <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <StatCard label="Today revenue" value={m(data.today.revenue)} />
        <StatCard label="Today profit" value={m(data.today.profit)} />
        <StatCard label="Sales today" value={String(data.today.count)} />
        <StatCard label="Low stock" value={String(data.low.length)} sub="products" />
        <div className="col-span-2 md:col-span-1">
          <StatCard label="Stock value" value={m(data.value)} sub="at cost" />
        </div>
      </div>

      {pos.sales.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          No sales yet. Ring one up on Checkout, or press "Load demo sales" in{" "}
          <Link to="/settings" className="font-semibold text-primary underline">Settings</Link>.
        </p>
      )}

      <Card title="Revenue — last 14 days">
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.daily} margin={{ left: -16, right: 4, top: 4 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => m(v * 100)} />
              <Bar dataKey="revenue" fill="var(--primary)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <Card title="Reorder now">
          {data.low.length === 0 ? (
            <p className="text-sm text-muted-foreground">All stocked up.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.low.map((p) => (
                <li key={p.id}>
                  <Link to="/products" className="flex min-h-11 items-center justify-between gap-2 py-1.5 text-sm">
                    <span className="truncate">{p.name}</span>
                    <span className="flex items-center gap-2">
                      <span className="num text-xs">{fmtQty(p.stock)} {p.baseUnit}</span>
                      <LowStockBadge stock={p.stock} threshold={pos.settings.lowStockThreshold} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Top sellers (14 days)">
          {data.top.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            <ol className="divide-y divide-border">
              {data.top.map((t, i) => (
                <li key={t.name} className="flex min-h-11 items-center justify-between gap-2 py-1.5 text-sm">
                  <span className="truncate"><span className="num mr-2 text-muted-foreground">{i + 1}</span>{t.name}</span>
                  <span className="num font-semibold">{m(t.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="Recent sales">
          {data.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.recent.map((s) => (
                <li key={s.id}>
                  <button onClick={() => setOpen(s)} className="flex min-h-11 w-full items-center justify-between gap-2 py-1.5 text-left text-sm">
                    <span>
                      <span className="num font-semibold">{s.invoiceNo}</span>
                      <span className="block text-xs text-muted-foreground">
                        {new Date(s.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" })} · {s.customerName || "Walk-in"}
                      </span>
                    </span>
                    <span className="num font-semibold">{m(s.total)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice</DialogTitle>
          </DialogHeader>
          {open && <InvoiceView sale={open} settings={pos.settings} />}
          <Button className="no-print" onClick={() => window.print()}>Print</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
