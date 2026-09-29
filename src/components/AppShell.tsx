import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Radar,
  Search,
  Send,
  Settings,
  Users,
  X,
} from "lucide-react";

import { LetitzLogo, LetitzMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/prospects", label: "Prospects", icon: Radar },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/campaigns", label: "Campaigns", icon: Send },
  { to: "/conversations", label: "Conversations", icon: MessageSquare },
  { to: "/agent", label: "Agent", icon: Bot },
  { to: "/sales", label: "Sales", icon: Activity },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "focus-ring group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.8125rem] transition-all duration-200",
              active
                ? "bg-surface-2/80 text-foreground"
                : "text-muted-foreground hover:bg-surface-2/50 hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "accent-rule absolute top-1/2 left-0 h-5 w-[2px] -translate-y-1/2 rounded-full transition-opacity duration-200",
                active ? "opacity-100" : "opacity-0",
              )}
            />
            <Icon className={cn("size-4 shrink-0", active && "text-primary")} strokeWidth={1.6} />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  greeting,
  subtitle,
}: {
  children: ReactNode;
  greeting?: string;
  subtitle?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 opacity-[0.35]">
        <div className="grid-veil absolute inset-0" />
        <div className="absolute -top-40 left-1/3 size-[36rem] rounded-full bg-primary/8 blur-[140px]" />
        <div className="absolute top-1/2 -right-40 size-[30rem] rounded-full bg-violet/8 blur-[150px]" />
      </div>

      <aside className="fixed top-0 left-0 z-30 hidden h-screen w-[15rem] flex-col border-r border-border bg-surface/40 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link to="/" className="focus-ring rounded-lg">
            <LetitzLogo />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto pt-2">
          <NavItems />
        </div>
        <div className="border-t border-border p-4">
          <p className="label-caps">Workspace</p>
          <p className="mt-1.5 text-xs text-foreground">Prospecção · single user</p>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex h-full w-[16rem] flex-col border-r border-border bg-surface">
            <div className="flex h-16 items-center justify-between px-5">
              <LetitzLogo />
              <button
                onClick={() => setMobileOpen(false)}
                className="focus-ring text-muted-foreground"
                aria-label="Fechar"
              >
                <X className="size-4" />
              </button>
            </div>
            <NavItems onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="relative lg:pl-[15rem]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="focus-ring text-muted-foreground lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="hidden lg:block">
            <p className="label-caps">LETITZ</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <label className="hidden items-center gap-2 rounded-lg border border-border bg-surface/60 px-3 py-2 text-xs text-muted-foreground transition-colors focus-within:border-border-strong sm:flex">
              <Search className="size-3.5" strokeWidth={1.6} />
              <input
                placeholder="Buscar leads, empresas, conversas"
                className="w-56 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
              />
            </label>
            <button
              className="focus-ring interactive relative rounded-lg border border-border bg-surface/60 p-2 text-muted-foreground"
              aria-label="Notificações"
            >
              <Bell className="size-4" strokeWidth={1.6} />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
            </button>
            <Link
              to="/settings"
              className="focus-ring interactive flex items-center gap-2 rounded-lg border border-border bg-surface/60 py-1.5 pr-3 pl-1.5"
            >
              <LetitzMark className="size-6 rounded-md" />
              <span className="hidden text-xs text-foreground sm:inline">Alice</span>
            </Link>
          </div>
        </header>

        <main className="px-4 pt-8 pb-16 sm:px-6 lg:px-10">
          {(greeting || subtitle) && (
            <div className="rise-in mb-8">
              {greeting && (
                <h1 className="text-display text-2xl font-medium text-foreground sm:text-[1.75rem]">
                  {greeting}
                </h1>
              )}
              {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
