export function LowStockBadge({ stock, threshold }: { stock: number; threshold: number }) {
  if (stock > threshold) return null;
  return (
    <span className="rounded bg-warning px-1.5 py-0.5 text-[10px] font-bold uppercase text-warning-foreground">
      {stock <= 0 ? "Out" : "Low"}
    </span>
  );
}
