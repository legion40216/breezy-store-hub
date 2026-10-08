import { Link } from "@tanstack/react-router";
import { BarChart3, Package, Settings, ShoppingCart } from "lucide-react";

const links = [
  { to: "/", label: "Checkout", icon: ShoppingCart },
  { to: "/products", label: "Products", icon: Package },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Nav() {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-border bg-ink text-ink-foreground">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-3 py-2">
        <span className="hidden font-bold tracking-tight sm:block">
          POS<span className="text-primary">.</span>
        </span>
        <nav className="flex flex-1 justify-around gap-1 sm:justify-start">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: true }}
              className="flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs font-medium opacity-70 transition hover:opacity-100 sm:flex-row sm:gap-2 sm:text-sm"
              activeProps={{ className: "!opacity-100 bg-primary text-primary-foreground" }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
