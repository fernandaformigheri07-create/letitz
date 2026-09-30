import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ArrowUp, Sparkles } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ActionCard } from "@/components/agent/ActionCard";
import { SUGGESTIONS } from "@/components/agent/AgentChat";
import { EmptyState, SectionTitle } from "@/components/ui-kit";
import { useUiSettings } from "@/hooks/use-ui-settings";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { orderedSections, type SectionId } from "@/lib/ui-settings";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center — LETITZ" },
      {
        name: "description",
        content: "Estado real da sua operação comercial: decisões pendentes, oportunidades, follow-ups e vendas.",
      },
      { property: "og:title", content: "Command Center — LETITZ" },
      { property: "og:description", content: "O sistema operacional comercial comandado por um Agent." },
    ],
  }),
  component: () => (
    <AppShell>
      <CommandCenter />
    </AppShell>
  ),
});

const count = async (table: "leads" | "conversations" | "campaigns" | "conversation_messages" | "opportunities" | "follow_ups" | "sales", filter?: (q: any) => any) => {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count: c } = await q;
  return c ?? 0;
};

function CommandCenter() {
  const navigate = useNavigate();
  const ui = useUiSettings();
  const [prompt, setPrompt] = useState("");

  const stats = useQuery({
    queryKey: ["cc-stats"],
    queryFn: async () => {
      const [leads, contacts, conversations, campaigns, messages, opps, interested, followUps, salesRows] = await Promise.all([
        count("leads"),
        count("leads", (q) => q.not("contact_name", "is", null)),
        count("conversations"),
        count("campaigns"),
        count("conversation_messages"),
        count("opportunities"),
        count("opportunities", (q) => q.eq("stage", "interest")),
        count("follow_ups", (q) => q.eq("status", "scheduled")),
        supabase.from("sales").select("value"),
      ]);
      const sales = salesRows.data ?? [];
      const revenue = sales.reduce((s, r) => s + Number(r.value), 0);
      return {
        leads, contacts, companies: leads, conversations, campaigns, messages, opps, interested, followUps,
        sales: sales.length, revenue,
        conversion: leads ? Math.round((sales.length / leads) * 1000) / 10 : 0,
      };
    },
  });

  const lists = useQuery({
    queryKey: ["cc-lists"],
    queryFn: async () => {
      const [pending, follow, opps, sales] = await Promise.all([
        supabase.from("agent_actions").select("id").eq("status", "awaiting_authorization").order("created_at", { ascending: false }).limit(5),
        supabase.from("follow_ups").select("id,kind,reason,due_at,leads(company_name)").eq("status", "scheduled").order("due_at").limit(5),
        supabase.from("opportunities").select("id,title,stage,signal,next_step,lead_id").order("updated_at", { ascending: false }).limit(5),
        supabase.from("sales").select("id,client_name,value,sold_at").order("sold_at", { ascending: false }).limit(5),
      ]);
      return { pending: pending.data ?? [], follow: follow.data ?? [], opps: opps.data ?? [], sales: sales.data ?? [] };
    },
  });

  const s = stats.data;
  const metrics = [
    ["leads", "Leads", s?.leads], ["contacts", "Contatos", s?.contacts], ["companies", "Empresas", s?.companies],
    ["conversations", "Conversas", s?.conversations], ["campaigns", "Campanhas", s?.campaigns],
    ["messages", "Mensagens", s?.messages], ["opportunities", "Oportunidades", s?.opps],
    ["interested", "Interessados", s?.interested], ["follow_ups", "Follow-ups", s?.followUps],
    ["sales", "Vendas", s?.sales], ["revenue", "Receita", s ? formatCurrency(s.revenue) : undefined],
    ["conversion", "Conversão", s ? `${s.conversion}%` : undefined],
  ].filter(([id]) => !ui.dashboard.hidden_metrics.includes(id as string)) as Array<[string, string, string | number | undefined]>;

  const go = (text: string) => text.trim() && navigate({ to: "/agent", search: { q: text.trim() } });

  const sections: Record<SectionId, { wide?: boolean; node: ReactNode }> = {
    agent_prompt: {
      wide: true,
      node: (
        <section className="rise-in">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-primary" strokeWidth={1.7} />
            <span className="label-caps text-foreground">LETITZ Agent</span>
          </div>
          <h1 className="text-display mt-3 text-2xl text-foreground sm:text-3xl">Command Center</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              go(prompt);
            }}
            className="glow-soft mt-6 flex items-center gap-2 rounded-2xl border border-border/70 bg-surface/60 p-2 pl-4 backdrop-blur-xl focus-within:border-primary/40"
          >
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Diga ao Agent o que fazer — inclusive mudar o próprio LETITZ…"
              className="h-10 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button type="submit" aria-label="Enviar" className="focus-ring accent-rule rounded-xl p-2.5 text-primary-foreground">
              <ArrowUp className="size-4" />
            </button>
          </form>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {SUGGESTIONS.slice(0, 3).map((t) => (
              <button key={t} onClick={() => go(t)} className="text-xs text-muted-foreground hover:text-foreground">
                {t}
              </button>
            ))}
          </div>
        </section>
      ),
    },
    metrics: {
      wide: true,
      node: metrics.length ? (
        <section className="panel-quiet grid grid-cols-2 gap-px overflow-hidden sm:grid-cols-4 lg:grid-cols-6">
          {metrics.map(([id, label, value]) => (
            <div key={id} className="bg-background/40 px-4 py-4">
              <p className="label-caps">{label}</p>
              <p className="text-numeric mt-1.5 text-lg text-foreground">{value ?? "—"}</p>
            </div>
          ))}
        </section>
      ) : null,
    },
    pending: {
      node: (
        <section>
          <SectionTitle title="Decisões pendentes" hint="Ações do Agent aguardando sua autorização" />
          {lists.data?.pending.length ? (
            <div className="space-y-2">{lists.data.pending.map((p) => <ActionCard key={p.id} id={p.id} />)}</div>
          ) : (
            <EmptyState title="Tudo tranquilo." description="Nenhuma ação pendente." />
          )}
        </section>
      ),
    },
    opportunities: {
      node: (
        <section>
          <SectionTitle title="Oportunidades" action={<Link to="/opportunities" className="text-xs text-muted-foreground hover:text-foreground">Ver todas</Link>} />
          {lists.data?.opps.length ? (
            <ul className="divide-y divide-border/50">
              {lists.data.opps.map((o) => (
                <li key={o.id} className="data-row">
                  <p className="text-sm text-foreground">{o.title}</p>
                  <p className="text-xs text-muted-foreground">{o.signal}{o.next_step ? ` · próximo: ${o.next_step}` : ""}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nenhuma oportunidade ainda." description="Quando um contato demonstrar interesse real, ela aparece aqui." />
          )}
        </section>
      ),
    },
    follow_ups: {
      node: (
        <section>
          <SectionTitle title="Follow-ups" />
          {lists.data?.follow.length ? (
            <ul className="divide-y divide-border/50">
              {lists.data.follow.map((f) => (
                <li key={f.id} className="data-row flex items-baseline gap-3">
                  <span className="text-numeric w-28 shrink-0 text-xs text-primary">{formatDateTime(f.due_at)}</span>
                  <span className="flex-1 text-sm text-foreground">{f.reason}</span>
                  <span className="text-[0.625rem] tracking-[0.12em] text-muted-foreground uppercase">
                    {f.kind === "reminder" ? "lembrete" : "execução"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nenhum follow-up agendado." description="Peça ao Agent: “me lembra daqui 3 horas…”." />
          )}
        </section>
      ),
    },
    sales: {
      node: (
        <section>
          <SectionTitle title="Vendas" action={<Link to="/sales" className="text-xs text-muted-foreground hover:text-foreground">Ver todas</Link>} />
          {lists.data?.sales.length ? (
            <ul className="divide-y divide-border/50">
              {lists.data.sales.map((v) => (
                <li key={v.id} className="data-row flex items-baseline justify-between text-sm">
                  <span className="text-foreground">{v.client_name}</span>
                  <span className="text-numeric text-foreground">{formatCurrency(Number(v.value))}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nenhuma venda registrada." description="Vendas só entram aqui com sua confirmação." />
          )}
        </section>
      ),
    },
  };

  const visible = orderedSections(ui);

  return (
    <div className="mx-auto max-w-6xl pt-4">
      {visible.length === 0 ? (
        <EmptyState title="Command Center vazio." description="Todas as seções estão ocultas. Peça ao Agent para mostrá-las novamente." />
      ) : (
        <div className="grid gap-x-12 gap-y-12 lg:grid-cols-2">
          {visible.map((id) => {
            const sec = sections[id];
            if (!sec.node) return null;
            return (
              <div key={id} className={cn("min-w-0", sec.wide && "lg:col-span-2")}>
                {sec.node}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
