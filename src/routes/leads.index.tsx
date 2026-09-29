import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ActionButton, Chip, EmptyState, QualityBadge } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import type { LeadQuality } from "@/lib/scoring";

export const Route = createFileRoute("/leads/")({
  head: () => ({
    meta: [
      { title: "Leads — LETITZ" },
      { name: "description", content: "Seus leads reais, com sinais, contexto e justificativa de cada oportunidade." },
      { property: "og:title", content: "Leads — LETITZ" },
      { property: "og:description", content: "CRM de leads qualificados pelo LETITZ." },
    ],
  }),
  component: () => (
    <AppShell greeting="Leads" subtitle="Somente dados reais — adicionados por você ou pelo Agent.">
      <Leads />
    </AppShell>
  ),
});

const FILTERS: Array<{ key: LeadQuality | "all"; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "exceptional", label: "Exceptional" },
  { key: "good", label: "Good Opportunity" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
  { key: "discarded", label: "Discarded" },
];

function Leads() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<LeadQuality | "all">("all");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const leads = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("id,company_name,contact_name,city,segment,lead_quality,justification,status")
        .order("lead_score", { ascending: false });
      return data ?? [];
    },
  });

  const visible = (leads.data ?? []).filter(
    (l) =>
      (filter === "all" || l.lead_quality === filter) &&
      `${l.company_name} ${l.contact_name ?? ""} ${l.city ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}</Chip>
        ))}
        <input className="input-base ml-auto max-w-xs" placeholder="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ActionButton variant="outline" onClick={() => setAdding((v) => !v)}><Plus className="size-3.5" /> Lead</ActionButton>
      </div>

      {adding && <NewLeadForm onDone={() => { setAdding(false); qc.invalidateQueries({ queryKey: ["leads"] }); }} />}

      {leads.data && visible.length === 0 ? (
        <EmptyState
          title={leads.data.length ? "Nenhum lead neste filtro." : "Nenhum lead ainda."}
          description="Adicione manualmente ou peça ao Agent para organizar sua base."
        />
      ) : (
        <div className="divide-y divide-border/50">
          {visible.map((l) => (
            <Link key={l.id} to="/leads/$leadId" params={{ leadId: l.id }} className="interactive flex items-center gap-4 px-2 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{l.company_name}{l.contact_name ? <span className="text-muted-foreground"> · {l.contact_name}</span> : null}</p>
                <p className="truncate text-xs text-muted-foreground">{[l.segment, l.city].filter(Boolean).join(" · ")}{l.justification ? ` — ${l.justification}` : ""}</p>
              </div>
              <span className="hidden text-[0.625rem] tracking-[0.12em] text-muted-foreground uppercase sm:inline">{l.status}</span>
              <QualityBadge quality={l.lead_quality as LeadQuality} />
              <ArrowUpRight className="size-3.5 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function NewLeadForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ company_name: "", contact_name: "", segment: "", city: "", state: "", whatsapp: "", website: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const clean = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim() || null])) as Record<string, string | null>;
    const signals = [!clean["website"] && "Sem site informado", clean["whatsapp"] && "WhatsApp disponível"].filter(Boolean) as string[];
    await supabase.from("leads").insert({
      ...clean,
      company_name: f.company_name.trim(),
      signals,
      justification: signals.join(" + ") || null,
    });
    setBusy(false);
    onDone();
  };

  return (
    <form onSubmit={save} className="grid gap-3 rounded-2xl bg-surface/40 p-5 sm:grid-cols-3">
      <input required className="input-base" placeholder="Empresa *" value={f.company_name} onChange={set("company_name")} />
      <input className="input-base" placeholder="Contato" value={f.contact_name} onChange={set("contact_name")} />
      <input className="input-base" placeholder="Segmento" value={f.segment} onChange={set("segment")} />
      <input className="input-base" placeholder="Cidade" value={f.city} onChange={set("city")} />
      <input className="input-base" placeholder="Estado" value={f.state} onChange={set("state")} />
      <input className="input-base" placeholder="WhatsApp" value={f.whatsapp} onChange={set("whatsapp")} />
      <input className="input-base sm:col-span-2" placeholder="Site (vazio = sem site)" value={f.website} onChange={set("website")} />
      <ActionButton type="submit" disabled={busy}>Salvar lead</ActionButton>
    </form>
  );
}
