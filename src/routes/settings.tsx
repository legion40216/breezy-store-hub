import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { type Settings, loadDemoSales, resetDemo, saveSettings, usePos } from "@/lib/pos-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Store Settings — Wholesale POS Demo" },
      { name: "description", content: "Set store name, address, currency, tax rate and low-stock alerts; load or reset demo data." },
      { property: "og:title", content: "Store Settings — Wholesale POS Demo" },
      { property: "og:description", content: "Set store name, address, currency, tax rate and low-stock alerts; load or reset demo data." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const s = usePos();
  if (!s) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  const st = s.settings;
  const set = (patch: Partial<Settings>) => saveSettings({ ...st, ...patch });

  return (
    <div className="mx-auto max-w-xl space-y-5 p-3 md:p-4">
      <h1 className="text-xl font-bold">Settings</h1>
      <section className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="space-y-1"><Label htmlFor="sn">Store name</Label><Input id="sn" value={st.storeName} onChange={(e) => set({ storeName: e.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="ad">Address</Label><Input id="ad" value={st.address} onChange={(e) => set({ address: e.target.value })} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1"><Label htmlFor="cu">Currency</Label><Input id="cu" value={st.currency} onChange={(e) => set({ currency: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="tx">Tax %</Label><Input id="tx" type="number" min={0} value={st.taxRate} onChange={(e) => set({ taxRate: Math.max(0, parseFloat(e.target.value) || 0) })} /></div>
          <div className="space-y-1"><Label htmlFor="ls">Low stock at</Label><Input id="ls" type="number" min={0} value={st.lowStockThreshold} onChange={(e) => set({ lowStockThreshold: Math.max(0, parseFloat(e.target.value) || 0) })} /></div>
        </div>
        <p className="text-xs text-muted-foreground">Changes save automatically.</p>
      </section>
      <section className="space-y-3 rounded-lg border border-border bg-card p-4">
        <h2 className="font-semibold">Demo data</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => { loadDemoSales(); toast.success("Loaded 2 weeks of demo sales"); }}>Load demo sales</Button>
          <Button variant="destructive" onClick={() => { if (confirm("Reset all products, sales and settings?")) { resetDemo(); toast.success("Demo reset"); } }}>Reset demo</Button>
        </div>
      </section>
    </div>
  );
}
