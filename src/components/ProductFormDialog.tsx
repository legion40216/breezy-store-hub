import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type BaseUnit, type Product, saveProduct, uid, usePos } from "@/lib/pos-store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

interface Form {
  name: string; sku: string; category: string; baseUnit: BaseUnit;
  packName: string; packSize: string; retail: string; wholesale: string; cost: string; stock: string;
}

const toForm = (p?: Product): Form => ({
  name: p?.name ?? "", sku: p?.sku ?? "", category: p?.category ?? "", baseUnit: p?.baseUnit ?? "pcs",
  packName: p?.packName ?? "", packSize: p?.packSize ? String(p.packSize) : "",
  retail: p ? String(p.retailPrice / 100) : "", wholesale: p ? String(p.wholesalePrice / 100) : "",
  cost: p ? String(p.costPrice / 100) : "", stock: p ? String(p.stock) : "",
});

export function ProductFormDialog({ open, onOpenChange, product }: { open: boolean; onOpenChange: (v: boolean) => void; product?: Product | undefined }) {
  const [f, setF] = useState<Form>(toForm(product));
  const [err, setErr] = useState("");
  const s = usePos();
  const categories = [...new Set((s?.products ?? []).map((p) => p.category))].sort((a, b) => a.localeCompare(b));
  const [catOpen, setCatOpen] = useState(false);
  const [catQuery, setCatQuery] = useState("");
  const pickCat = (c: string) => { setF((prev) => ({ ...prev, category: c })); setCatQuery(""); setCatOpen(false); };
  useEffect(() => { if (open) { setF(toForm(product)); setErr(""); } }, [open, product]);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = (s: string) => Math.round((parseFloat(s) || 0) * 100);
    if (!f.name.trim() || !f.sku.trim()) return setErr("Name and SKU are required.");
    const packSize = parseInt(f.packSize);
    if (f.packName.trim() && !(packSize > 1)) return setErr("Pack size must be more than 1.");
    saveProduct({
      id: product?.id ?? uid(),
      name: f.name.trim(), sku: f.sku.trim(), category: f.category.trim() || "General", baseUnit: f.baseUnit,
      packName: f.packName.trim() || undefined, packSize: f.packName.trim() ? packSize : undefined,
      retailPrice: num(f.retail), wholesalePrice: num(f.wholesale), costPrice: num(f.cost),
      stock: Math.max(0, parseFloat(f.stock) || 0),
    });
    onOpenChange(false);
  };

  const field = (k: keyof Form, label: string, type = "text") => (
    <div className="space-y-1">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type={type} step="any" value={f[k]} onChange={set(k)} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">{field("name", "Name")}</div>
          {field("sku", "SKU")}
          <div className="space-y-1">
            <Label htmlFor="category">Category</Label>
            <Popover open={catOpen} onOpenChange={setCatOpen}>
              <PopoverTrigger asChild>
                <Button id="category" type="button" variant="outline" role="combobox" aria-expanded={catOpen} className="h-9 w-full justify-between px-3 font-normal">
                  <span className={f.category ? "truncate" : "truncate text-muted-foreground"}>{f.category || "Choose or type"}</span>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search or type new..." value={catQuery} onValueChange={setCatQuery} />
                  <CommandList>
                    <CommandEmpty>No categories yet.</CommandEmpty>
                    {catQuery.trim() && !categories.some((c) => c.toLowerCase() === catQuery.trim().toLowerCase()) && (
                      <CommandGroup heading="New">
                        <CommandItem value={`__new__${catQuery}`} onSelect={() => pickCat(catQuery.trim())}>
                          <Plus className="mr-2 h-4 w-4" /> Create "{catQuery.trim()}"
                        </CommandItem>
                      </CommandGroup>
                    )}
                    <CommandGroup heading="Existing">
                      {categories.map((c) => (
                        <CommandItem key={c} value={c} onSelect={() => pickCat(c)}>
                          <Check className={f.category === c ? "mr-2 h-4 w-4" : "mr-2 h-4 w-4 opacity-0"} />
                          {c}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1">
            <Label htmlFor="baseUnit">Base unit</Label>
            <select id="baseUnit" value={f.baseUnit} onChange={set("baseUnit")} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
              <option value="pcs">pcs</option>
              <option value="kg">kg</option>
            </select>
          </div>
          {field("stock", "Stock (base units)", "number")}
          {field("packName", "Pack name (optional)")}
          {field("packSize", "Pack size", "number")}
          {field("retail", "Retail price", "number")}
          {field("wholesale", "Wholesale price", "number")}
          {field("cost", "Cost price", "number")}
          {err && <p className="col-span-2 text-sm text-destructive">{err}</p>}
          <Button type="submit" className="col-span-2">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
