import type { Sale, Settings } from "@/lib/pos-store";
import { money, fmtQty } from "@/lib/currency";

export function InvoiceView({ sale, settings }: { sale: Sale; settings: Settings }) {
  const m = (n: number) => money(n, settings.currency);
  return (
    <div className="print-area mx-auto max-w-xl rounded-lg border border-border bg-card p-5 text-sm text-card-foreground">
      <div className="text-center">
        <h2 className="text-lg font-bold">{settings.storeName}</h2>
        <p className="text-xs text-muted-foreground">{settings.address}</p>
      </div>
      <div className="mt-4 flex justify-between text-xs">
        <div>
          <div className="num font-semibold">{sale.invoiceNo}</div>
          <div>{new Date(sale.timestamp).toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div>Customer: {sale.customerName || "Walk-in"}</div>
          <div className="capitalize">Price: {sale.priceTier}</div>
        </div>
      </div>
      <table className="mt-4 w-full text-xs">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-1">Item</th>
            <th className="py-1 text-right">Qty</th>
            <th className="py-1 text-right">Price</th>
            <th className="py-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((i, k) => (
            <tr key={k} className="border-b border-border/50">
              <td className="py-1">{i.name}</td>
              <td className="num py-1 text-right">
                {fmtQty(i.qty)} {i.unit}
              </td>
              <td className="num py-1 text-right">{m(i.unitPrice)}</td>
              <td className="num py-1 text-right">{m(i.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="num mt-3 ml-auto w-56 space-y-0.5 text-xs">
        <Row l="Subtotal" v={m(sale.subtotal)} />
        {sale.discount > 0 && <Row l="Discount" v={`- ${m(sale.discount)}`} />}
        {sale.tax > 0 && <Row l="Tax" v={m(sale.tax)} />}
        <div className="flex justify-between border-t border-border pt-1 text-sm font-bold">
          <span>Total</span>
          <span>{m(sale.total)}</span>
        </div>
        <Row l="Payment" v={sale.paymentMethod.toUpperCase()} />
        {sale.tendered != null && <Row l="Tendered" v={m(sale.tendered)} />}
        {sale.change != null && <Row l="Change" v={m(sale.change)} />}
      </div>
      <p className="mt-5 text-center text-xs text-muted-foreground">Thank you for your business!</p>
    </div>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span>{l}</span>
      <span>{v}</span>
    </div>
  );
}
