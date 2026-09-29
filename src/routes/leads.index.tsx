import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { LeadRow } from "@/components/LeadRow";
import { Chip, DemoTag, Panel, SectionTitle } from "@/components/ui-kit";
import { leads, LEAD_STATUS_LABEL, LEAD_STATUS_ORDER, type LeadStatus } from "@/lib/demo-data";
import type { LeadQuality } from "@/lib/scoring";

export const Route = createFileRoute("/leads/")({
  head: () => ({
    meta: [
      { title: "Leads — CRM do LETITZ" },
      {
        name: "description",
        content:
          "CRM do LETITZ: leads qualificados por score, filtros por qualidade, presença digital e estágio do funil.",
      },
      { property: "og:title", content: "Leads — CRM do LETITZ" },
      {
        property: "og:description",
        content: "Todo o pipeline de prospecção organizado por qualidade e estágio.",
      },
    ],
  }),
  component: LeadsPage,
});

const QUALITY_FILTERS: Array<{ key: LeadQuality | "all"; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "exceptional", label: "Excepcionais" },
  { key: "good", label: "Bons" },
  { key: "medium", label: "Médios" },
  { key: "low", label: "Baixa prioridade" },
];

const SIGNAL_FILTERS = [
  { key: "no_website", label: "Sem site" },
  { key: "website_problem", label: "Site com problema" },
  { key: "whatsapp", label: "WhatsApp disponível" },
  { key: "instagram", label: "Instagram disponível" },
] as const;

type SignalKey = (typeof SIGNAL_FILTERS)[number]["key"];

function LeadsPage() {
  const [quality, setQuality] = useState<LeadQuality | "all">("all");
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [signals, setSignals] = useState<SignalKey[]>([]);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      leads.filter((l) => {
        if (quality !== "all" && l.lead_quality !== quality) return false;
        if (status !== "all" && l.lead_status !== status) return false;
        if (signals.includes("no_website") && l.website !== null) return false;
        if (
          signals.includes("website_problem") &&
          (l.website === null || l.website_status === "healthy")
        )
          return false;
        if (signals.includes("whatsapp") && !l.whatsapp) return false;
        if (signals.includes("instagram") && !l.instagram) return false;
        if (query.trim()) {
          const q = query.toLowerCase();
          const hay = `${l.company_name} ${l.segment} ${l.city} ${l.state}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      }),
    [quality, status, signals, query],
  );

  const toggleSignal = (key: SignalKey) =>
    setSignals((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));

  return (
    <AppShell greeting="Leads" subtitle="Seu CRM de prospecção, ordenado por oportunidade real.">
      <Panel>
        <SectionTitle
          title={`${filtered.length} leads`}
          hint="Lead quality, presença digital e estágio do funil"
          action={<DemoTag />}
        />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="label-caps mr-1">Lead quality</span>
            {QUALITY_FILTERS.map((f) => (
              <Chip key={f.key} active={quality === f.key} onClick={() => setQuality(f.key)}>
                {f.label}
              </Chip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="label-caps mr-1">Sinais</span>
            {SIGNAL_FILTERS.map((f) => (
              <Chip key={f.key} active={signals.includes(f.key)} onClick={() => toggleSignal(f.key)}>
                {f.label}
              </Chip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="label-caps mr-1">Status</span>
            <Chip active={status === "all"} onClick={() => setStatus("all")}>
              Todos
            </Chip>
            {LEAD_STATUS_ORDER.map((s) => (
              <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
                {LEAD_STATUS_LABEL[s]}
              </Chip>
            ))}
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por empresa, segmento ou cidade"
            className="input-base max-w-sm"
          />
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-border">
          {filtered.length === 0 ? (
            <p className="px-4 py-12 text-center text-xs text-muted-foreground">
              Nenhum lead corresponde a esses filtros.
            </p>
          ) : (
            [...filtered]
              .sort((a, b) => b.lead_score - a.lead_score)
              .map((lead) => <LeadRow key={lead.id} lead={lead} />)
          )}
        </div>
      </Panel>
    </AppShell>
  );
}
