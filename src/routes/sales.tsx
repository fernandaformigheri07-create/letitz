import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ActionButton, EmptyState } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales — LETITZ" },
      { name: "description", content: "Vendas reais, registradas somente com sua confirmação." },
      { property: "og:title", content: "Sales — LETITZ" },
      { property: "og:description", content: "Receita e vendas confirmadas da operação." },
    ],
  }),
  component: () => (
    <AppShell greeting="Sales" subtitle="Interesse não é venda. Aqui entram apenas vendas confirmadas por você.">
      <Sales />
    </AppShell>
  ),
});

function Sales() {
  const qc = useQueryClient();
  const [f, setF] = useState({ client_name: "", service: "", value: "" });
  const q = useQuery({
    queryKey: ["sales"],
    queryFn: async () => (await supabase.from("sales").select("*").order("sold_at", { ascending: false })).data ?? [],
  });
  const total = (q.data ?? []).reduce((s, r) => s + Number(r.value), 0);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("sales").insert({ client_name: f.client_name.trim(), service: f.service.trim() || null, value: Number(f.value) || 0 });
    setF({ client_name: "", service: "", value: "" });
    qc.invalidateQueries({ queryKey: ["sales"] });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-10 border-y border-border/50 py-5">
        <div><p className="label-caps">Vendas</p><p className="text-numeric mt-1 text-lg text-foreground">{q.data?.length ?? 0}</p></div>
        <div><p className="label-caps">Receita</p><p className="text-numeric mt-1 text-lg text-foreground">{formatCurrency(total)}</p></div>
        <div><p className="label-caps">Ticket médio</p><p className="text-numeric mt-1 text-lg text-foreground">{formatCurrency(q.data?.length ? total / q.data.length : 0)}</p></div>
      </div>

      <form onSubmit={add} className="flex flex-wrap gap-2">
        <input required className="input-base max-w-xs" placeholder="Cliente" value={f.client_name} onChange={(e) => setF({ ...f, client_name: e.target.value })} />
        <input className="input-base max-w-xs" placeholder="Serviço" value={f.service} onChange={(e) => setF({ ...f, service: e.target.value })} />
        <input required type="number" min={0} className="input-base max-w-[10rem]" placeholder="Valor (R$)" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />
        <ActionButton type="submit">Registrar venda confirmada</ActionButton>
      </form>

      {q.data && q.data.length === 0 ? (
        <EmptyState title="Nenhuma venda registrada." description="R$ 0 · 0% de conversão. Registre aqui ou confirme uma proposta do Agent." />
      ) : (
        <div className="divide-y divide-border/50">
          {q.data?.map((s) => (
            <div key={s.id} className="flex flex-wrap items-baseline gap-4 py-3.5 text-sm">
              <span className="flex-1 text-foreground">{s.client_name}</span>
              <span className="text-muted-foreground">{s.service ?? "—"}</span>
              <span className="text-xs text-muted-foreground">{formatDate(s.sold_at)}</span>
              <span className="text-[0.625rem] tracking-[0.12em] text-muted-foreground uppercase">{s.payment_status}</span>
              <span className="text-numeric w-28 text-right text-foreground">{formatCurrency(Number(s.value))}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
