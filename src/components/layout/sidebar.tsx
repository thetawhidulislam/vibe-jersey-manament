"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import {
  LayoutDashboard,
  Shirt,
  ShoppingCart,
  Users,
  BarChart3,
  Wallet,
  Receipt,
  HandCoins,
  LogOut,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jerseys", label: "Jerseys", icon: Shirt },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/invest", label: "Total Invest", icon: Wallet },
  { href: "/cost", label: "Total Cost", icon: Receipt },
  { href: "/settlement", label: "Settlements", icon: HandCoins },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-ink text-white">
      <div className="px-5 py-6">
        <div className="font-display text-3xl font-semibold tracking-tight text-volt">
          VIBE
        </div>
        <div className="text-xs tracking-widest text-white/40">ATHLETICS ADMIN</div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-volt text-ink" : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <button
          onClick={async () => {
            await signOut();
            router.push("/login");
            router.refresh();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
