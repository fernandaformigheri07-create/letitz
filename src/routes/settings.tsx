import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { ActionButton, Panel, SectionTitle } from "@/components/ui-kit";
import { WORKSPACE_ID } from "@/lib/demo-data";
import { whatsappConnection, templates } from "@/services/whatsapp";
import { emailConnection } from "@/services/email";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Configurações — LETITZ" },
      {
        name: "description",
        content:
          "Workspace, integrações previstas (WhatsApp Business oficial, Google Places, e-mail) e templates de mensagem do LETITZ.",
      },
      { property: "og:title", content: "Configurações — LETITZ" },
      { property: "og:description", content: "Workspace, integrações e templates de abordagem." },
    ],
  }),
  component: SettingsPage,
});

const INTEGRATIONS = [
  {
    name: "WhatsApp Business Platform",
    detail: "Envio e inbox oficiais. Sem scraping ou automação não oficial.",
    status: whatsappConnection.status === "connected" ? "Conectado" : "Não conectado",
  },
  {
    name: "Google Places",
    detail: "Descoberta real de empresas por segmento e região.",
    status: "Não conectado",
  },
  {
    name: "E-mail transacional",
    detail: "Sequências e propostas por e-mail.",
    status: emailConnection.status === "connected" ? "Conectado" : "Não conectado",
  },
];

function SettingsPage() {
  return (
    <AppShell greeting="Configurações" subtitle="Workspace, integrações e templates.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionTitle title="Workspace" hint="Single user agora, multiusuário no futuro" />
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="label-caps">Workspace ID</dt>
              <dd className="text-numeric text-xs text-foreground">{WORKSPACE_ID}</dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="label-caps">Usuário</dt>
              <dd className="text-xs text-foreground">Alice</dd>
            </div>
            <div className="flex justify-between">
              <dt className="label-caps">Fuso</dt>
              <dd className="text-xs text-foreground">America/Sao_Paulo</dd>
            </div>
          </dl>
        </Panel>

        <Panel>
          <SectionTitle title="Integrações" hint="Credenciais ficam sempre no backend" />
          <ul className="space-y-3">
            {INTEGRATIONS.map((i) => (
              <li key={i.name} className="panel-quiet flex items-center justify-between gap-4 p-3.5">
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{i.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{i.detail}</p>
                </div>
                <span className="label-caps shrink-0 text-[0.5625rem]">{i.status}</span>
              </li>
            ))}
          </ul>
          <ActionButton variant="outline" className="mt-4">
            Conectar integrações
          </ActionButton>
        </Panel>

        <Panel className="lg:col-span-2">
          <SectionTitle title="Templates de mensagem" hint="Usados nas campanhas e follow-ups" />
          <ul className="grid gap-3 md:grid-cols-3">
            {templates.map((t) => (
              <li key={t.id} className="panel-quiet p-4">
                <p className="text-sm text-foreground">{t.name}</p>
                <p className="label-caps mt-1 text-[0.5625rem]">{t.category}</p>
                <p className="mt-2 text-xs text-muted-foreground">{t.body}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
