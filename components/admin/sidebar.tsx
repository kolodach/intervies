"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: BarChart3,
  },
  {
    title: "Problems",
    href: "/admin/problems",
    icon: FileText,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div
      className={cn(
        "relative flex flex-col border-r bg-muted/10 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border bg-background shadow-md"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {/* Header */}
      <div className="flex h-14 items-center border-b px-4">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        {!collapsed && (
          <span className="ml-2 font-semibold text-sm">Admin Panel</span>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {!collapsed && <span className="ml-2">{item.title}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer - Back to App */}
      <div className="border-t px-3 py-4">
        <Link href="/app">
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? "Back to App" : undefined}
          >
            <ArrowLeft className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Back to App</span>}
          </Button>
        </Link>
      </div>
    </div>
  );
}

