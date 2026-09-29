import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { AgentConsole } from "@/components/AgentConsole";
import { DigitalGlobe } from "@/components/DigitalGlobe";
import { Counter, DemoTag, Panel, SectionTitle, Sparkline } from "@/components/ui-kit";
import {
  activity,
  analytics,
  discoveryPanels,
  formatCurrency,
  formatDateTime,
  formatNumber,
  overviewMetrics,
  pipeline,
  salesSummary,
} from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LETITZ — Command center de prospecção e vendas" },
      {
        name: "description",
        content:
          "LETITZ é um agente de prospecção: descubra empresas, qualifique leads por score, prepare campanhas e acompanhe vendas em um único painel.",
      },
      { property: "og:title", content: "LETITZ — Command center de prospecção e vendas" },
      {
        property: "og:description",
        content:
          "Descoberta de oportunidades, qualificação por score, campanhas e vendas em um produto único.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const snapshot = analytics["30d"];

  return (
    <AppShell greeting="Boa noite, Alice." subtitle="O que vamos construir hoje?">
      <div className="space-y-6">
        <AgentConsole compact />

        <section>
          <SectionTitle
            title="Métricas principais"
            hint="Números de demonstração — serão substituídos por dados reais."
            action={<DemoTag />}
          />
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
            {overviewMetrics.map((m) => (
              <div key={m.key} className="bg-surface/70 px-4 py-5 backdrop-blur-sm">
                <p className="label-caps truncate">{m.label}</p>
                <p className="mt-2 text-lg text-foreground">
                  <Counter
                    value={m.value}
                    format={(n) =>
                      m.currency ? formatCurrency(n) : formatNumber(Math.round(n))
                    }
                  />
                </p>
                <p className="mt-1 text-[0.6875rem] text-success">{m.delta}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <Panel className="relative overflow-hidden p-0">
            <div className="flex items-start justify-between p-5">
              <div>
                <p className="label-caps">Opportunity intelligence</p>
                <p className="text-display mt-1.5 text-sm text-foreground">
                  O LETITZ está varrendo o mercado
                </p>
              </div>
              <Link
                to="/prospects"
                className="focus-ring interactive flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[0.6875rem] tracking-[0.1em] text-foreground uppercase"
              >
                Lead discovery <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <div className="relative h-[19rem] sm:h-[22rem]">
              <DigitalGlobe target={{ lat: -25.43, lng: -49.27 }} />
              <div className="pointer-events-none absolute inset-x-5 bottom-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {discoveryPanels.slice(0, 3).map((p) => (
                  <div
                    key={p.label}
                    className="panel-quiet bg-background/70 px-3 py-2 backdrop-blur-md"
                  >
                    <p className="label-caps truncate text-[0.625rem]">{p.label}</p>
                    <p className="text-numeric mt-0.5 text-sm text-foreground">{p.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <div className="grid gap-6">
            <Panel>
              <SectionTitle title="Pipeline" hint="Distribuição dos leads por estágio" />
              <ul className="space-y-2.5">
                {pipeline.map((stage) => {
                  const max = Math.max(...pipeline.map((s) => s.count), 1);
                  return (
                    <li key={stage.status} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-xs text-muted-foreground">
                        {stage.label}
                      </span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <span
                          className="accent-rule block h-full rounded-full transition-[width] duration-700"
                          style={{ width: `${(stage.count / max) * 100}%` }}
                        />
                      </span>
                      <span className="text-numeric w-8 text-right text-xs text-foreground">
                        {stage.count}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <Panel>
              <SectionTitle
                title="Vendas"
                hint={`Ticket médio ${formatCurrency(salesSummary.averageTicket)}`}
                action={
                  <Link
                    to="/sales"
                    className="text-[0.6875rem] tracking-[0.1em] text-muted-foreground uppercase hover:text-foreground"
                  >
                    Ver
                  </Link>
                }
              />
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-display text-xl text-foreground">
                    {formatCurrency(salesSummary.revenue)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {salesSummary.count} vendas registradas
                  </p>
                </div>
                <div className="w-32">
                  <Sparkline values={snapshot.series} height={40} />
                </div>
              </div>
            </Panel>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Panel>
            <SectionTitle title="Atividade" hint="Últimos movimentos do workspace" />
            <ul className="space-y-3">
              {activity.map((entry) => (
                <li key={entry.id} className="flex gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/70" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{entry.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{entry.detail}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-[0.6875rem] text-muted-foreground">
                    {formatDateTime(entry.at)}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <SectionTitle title="Conversão do funil" hint="Últimos 30 dias" action={<DemoTag />} />
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                ["Captados", snapshot.captured],
                ["Qualificados", snapshot.qualified],
                ["Contatados", snapshot.contacted],
                ["Respostas", snapshot.replies],
                ["Propostas", snapshot.proposals],
                ["Ganhos", snapshot.won],
              ].map(([label, value]) => (
                <div key={label as string} className="border-b border-border pb-3">
                  <p className="label-caps">{label as string}</p>
                  <p className="text-numeric mt-1 text-base text-foreground">
                    {formatNumber(value as number)}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </section>
      </div>
    </AppShell>
  );
}
