import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { AUTOPILOT_PERMISSIONS, INTEGRATIONS } from "@/lib/agent-levels";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — LETITZ" },
      { name: "description", content: "Autopilot, permissões do Agent e integrações." },
      { property: "og:title", content: "Settings — LETITZ" },
      { property: "og:description", content: "Controle total sobre o que o Agent pode fazer." },
    ],
  }),
  component: () => (
    <AppShell greeting="Settings" subtitle="Autopilot desligado por padrão. Integrações não conectadas não são simuladas.">
      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <p className="label-caps mb-3">Autopilot · OFF</p>
          <ul className="divide-y divide-border/50">
            {AUTOPILOT_PERMISSIONS.map((p: { key: string; label: string }) => (
              <li key={p.key} className="flex justify-between py-3 text-sm"><span className="text-foreground">{p.label}</span><span className="text-xs text-muted-foreground">Desligado</span></li>
            ))}
          </ul>
        </section>
        <section>
          <p className="label-caps mb-3">Integrações</p>
          <ul className="divide-y divide-border/50">
            {INTEGRATIONS.map((i: { key: string; label: string }) => (
              <li key={i.key} className="flex justify-between py-3 text-sm"><span className="text-foreground">{i.label}</span><span className="text-xs text-warning">Não conectado</span></li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  ),
});
