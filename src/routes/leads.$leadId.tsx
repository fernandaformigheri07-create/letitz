import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Globe, Instagram, Mail, MapPin, MessageCircle, Phone, Star } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ActionButton, Panel, QualityBadge, ScoreDial, SectionTitle } from "@/components/ui-kit";
import { scoreLead } from "@/services/googlePlaces";
import { WEBSITE_STATUS_LABEL } from "@/lib/scoring";
import {
  conversations,
  formatCurrency,
  formatDate,
  formatDateTime,
  getLead,
  LEAD_STATUS_LABEL,
  LEAD_STATUS_ORDER,
  sales,
  type Lead,
} from "@/lib/demo-data";

export const Route = createFileRoute("/leads/$leadId")({
  loader: ({ params }) => {
    const lead = getLead(params.leadId);
    if (!lead) throw notFound();
    return { lead };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Lead indisponível — LETITZ" }, { name: "robots", content: "noindex" }] };
    }
    const { lead } = loaderData;
    const title = `${lead.company_name} — Lead ${lead.lead_score}/100 · LETITZ`;
    const description = `${lead.segment} em ${lead.city}, ${lead.state}. Situação do site: ${WEBSITE_STATUS_LABEL[lead.website_status]}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: LeadDetail,
});

function LeadDetail() {
  const { lead } = Route.useLoaderData();
  const score = scoreLead(lead);
  const leadConversations = conversations.filter((c) => c.lead_id === lead.id);
  const leadSales = sales.filter((s) => s.lead_id === lead.id);

  return (
    <AppShell>
      <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/leads" className="hover:text-foreground">
          Leads
        </Link>
        <span>/</span>
        <span className="text-foreground">{lead.company_name}</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Panel>
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-display text-xl text-foreground">{lead.company_name}</h1>
                  <QualityBadge quality={lead.lead_quality} />
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {lead.segment} · {lead.city}, {lead.state} · {lead.country}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Capturado em {formatDate(lead.created_at)} · origem {lead.source}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <ScoreDial score={lead.lead_score} size={72} />
                <div>
                  <p className="label-caps">Lead score</p>
                  <p className="text-numeric text-lg text-foreground">{lead.lead_score} / 100</p>
                  <p className="mt-1 text-[0.6875rem] text-muted-foreground">
                    Classificação interna do LETITZ
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <ActionButton>Preparar abordagem</ActionButton>
              <ActionButton variant="outline">Agendar follow-up</ActionButton>
              <ActionButton variant="ghost">Marcar como contatado</ActionButton>
            </div>
          </Panel>

          <Panel>
            <SectionTitle title="Timeline" hint="Jornada do lead dentro do LETITZ" />
            <ol className="relative space-y-4 pl-5">
              <span className="absolute top-1 bottom-1 left-[3px] w-px bg-border" />
              {["Captured", "Qualified", "Added to CRM", ...LEAD_STATUS_ORDER.slice(2, 7).map((s) => LEAD_STATUS_LABEL[s])].map(
                (step, i) => {
                  const reached = i <= LEAD_STATUS_ORDER.indexOf(lead.lead_status) + 1;
                  return (
                    <li key={step} className="relative">
                      <span
                        className={`absolute top-1.5 -left-5 size-1.5 rounded-full ${reached ? "bg-primary" : "bg-border-strong"}`}
                      />
                      <p className={`text-sm ${reached ? "text-foreground" : "text-muted-foreground"}`}>
                        {step}
                      </p>
                    </li>
                  );
                },
              )}
            </ol>
          </Panel>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel>
              <SectionTitle title="Business information" />
              <dl className="space-y-3 text-sm">
                <Row label="Segmento" value={lead.segment} />
                <Row label="Cidade" value={`${lead.city}, ${lead.state}`} />
                <Row
                  label="Google rating"
                  value={lead.google_rating ? `${lead.google_rating.toFixed(1)} ★` : "—"}
                />
                <Row label="Avaliações" value={String(lead.review_count)} />
                <Row label="Place ID" value={lead.google_place_id} />
              </dl>
            </Panel>

            <Panel>
              <SectionTitle title="Website analysis" hint="Análise simulada — analyzeWebsite()" />
              <dl className="space-y-3 text-sm">
                <Row label="Situação" value={WEBSITE_STATUS_LABEL[lead.website_status]} />
                <Row label="Website" value={lead.website ?? "Não possui"} />
                <Row
                  label="Website score"
                  value={lead.website_score !== null ? `${lead.website_score} / 100` : "—"}
                />
              </dl>
            </Panel>

            <Panel>
              <SectionTitle title="Contact information" />
              <ul className="space-y-2.5 text-sm text-foreground">
                <ContactLine icon={<Phone className="size-3.5" />} value={lead.phone} />
                <ContactLine
                  icon={<MessageCircle className="size-3.5" />}
                  value={lead.whatsapp ?? "WhatsApp não identificado"}
                />
                <ContactLine
                  icon={<Mail className="size-3.5" />}
                  value={lead.email ?? "E-mail não identificado"}
                />
                <ContactLine
                  icon={<Instagram className="size-3.5" />}
                  value={lead.instagram ?? "Instagram não identificado"}
                />
                <ContactLine
                  icon={<Globe className="size-3.5" />}
                  value={lead.website ?? "Sem site"}
                />
                <ContactLine
                  icon={<MapPin className="size-3.5" />}
                  value={`${lead.city}, ${lead.state}`}
                />
              </ul>
            </Panel>

            <Panel>
              <SectionTitle title="Activity" />
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li>Status atual: {LEAD_STATUS_LABEL[lead.lead_status]}</li>
                <li>
                  Último contato:{" "}
                  {lead.last_contact_at ? formatDateTime(lead.last_contact_at) : "sem contato"}
                </li>
                <li>
                  Próximo follow-up:{" "}
                  {lead.next_followup_at ? formatDateTime(lead.next_followup_at) : "não agendado"}
                </li>
                <li>Atualizado em {formatDateTime(lead.updated_at)}</li>
              </ul>
            </Panel>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel>
              <SectionTitle title="Conversations" />
              {leadConversations.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma conversa registrada.</p>
              ) : (
                <ul className="space-y-3">
                  {leadConversations.map((c) => (
                    <li key={c.id} className="panel-quiet p-3">
                      <p className="text-xs text-muted-foreground">{formatDateTime(c.last_at)}</p>
                      <p className="mt-1 text-sm text-foreground">
                        {c.messages[c.messages.length - 1]?.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel>
              <SectionTitle title="Sales" />
              {leadSales.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma venda registrada.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {leadSales.map((s) => (
                    <li key={s.id} className="flex items-center justify-between">
                      <span className="text-foreground">{s.service}</span>
                      <span className="text-numeric text-muted-foreground">
                        {formatCurrency(s.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>

        <aside className="space-y-6">
          <Panel>
            <SectionTitle title="Why this lead?" hint="Fatores que compõem o score" />
            <ul className="space-y-2.5">
              {score.factors
                .filter((f) => f.points > 0)
                .sort((a, b) => b.points - a.points)
                .map((f) => (
                  <li key={f.key} className="flex items-start gap-3">
                    <Star className="mt-0.5 size-3 shrink-0 text-primary" strokeWidth={1.8} />
                    <div className="min-w-0">
                      <p className="text-xs text-foreground">{f.detail}</p>
                      <p className="label-caps mt-0.5 text-[0.5625rem]">
                        {f.label} · +{f.points}
                      </p>
                    </div>
                  </li>
                ))}
            </ul>
            <p className="mt-4 text-[0.6875rem] text-muted-foreground">
              O score é uma classificação interna, não uma verdade absoluta.
            </p>
          </Panel>

          <Panel>
            <SectionTitle title="Notas" />
            <textarea
              rows={5}
              defaultValue={lead.notes}
              placeholder="Registre contexto da negociação..."
              className="input-base resize-none"
            />
          </Panel>
        </aside>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2 last:border-0">
      <dt className="label-caps">{label}</dt>
      <dd className="truncate text-right text-xs text-foreground">{value}</dd>
    </div>
  );
}

function ContactLine({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <li className="flex items-center gap-2.5 text-xs">
      <span className="text-muted-foreground">{icon}</span>
      <span className="truncate">{value}</span>
    </li>
  );
}

export type { Lead };
