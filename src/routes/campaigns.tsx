import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ActionButton, Chip, DemoTag, Panel, SectionTitle } from "@/components/ui-kit";
import { campaigns, formatDate, formatNumber, leads } from "@/lib/demo-data";
import { renderTemplate } from "@/services/whatsapp";

export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [
      { title: "Campanhas — LETITZ" },
      {
        name: "description",
        content:
          "Monte campanhas de prospecção por público, revise a mensagem com variáveis personalizadas e mantenha o controle antes de qualquer envio.",
      },
      { property: "og:title", content: "Campanhas — LETITZ" },
      {
        property: "og:description",
        content: "Públicos qualificados, mensagens personalizadas e revisão obrigatória.",
      },
    ],
  }),
  component: CampaignsPage,
});

function CampaignsPage() {
  const [selectedId, setSelectedId] = useState(campaigns[0]!.id);
  const campaign = campaigns.find((c) => c.id === selectedId)!;
  const sample = leads[0]!;

  const preview = renderTemplate(campaign.message, {
    "[NOME]": sample.contact_name.split(" ")[0]!,
    "[EMPRESA]": sample.company_name,
    "[CIDADE]": sample.city,
    "[SEGMENTO]": sample.segment,
  });

  return (
    <AppShell
      greeting="Campanhas"
      subtitle="Nenhuma mensagem é enviada nesta versão — tudo passa por revisão."
    >
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-3">
          {campaigns.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`focus-ring interactive block w-full rounded-xl border p-4 text-left ${
                c.id === selectedId ? "border-primary/40 bg-surface-2/70" : "border-border bg-surface/50"
              }`}
            >
              <p className="text-sm text-foreground">{c.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatNumber(c.audience)} leads · {c.channel} · {formatDate(c.created_at)}
              </p>
              <span className="label-caps mt-2 inline-block text-[0.5625rem]">{c.status}</span>
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <Panel>
            <SectionTitle title={campaign.name} hint="Audiência e qualidade" action={<DemoTag />} />
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
              {[
                ["Audience", formatNumber(campaign.audience)],
                ["Exceptional", String(campaign.quality.exceptional)],
                ["Good", String(campaign.quality.good)],
                ["Medium", String(campaign.quality.medium)],
              ].map(([label, value]) => (
                <div key={label} className="bg-surface/70 px-4 py-4">
                  <p className="label-caps">{label}</p>
                  <p className="text-numeric mt-1 text-base text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionTitle
              title="Mensagem"
              hint="Variáveis: [NOME] [EMPRESA] [CIDADE] [SEGMENTO]"
              action={<ActionButton variant="outline">Review campaign</ActionButton>}
            />
            <textarea
              rows={5}
              defaultValue={campaign.message}
              className="input-base resize-none"
              key={campaign.id}
            />

            <div className="mt-5">
              <p className="label-caps">Preview</p>
              <div className="mt-2 max-w-md rounded-xl rounded-tl-sm border border-border bg-surface-2/60 p-4 text-sm text-foreground">
                {preview}
              </div>
              <p className="mt-2 text-[0.6875rem] text-muted-foreground">
                Exemplo com dados de {sample.company_name}.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Chip active>Somente sem site</Chip>
              <Chip>Somente WhatsApp disponível</Chip>
              <Chip>Excepcionais primeiro</Chip>
            </div>
          </Panel>

          <Panel>
            <SectionTitle title="WhatsApp" hint="Integração oficial do WhatsApp Business Platform" />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-foreground">WhatsApp not connected</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  A conexão oficial será habilitada em uma próxima etapa. Sem scraping, sem
                  automação não oficial.
                </p>
              </div>
              <ActionButton variant="outline">Connect WhatsApp</ActionButton>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
