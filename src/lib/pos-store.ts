import { useEffect, useState } from "react";

export type BaseUnit = "pcs" | "kg";
export type PriceTier = "retail" | "wholesale";
export type PaymentMethod = "cash" | "card";

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  baseUnit: BaseUnit;
  packName?: string | undefined;
  packSize?: number | undefined;
  retailPrice: number; // paisa per base unit
  wholesalePrice: number;
  costPrice: number;
  stock: number; // base units
  initialStock?: number; // base units at first entry; falls back to stock + sold
}

export interface SaleItem {
  productId: string;
  name: string;
  unit: string; // e.g. "pcs", "kg", "carton (12)"
  qty: number;
  qtyInBaseUnits: number;
  unitPrice: number;
  unitCost: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  timestamp: number;
  customerName?: string | undefined;
  priceTier: PriceTier;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  tendered?: number | undefined;
  change?: number | undefined;
  status: "completed";
}

export interface Settings {
  storeName: string;
  address: string;
  currency: string;
  taxRate: number;
  lowStockThreshold: number;
}

export interface PosState {
  version: number;
  products: Product[];
  sales: Sale[];
  settings: Settings;
  nextInvoice: number;
}

const KEY = "pos-demo";
const VERSION = 1;

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function seedProducts(): Product[] {
  const p = (
    name: string,
    sku: string,
    category: string,
    baseUnit: BaseUnit,
    retail: number,
    wholesale: number,
    cost: number,
    stock: number,
    packName?: string,
    packSize?: number,
  ): Product => ({
    id: uid(),
    name,
    sku,
    category,
    baseUnit,
    retailPrice: retail * 100,
    wholesalePrice: wholesale * 100,
    costPrice: cost * 100,
    stock,
    initialStock: stock,
    packName,
    packSize,
  });
  return [
    p("Basmati Rice", "GR-001", "Grocery", "kg", 380, 340, 300, 250),
    p("Sugar", "GR-002", "Grocery", "kg", 160, 145, 130, 400),
    p("Cooking Oil 1L", "GR-003", "Grocery", "pcs", 620, 570, 520, 96, "carton", 12),
    p("Red Lentils", "GR-004", "Grocery", "kg", 320, 290, 250, 3),
    p("Mineral Water 1.5L", "BV-001", "Beverages", "pcs", 100, 80, 65, 144, "carton", 6),
    p("Cola 500ml", "BV-002", "Beverages", "pcs", 120, 100, 85, 240, "carton", 24),
    p("Black Tea 450g", "BV-003", "Beverages", "pcs", 1150, 1050, 950, 40, "carton", 12),
    p("Laundry Detergent 1kg", "HH-001", "Household", "pcs", 650, 590, 520, 60, "carton", 10),
    p("Dish Soap 500ml", "HH-002", "Household", "pcs", 280, 245, 210, 4, "carton", 24),
    p("Toilet Tissue 4-roll", "HH-003", "Household", "pcs", 450, 400, 350, 72, "bundle", 6),
    p("Bath Soap", "PC-001", "Personal Care", "pcs", 140, 120, 100, 288, "carton", 72),
    p("Shampoo 400ml", "PC-002", "Personal Care", "pcs", 850, 770, 680, 36, "carton", 12),
  ];
}

export const defaultSettings = (): Settings => ({
  storeName: "Al-Madina Wholesale Mart",
  address: "Shop 12, Main Bazaar, Lahore",
  currency: "Rs",
  taxRate: 0,
  lowStockThreshold: 5,
});

function freshState(): PosState {
  return { version: VERSION, products: seedProducts(), sales: [], settings: defaultSettings(), nextInvoice: 1 };
}

function migrate(raw: unknown): PosState {
  const s = raw as Partial<PosState> | null;
  if (!s || typeof s !== "object" || !Array.isArray(s.products)) return freshState();
  // future: if (s.version < 2) {...}
  return {
    version: VERSION,
    products: s.products,
    sales: s.sales ?? [],
    settings: { ...defaultSettings(), ...(s.settings ?? {}) },
    nextInvoice: s.nextInvoice ?? (s.sales?.length ?? 0) + 1,
  };
}

let state: PosState | null = null;
const listeners = new Set<() => void>();

function load(): PosState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? migrate(JSON.parse(raw)) : freshState();
  } catch {
    state = freshState();
  }
  localStorage.setItem(KEY, JSON.stringify(state));
  return state;
}

export function setState(fn: (s: PosState) => PosState) {
  state = fn(load());
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

/** Returns null until loaded in the browser (avoids SSR mismatch). */
export function usePos(): PosState | null {
  const [s, setS] = useState<PosState | null>(null);
  useEffect(() => {
    setS(load());
    const l = () => setS(state);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return s;
}

export const formatInvoice = (n: number) => `INV-${String(n).padStart(4, "0")}`;

// ---- Products ----
export function saveProduct(p: Product) {
  setState((s) => {
    const exists = s.products.some((x) => x.id === p.id);
    return { ...s, products: exists ? s.products.map((x) => (x.id === p.id ? p : x)) : [...s.products, p] };
  });
}
export function deleteProduct(id: string) {
  setState((s) => ({ ...s, products: s.products.filter((x) => x.id !== id) }));
}
export function saveSettings(settings: Settings) {
  setState((s) => ({ ...s, settings }));
}

// ---- Cart math ----
export interface CartLine {
  productId: string;
  usePack: boolean;
  qty: number;
}

export function lineInfo(p: Product, line: CartLine, tier: PriceTier) {
  const per = tier === "wholesale" ? p.wholesalePrice : p.retailPrice;
  const mult = line.usePack && p.packSize ? p.packSize : 1;
  const unitPrice = per * mult;
  return {
    unitPrice,
    unitCost: p.costPrice * mult,
    unit: line.usePack && p.packName ? `${p.packName} (${p.packSize})` : p.baseUnit,
    qtyInBaseUnits: line.qty * mult,
    lineTotal: Math.round(unitPrice * line.qty),
  };
}

export function computeTotals(
  subtotal: number,
  discountType: "percent" | "fixed",
  discountValue: number,
  taxRate: number,
) {
  const raw = discountType === "percent" ? Math.round((subtotal * Math.min(100, discountValue)) / 100) : Math.round(discountValue * 100);
  const discount = Math.max(0, Math.min(subtotal, raw));
  const taxable = subtotal - discount;
  const tax = Math.round((taxable * taxRate) / 100);
  return { discount, tax, total: taxable + tax };
}

export function recordSale(input: Omit<Sale, "id" | "invoiceNo" | "status">): Sale {
  let sale!: Sale;
  setState((s) => {
    sale = { ...input, id: uid(), invoiceNo: formatInvoice(s.nextInvoice), status: "completed" };
    const products = s.products.map((p) => {
      const used = input.items.filter((i) => i.productId === p.id).reduce((a, i) => a + i.qtyInBaseUnits, 0);
      return used ? { ...p, stock: Math.round((p.stock - used) * 1000) / 1000 } : p;
    });
    return { ...s, products, sales: [...s.sales, sale], nextInvoice: s.nextInvoice + 1 };
  });
  return sale;
}

// ---- Demo ----
export function resetDemo() {
  state = freshState();
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function loadDemoSales() {
  const names = ["", "", "Ahmed Traders", "Bilal Store", "Fatima", "Usman Kiryana", "", "Sana"];
  setState((s) => {
    let inv = s.nextInvoice;
    const sales: Sale[] = [];
    const now = Date.now();
    for (let d = 13; d >= 0; d--) {
      const count = 3 + Math.floor(Math.random() * 6);
      for (let k = 0; k < count; k++) {
        const day = new Date(now - d * 86400000);
        day.setHours(9 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60));
        if (day.getTime() > now) continue;
        const tier: PriceTier = Math.random() < 0.35 ? "wholesale" : "retail";
        const picks = [...s.products].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 4));
        const items: SaleItem[] = picks.map((p) => {
          const usePack = tier === "wholesale" && !!p.packSize && Math.random() < 0.6;
          const qty = p.baseUnit === "kg" ? Math.round((1 + Math.random() * 9) * 2) / 2 : 1 + Math.floor(Math.random() * 4);
          const li = lineInfo(p, { productId: p.id, usePack, qty }, tier);
          return { productId: p.id, name: p.name, qty, ...li };
        });
        const subtotal = items.reduce((a, i) => a + i.lineTotal, 0);
        const t = computeTotals(subtotal, "fixed", 0, s.settings.taxRate);
        const method: PaymentMethod = Math.random() < 0.6 ? "cash" : "card";
        sales.push({
          id: uid(),
          invoiceNo: "",
          timestamp: day.getTime(),
          customerName: names[Math.floor(Math.random() * names.length)] || undefined,
          priceTier: tier,
          items,
          subtotal,
          ...t,
          paymentMethod: method,
          amountPaid: t.total,
          tendered: method === "cash" ? t.total : undefined,
          change: method === "cash" ? 0 : undefined,
          status: "completed",
        });
      }
    }
    sales.sort((a, b) => a.timestamp - b.timestamp);
    sales.forEach((x) => (x.invoiceNo = formatInvoice(inv++)));
    return { ...s, sales: [...s.sales, ...sales].sort((a, b) => a.timestamp - b.timestamp), nextInvoice: inv };
  });
}
