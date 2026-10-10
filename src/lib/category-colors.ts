const PALETTE = [
  { bg: "bg-cat-1", text: "text-cat-1" },
  { bg: "bg-cat-2", text: "text-cat-2" },
  { bg: "bg-cat-3", text: "text-cat-3" },
  { bg: "bg-cat-4", text: "text-cat-4" },
  { bg: "bg-cat-5", text: "text-cat-5" },
  { bg: "bg-cat-6", text: "text-cat-6" },
] as const;

const FIXED: Record<string, number> = { Grocery: 0, Beverages: 1, Household: 2, "Personal Care": 3 };

export function catColor(category: string) {
  let i = FIXED[category];
  if (i === undefined) {
    let h = 0;
    for (const ch of category) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    i = h % PALETTE.length;
  }
  return PALETTE[i]!;
}

export function initials(name: string) {
  const w = name.replace(/[^A-Za-z ]/g, " ").split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] ?? "") + (w[1]?.[0] ?? w[0]?.[1] ?? "")).toUpperCase();
}
