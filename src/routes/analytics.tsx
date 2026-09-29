import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Chip, Counter, DemoTag, Panel, SectionTitle, Sparkline } from "@/components/ui-kit";
import {
  analytics,
  analyticsRanges,
  formatCurrency,
  formatNumber,
  qualityCounts,
  type RangeKey,
} from "@/lib/demo-data";
import { QUALITY_LABEL, type LeadQuality } from "@/lib/scoring";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — LETITZ" },
      {
        name: "description",
        content:
          "Leads captados, qualificados, contatos, respostas, propostas, conversão e receita por período no LETITZ.",
      },
      { property: "og:title", content: "Analytics — LETITZ" },
      { property: "og:description", content: "Desempenho do funil de prospecção por período." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const data = analytics[range];

  const metrics: Array<[string, number, boolean?]> = [
    ["Leads captados", data.captured],
    ["Qualificados", data.qualified],
    ["Contatados", data.contacted],
    ["Respostas", data.replies],
    ["Propostas", data.proposals],
    ["Ganhos", data.won],
  ];

  return (
    <AppShell greeting="Analytics" subtitle="Desempenho do funil em cada etapa.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {analyticsRanges.map((r) => (
            <Chip key={r.key} active={range === r.key} onClick={() => setRange(r.key)}>
              {r.label}
            </Chip>
          ))}
          <DemoTag className="ml-auto" />
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
          {metrics.map(([label, value]) => (
            <div key={label} className="bg-surface/70 px-4 py-5">
              <p className="label-caps truncate">{label}</p>
              <p className="mt-2 text-lg text-foreground">
                <Counter value={value} format={(n) => formatNumber(Math.round(n))} />
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Panel>
            <SectionTitle title="Volume de captura" hint="Evolução no período selecionado" />
            <Sparkline values={data.series} height={160} />
          </Panel>

          <div className="grid gap-6">
            <Panel>
              <SectionTitle title="Conversão e receita" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="label-caps">Conversão</p>
                  <p className="text-numeric mt-1 text-xl text-foreground">
                    {data.conversion.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="label-caps">Receita</p>
                  <p className="text-numeric mt-1 text-xl text-foreground">
                    {formatCurrency(data.revenue)}
                  </p>
                </div>
              </div>
            </Panel>

            <Panel>
              <SectionTitle title="Qualidade da base" hint="Classificação interna dos leads" />
              <ul className="space-y-2.5">
                {(Object.keys(qualityCounts) as LeadQuality[]).map((q) => {
                  const total = Object.values(qualityCounts).reduce((a, b) => a + b, 0) || 1;
                  return (
                    <li key={q} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 text-xs text-muted-foreground">
                        {QUALITY_LABEL[q]}
                      </span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <span
                          className="accent-rule block h-full rounded-full"
                          style={{ width: `${(qualityCounts[q] / total) * 100}%` }}
                        />
                      </span>
                      <span className="text-numeric w-8 text-right text-xs text-foreground">
                        {qualityCounts[q]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
