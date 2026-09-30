import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  BookOpen,
  Bot,
  Gauge,
  Loader2,
  LogOut,
  Menu,
  Radar,
  Send,
  Settings,
  ShieldCheck,
  Target,
  Users,
  X,
} from "lucide-react";

import { LetitzLogo } from "@/components/brand/Logo";
import { useAuth } from "@/hooks/use-auth";
import { useApplyUiSettings, useUiSettings } from "@/hooks/use-ui-settings";
import { supabase } from "@/integrations/supabase/client";
import { orderedNav, type UiSettings } from "@/lib/ui-settings";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Gauge> = {
  "/": Gauge,
  "/agent": Bot,
  "/prospects": Radar,
  "/leads": Users,
  "/campaigns": Send,
  "/opportunities": Target,
  "/sales": Activity,
  "/knowledge": BookOpen,
  "/settings": Settings,
};

function usePendingCount(enabled: boolean) {
  return useQuery({
    queryKey: ["pending-count"],
    enabled,
    refetchInterval: 15000,
    queryFn: async () => {
      const { count } = await supabase
        .from("agent_actions")
        .select("id", { count: "exact", head: true })
        .eq("status", "awaiting_authorization");
      return count ?? 0;
    },
  });
}

function NavItems({ onNavigate, pending, ui }: { onNavigate?: () => void; pending: number; ui: UiSettings }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {orderedNav(ui).map(({ path: to, label }) => {
        const Icon = ICONS[to] ?? Gauge;
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        const primary = to === "/agent";
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "focus-ring relative flex items-center gap-3 rounded-lg px-3 py-2 text-[0.8125rem] transition-colors duration-200",
              active ? "bg-surface-2/70 text-foreground" : "text-muted-foreground hover:bg-surface/60 hover:text-foreground",
              primary && !active && "text-foreground",
            )}
          >
            <span
              className={cn(
                "accent-rule absolute top-1/2 left-0 h-5 w-[2px] -translate-y-1/2 rounded-full transition-opacity",
                active ? "opacity-100" : "opacity-0",
              )}
            />
            <Icon className={cn("size-4 shrink-0", (active || primary) && "text-primary")} strokeWidth={1.6} />
            <span className="truncate">{label}</span>
            {primary && pending > 0 && (
              <span className="text-numeric ml-auto rounded-full bg-warning/15 px-1.5 text-[0.625rem] text-warning">
                {pending}
              </span>
            )}
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
  bare = false,
}: {
  children: ReactNode;
  greeting?: string;
  subtitle?: string;
  bare?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session, user, ready } = useAuth();
  const navigate = useNavigate();
  const pending = usePendingCount(Boolean(session)).data ?? 0;
  const ui = useUiSettings(Boolean(session));
  useApplyUiSettings(ui);

  useEffect(() => {
    if (ready && !session) navigate({ to: "/auth" });
  }, [ready, session, navigate]);

  if (!ready || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const name = (user?.user_metadata?.["full_name"] as string | undefined) ?? user?.email ?? "";

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0" style={{ opacity: `calc(0.32 * var(--glow))` }}>
        <div className="absolute -top-48 left-1/3 size-[38rem] rounded-full bg-primary/10 blur-[150px]" />
        <div className="absolute top-1/2 -right-48 size-[32rem] rounded-full bg-violet/10 blur-[160px]" />
      </div>

      <aside className="fixed top-0 left-0 z-30 hidden h-screen w-[var(--sidebar-w)] flex-col border-r border-border/60 bg-surface/40 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link to="/" className="focus-ring rounded-lg">
            <LetitzLogo />
          </Link>
        </div>
        <p className="label-caps px-5 pb-2 pt-3 text-[0.625rem]">Workspace</p>
        <div className="flex-1 overflow-y-auto">
          <NavItems pending={pending} ui={ui} />
        </div>
        <div className="space-y-3 p-4">
          <Link to="/audit" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ShieldCheck className="size-3.5" strokeWidth={1.6} /> Auditoria do Agent
          </Link>
          <div className="flex items-center gap-2">
            <p className="flex-1 truncate text-xs text-foreground">{name}</p>
            <button
              onClick={() => supabase.auth.signOut()}
              className="focus-ring text-muted-foreground hover:text-foreground"
              aria-label="Sair"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
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
              <button onClick={() => setMobileOpen(false)} className="focus-ring text-muted-foreground" aria-label="Fechar">
                <X className="size-4" />
              </button>
            </div>
            <NavItems pending={pending} onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto p-4">
              <Link to="/audit" onClick={() => setMobileOpen(false)} className="text-xs text-muted-foreground">
                Auditoria do Agent
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="relative lg:pl-[15rem]">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl sm:px-6 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="focus-ring text-muted-foreground" aria-label="Abrir menu">
            <Menu className="size-5" />
          </button>
          <LetitzLogo />
        </header>

        <main className={cn(bare ? "" : "px-4 pt-8 pb-16 sm:px-6 lg:px-10")}>
          {(greeting || subtitle) && (
            <div className="rise-in mb-8">
              {greeting && (
                <h1 className="text-display text-2xl font-medium text-foreground sm:text-[1.75rem]">{greeting}</h1>
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
