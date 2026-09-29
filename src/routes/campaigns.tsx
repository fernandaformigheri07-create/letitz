import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaigns — LETITZ" },
      { name: "description", content: "Campanhas preparadas pelo Agent ou por você. Nada é enviado sem autorização." },
      { property: "og:title", content: "Campaigns — LETITZ" },
      { property: "og:description", content: "Campanhas comerciais com autorização explícita." },
    ],
  }),
  component: () => (
    <AppShell greeting="Campaigns" subtitle="Peça ao Agent para preparar uma campanha. Envio só com autorização.">
      <Campaigns />
    </AppShell>
  ),
});

function Campaigns() {
  const q = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => (await supabase.from("campaigns").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  if (q.data && q.data.length === 0)
    return <EmptyState title="Nenhuma campanha ainda." description="Diga ao Agent: “prepare uma campanha para os leads sem site”." />;
  return (
    <div className="divide-y divide-border/50">
      {q.data?.map((c) => (
        <div key={c.id} className="py-4">
          <p className="text-sm text-foreground">{c.name} <span className="ml-2 text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground">{c.status}</span></p>
          {c.message_template && <p className="mt-1 text-xs text-muted-foreground">{c.message_template}</p>}
        </div>
      ))}
    </div>
  );
}
