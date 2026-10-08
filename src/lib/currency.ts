export function money(paisa: number, symbol = "Rs") {
  const v = (paisa / 100).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${symbol} ${v}`;
}

export const fmtQty = (n: number) => String(Math.round(n * 1000) / 1000);
