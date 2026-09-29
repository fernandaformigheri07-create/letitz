import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { UIMessage } from "ai";
import { Loader2, Plus } from "lucide-react";
import { z } from "zod";

import { AppShell } from "@/components/AppShell";
import { AgentChat } from "@/components/agent/AgentChat";
import { ActionCard } from "@/components/agent/ActionCard";
import { supabase } from "@/integrations/supabase/client";
import { levelLabel } from "@/lib/agent-levels";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agent")({
  validateSearch: z.object({ q: z.string().optional(), t: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Agent — LETITZ" },
      {
        name: "description",
        content: "Central de comando conversacional do LETITZ: peça em linguagem natural e autorize cada ação.",
      },
      { property: "og:title", content: "Agent — LETITZ" },
      { property: "og:description", content: "Seu operador comercial inteligente, com autorização contextual." },
    ],
  }),
  component: AgentPage,
});

function AgentPage() {
  return (
    <AppShell bare>
      <AgentWorkspace />
    </AppShell>
  );
}

function AgentWorkspace() {
  const { q, t } = Route.useSearch();
  const navigate = useNavigate({ from: "/agent" });
  const qc = useQueryClient();
  const [threadId, setThreadId] = useState<string | null>(t ?? null);

  const threads = useQuery({
    queryKey: ["agent-threads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_threads")
        .select("id,title,updated_at")
        .order("updated_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const newThread = async () => {
    const { data } = await supabase.from("agent_threads").insert({}).select("id").single();
    if (data) {
      setThreadId(data.id);
      qc.invalidateQueries({ queryKey: ["agent-threads"] });
    }
  };

  useEffect(() => {
    if (threadId || !threads.data) return;
    if (q || threads.data.length === 0) void newThread();
    else setThreadId(threads.data[0]!.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads.data, threadId, q]);

  const history = useQuery({
    queryKey: ["agent-history", threadId],
    enabled: Boolean(threadId),
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_messages")
        .select("role,parts,created_at")
        .eq("thread_id", threadId!)
        .order("created_at");
      return (data ?? []).map((r) => {
        const p = r.parts as { id: string; parts: UIMessage["parts"] };
        return { id: p.id, role: r.role as UIMessage["role"], parts: p.parts } as UIMessage;
      });
    },
  });

  return (
    <div className="grid xl:grid-cols-[1fr_20rem]">
      <div className="min-w-0">
        {threadId && history.data ? (
          <AgentChat
            key={threadId}
            threadId={threadId}
            initialMessages={history.data}
            initialPrompt={q}
          />
        ) : (
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <aside className="hidden border-l border-border/50 xl:block">
        <div className="sticky top-0 h-screen space-y-8 overflow-y-auto p-5">
          <SidePanel threadId={threadId} />
          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="label-caps">Operações</p>
              <button
                onClick={() => {
                  navigate({ search: {} });
                  void newThread();
                }}
                className="focus-ring flex items-center gap-1 text-[0.6875rem] text-muted-foreground hover:text-foreground"
              >
                <Plus className="size-3" /> Nova
              </button>
            </div>
            <ul className="space-y-0.5">
              {threads.data?.map((th) => (
                <li key={th.id}>
                  <button
                    onClick={() => {
                      navigate({ search: {} });
                      setThreadId(th.id);
                    }}
                    className={cn(
                      "w-full truncate rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
                      th.id === threadId ? "bg-surface-2/70 text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {th.title}
                    <span className="block text-[0.625rem] text-muted-foreground">{formatDateTime(th.updated_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </aside>
    </div>
  );
}

function SidePanel({ threadId }: { threadId: string | null }) {
  const side = useQuery({
    queryKey: ["agent-side", threadId],
    enabled: Boolean(threadId),
    queryFn: async () => {
      const [thread, auths, pending] = await Promise.all([
        supabase.from("agent_threads").select("context").eq("id", threadId!).maybeSingle(),
        supabase
          .from("authorizations")
          .select("id,level,scope,leads(company_name,contact_name)")
          .is("revoked_at", null)
          .order("granted_at", { ascending: false })
          .limit(8),
        supabase
          .from("agent_actions")
          .select("id")
          .eq("status", "awaiting_authorization")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);
      return {
        context: (thread.data?.context ?? {}) as {
          selection?: { label: string; lead_ids: string[] };
          active_lead?: { company_name?: string; contact_name?: string | null } | null;
        },
        auths: auths.data ?? [],
        pending: pending.data ?? [],
      };
    },
  });

  const ctx = side.data?.context;
  return (
    <>
      <section>
        <p className="label-caps mb-3">Contexto atual</p>
        {ctx?.selection || ctx?.active_lead ? (
          <div className="space-y-2 text-xs">
            {ctx.selection && (
              <p className="text-foreground">
                Seleção: <span className="text-muted-foreground">{ctx.selection.label}</span>{" "}
                <span className="text-numeric text-primary">({ctx.selection.lead_ids.length})</span>
              </p>
            )}
            {ctx.active_lead && (
              <p className="text-foreground">
                Em foco:{" "}
                <span className="text-muted-foreground">
                  {ctx.active_lead.contact_name ?? ""} {ctx.active_lead.company_name ?? ""}
                </span>
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhuma seleção ainda.</p>
        )}
      </section>

      <section>
        <p className="label-caps mb-3">Aguardando você</p>
        {side.data?.pending.length ? (
          <div className="space-y-2">
            {side.data.pending.map((p) => (
              <ActionCard key={p.id} id={p.id} compact />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Tudo tranquilo. Nenhuma ação pendente.</p>
        )}
      </section>

      <section>
        <p className="label-caps mb-3">Autorizações vigentes</p>
        {side.data?.auths.length ? (
          <ul className="space-y-2.5">
            {side.data.auths.map((a) => {
              const lead = a.leads as { company_name?: string; contact_name?: string | null } | null;
              return (
                <li key={a.id} className="text-xs">
                  <p className="text-foreground">
                    {lead?.contact_name ?? lead?.company_name ?? "—"}{" "}
                    <span className="text-primary">· até {levelLabel(a.level)}</span>
                  </p>
                  <p className="text-[0.6875rem] text-muted-foreground">{a.scope}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhuma autorização concedida.</p>
        )}
      </section>
    </>
  );
}
