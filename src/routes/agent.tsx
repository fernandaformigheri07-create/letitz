import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { AgentConsole } from "@/components/AgentConsole";
import { DemoTag, Panel, SectionTitle } from "@/components/ui-kit";
import { AGENT_TOOLS } from "@/services/agent";
import { activity, formatDateTime } from "@/lib/demo-data";

export const Route = createFileRoute("/agent")({
  head: () => ({
    meta: [
      { title: "LETITZ Agent — command center" },
      {
        name: "description",
        content:
          "O agente do LETITZ opera com ferramentas internas: busca prospects, analisa sites, qualifica leads, prepara campanhas e gera relatórios.",
      },
      { property: "og:title", content: "LETITZ Agent — command center" },
      {
        property: "og:description",
        content: "Peça em linguagem natural e acompanhe cada ferramenta que o agente executa.",
      },
    ],
  }),
  component: AgentPage,
});

function AgentPage() {
  return (
    <AppShell
      greeting="LETITZ Agent"
      subtitle="Peça em linguagem natural. Nada é executado sem sua confirmação."
    >
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
        <AgentConsole />

        <div className="space-y-6">
          <Panel>
            <SectionTitle title="Ferramentas" hint="Cada ação declara input, output e status" />
            <ul className="space-y-2.5">
              {AGENT_TOOLS.map((tool) => (
                <li key={tool.name} className="panel-quiet px-3 py-2.5">
                  <p className="text-numeric text-xs text-foreground">{tool.name}()</p>
                  <p className="mt-1 text-[0.6875rem] text-muted-foreground">{tool.description}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <SectionTitle title="Histórico de ações" action={<DemoTag />} />
            <ul className="space-y-3">
              {activity
                .filter((a) => a.kind === "agent")
                .map((a) => (
                  <li key={a.id}>
                    <p className="text-sm text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.detail}</p>
                    <p className="mt-0.5 text-[0.625rem] text-muted-foreground">
                      {formatDateTime(a.at)}
                    </p>
                  </li>
                ))}
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
