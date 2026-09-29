import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Chip, DemoTag, Panel, SectionTitle } from "@/components/ui-kit";
import {
  conversationInsights,
  conversations,
  formatDateTime,
  getLead,
  type ConversationTag,
} from "@/lib/demo-data";

export const Route = createFileRoute("/conversations")({
  head: () => ({
    meta: [
      { title: "Conversas — LETITZ" },
      {
        name: "description",
        content:
          "Inbox de prospecção do LETITZ: conversas por estágio, contexto do lead e análise de abordagem, clareza e follow-up.",
      },
      { property: "og:title", content: "Conversas — LETITZ" },
      {
        property: "og:description",
        content: "Todas as conversas ligadas ao lead, com leitura crítica da sua abordagem.",
      },
    ],
  }),
  component: ConversationsPage,
});

const FILTERS: Array<{ key: ConversationTag | "all" | "unread"; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "unread", label: "Não lidas" },
  { key: "interested", label: "Interessados" },
  { key: "followup", label: "Follow-up" },
  { key: "proposal", label: "Proposta" },
  { key: "won", label: "Ganhas" },
  { key: "lost", label: "Perdidas" },
];

function ConversationsPage() {
  const [filter, setFilter] = useState<ConversationTag | "all" | "unread">("all");
  const [selectedId, setSelectedId] = useState(conversations[0]!.id);

  const list = conversations.filter((c) =>
    filter === "all" ? true : filter === "unread" ? c.unread : c.tag === filter,
  );
  const active = conversations.find((c) => c.id === selectedId) ?? list[0];
  const lead = active ? getLead(active.lead_id) : undefined;

  return (
    <AppShell greeting="Conversas" subtitle="Cada conversa está ligada a um lead do CRM.">
      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <Panel className="p-0">
          <div className="flex flex-wrap gap-2 border-b border-border p-4">
            {FILTERS.map((f) => (
              <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
                {f.label}
              </Chip>
            ))}
            <DemoTag className="ml-auto self-center" />
          </div>

          <div className="grid lg:grid-cols-[18rem_1fr]">
            <ul className="divide-y divide-border border-b border-border lg:border-r lg:border-b-0">
              {list.map((c) => {
                const l = getLead(c.lead_id);
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedId(c.id)}
                      className={`interactive w-full px-4 py-3.5 text-left ${
                        active?.id === c.id ? "bg-surface-2/70" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm text-foreground">{l?.company_name}</span>
                        {c.unread && <span className="size-1.5 rounded-full bg-primary" />}
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {c.messages[c.messages.length - 1]?.body}
                      </p>
                      <p className="mt-1 text-[0.625rem] text-muted-foreground">
                        {formatDateTime(c.last_at)}
                      </p>
                    </button>
                  </li>
                );
              })}
              {list.length === 0 && (
                <li className="px-4 py-10 text-center text-xs text-muted-foreground">
                  Nenhuma conversa neste filtro.
                </li>
              )}
            </ul>

            <div className="flex min-h-[24rem] flex-col">
              {active && lead ? (
                <>
                  <div className="flex items-center justify-between gap-3 border-b border-border p-4">
                    <div>
                      <p className="text-sm text-foreground">{lead.company_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.segment} · {lead.city}
                      </p>
                    </div>
                    <Link
                      to="/leads/$leadId"
                      params={{ leadId: lead.id }}
                      className="text-[0.6875rem] tracking-[0.1em] text-muted-foreground uppercase hover:text-foreground"
                    >
                      Abrir lead
                    </Link>
                  </div>

                  <div className="flex-1 space-y-3 p-4">
                    {active.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                          m.from === "me"
                            ? "ml-auto border border-primary/25 bg-primary/10 text-foreground"
                            : "border border-border bg-surface-2/60 text-foreground"
                        }`}
                      >
                        {m.body}
                        <p className="mt-1 text-[0.5625rem] text-muted-foreground">
                          {formatDateTime(m.at)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border p-4">
                    <input
                      placeholder="Responder (envio habilitado após conectar o WhatsApp oficial)"
                      className="input-base"
                      disabled
                    />
                  </div>
                </>
              ) : (
                <p className="m-auto text-xs text-muted-foreground">Selecione uma conversa.</p>
              )}
            </div>
          </div>
        </Panel>

        <Panel className="h-fit">
          <SectionTitle
            title="Análise de conversas"
            hint={`${conversationInsights.analyzed} conversas analisadas`}
            action={<DemoTag />}
          />
          <ul className="space-y-3">
            {[
              ["Tempo médio de resposta", `${conversationInsights.avgResponseMinutes} min`],
              ["Clareza", `${conversationInsights.clarity}/100`],
              ["Tratamento de objeções", `${conversationInsights.objectionHandling}/100`],
              ["Disciplina de follow-up", `${conversationInsights.followupDiscipline}/100`],
              ["Probabilidade de continuidade", `${conversationInsights.continuationProbability}%`],
            ].map(([label, value]) => (
              <li key={label} className="flex items-baseline justify-between border-b border-border pb-2">
                <span className="label-caps">{label}</span>
                <span className="text-numeric text-xs text-foreground">{value}</span>
              </li>
            ))}
          </ul>

          <ul className="mt-5 space-y-2">
            {conversationInsights.highlights.map((h) => (
              <li key={h} className="flex gap-2 text-xs text-muted-foreground">
                <span className="accent-rule mt-1.5 size-1 shrink-0 rounded-full" />
                {h}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
