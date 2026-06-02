"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Receipt,
  Bot,
  Settings,
  Scissors,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/markkinointi", label: "Markkinointi", icon: Megaphone },
  { href: "/dashboard/asiakkaat", label: "Asiakkaat", icon: Users },
  { href: "/dashboard/talous", label: "Talous", icon: Receipt },
  { href: "/dashboard/ai", label: "AI Assistentti", icon: Bot },
  { href: "/dashboard/asetukset", label: "Asetukset", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-zinc-900 text-white flex flex-col">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">RNR Business</p>
            <p className="text-xs text-zinc-400">RNR Salonki</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-rose-500 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-xs font-bold">
            RNR
          </div>
          <div>
            <p className="text-xs font-medium">Admin</p>
            <p className="text-xs text-zinc-500">Super Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
