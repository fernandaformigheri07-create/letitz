import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/AppShell";
import { EmptyState, StatusPill } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Auditoria do Agent — LETITZ" },
      { name: "description", content: "O que o Agent fez, por quê, quem autorizou e o que realmente aconteceu." },
      { property: "og:title", content: "Auditoria do Agent — LETITZ" },
      { property: "og:description", content: "Registro transparente de cada ação do Agent." },
    ],
  }),
  component: () => (
    <AppShell greeting="Auditoria" subtitle="O que o Agent fez, por quê, quem autorizou e o resultado real.">
      <Audit />
    </AppShell>
  ),
});

function Audit() {
  const q = useQuery({
    queryKey: ["audit"],
    queryFn: async () =>
      (await supabase.from("agent_audit_log").select("*").order("created_at", { ascending: false }).limit(200)).data ?? [],
  });
  if (q.data && q.data.length === 0) return <EmptyState title="Nenhum registro ainda." description="Cada ação do Agent aparecerá aqui." />;
  return (
    <div className="divide-y divide-border/50">
      {q.data?.map((r) => (
        <div key={r.id} className="grid gap-1 py-3.5 sm:grid-cols-[8rem_1fr_12rem] sm:gap-4">
          <span className="text-numeric text-xs text-muted-foreground">{formatDateTime(r.created_at)}</span>
          <div className="min-w-0">
            <p className="text-sm text-foreground">{r.detail ?? r.event}</p>
            <p className="text-[0.6875rem] text-muted-foreground">
              {r.intent ? `Intenção: ${r.intent} · ` : ""}Autorizado por: {r.authorized_by ?? "—"}
              {r.error ? ` · Erro: ${r.error}` : ""}
            </p>
          </div>
          {r.status && <StatusPill status={r.status} className="sm:justify-end" />}
        </div>
      ))}
    </div>
  );
}
