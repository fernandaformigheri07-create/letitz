import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunities — LETITZ" },
      { name: "description", content: "Contatos com interesse real, intenção observada e próximo passo." },
      { property: "og:title", content: "Opportunities — LETITZ" },
      { property: "og:description", content: "Oportunidades comerciais baseadas em sinais reais." },
    ],
  }),
  component: () => (
    <AppShell greeting="Opportunities" subtitle="Interesse registrado a partir de sinais reais — nunca de suposições.">
      <Opps />
    </AppShell>
  ),
});

const STAGE: Record<string, string> = {
  interest: "Interesse",
  consideration: "Consideração",
  purchase_intent: "Intenção de compra",
  proposal: "Proposta",
  negotiation: "Negociação",
};

function Opps() {
  const q = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const { data } = await supabase
        .from("opportunities")
        .select("id,title,stage,signal,next_step,updated_at,lead_id,leads(company_name,contact_name)")
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
  });
  if (q.data && q.data.length === 0)
    return <EmptyState title="Nenhuma oportunidade ainda." description="Quando um contato demonstrar interesse, o Agent registra aqui com o sinal observado." />;
  return (
    <div className="divide-y divide-border/50">
      {q.data?.map((o) => {
        const lead = o.leads as { company_name?: string; contact_name?: string | null } | null;
        return (
          <div key={o.id} className="flex flex-wrap items-baseline gap-4 py-4">
            <span className="w-32 text-[0.625rem] tracking-[0.12em] text-primary uppercase">{STAGE[o.stage] ?? o.stage}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">{o.title}</p>
              <p className="text-xs text-muted-foreground">Sinal: {o.signal ?? "—"}{o.next_step ? ` · Próximo: ${o.next_step}` : ""}</p>
            </div>
            {o.lead_id && (
              <Link to="/leads/$leadId" params={{ leadId: o.lead_id }} className="text-xs text-muted-foreground hover:text-foreground">
                {lead?.contact_name ?? lead?.company_name}
              </Link>
            )}
            <span className="text-[0.6875rem] text-muted-foreground">{formatDateTime(o.updated_at)}</span>
          </div>
        );
      })}
    </div>
  );
}
