import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { Counter, DemoTag, Panel, SectionTitle } from "@/components/ui-kit";
import { formatCurrency, formatDate, sales, salesSummary } from "@/lib/demo-data";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Vendas — LETITZ" },
      {
        name: "description",
        content:
          "Receita, ticket médio, valores pagos e pendentes de cada venda originada pela prospecção do LETITZ.",
      },
      { property: "og:title", content: "Vendas — LETITZ" },
      { property: "og:description", content: "Receita e status de pagamento por cliente." },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  return (
    <AppShell greeting="Vendas" subtitle="Resultado comercial originado pela prospecção.">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-5">
          {[
            { label: "Vendas", value: salesSummary.count },
            { label: "Receita", value: salesSummary.revenue, currency: true },
            { label: "Ticket médio", value: salesSummary.averageTicket, currency: true },
            { label: "Pago", value: salesSummary.paid, currency: true },
            { label: "Pendente", value: salesSummary.pending, currency: true },
          ].map((m) => (
            <div key={m.label} className="bg-surface/70 px-4 py-5">
              <p className="label-caps">{m.label}</p>
              <p className="mt-2 text-lg text-foreground">
                <Counter
                  value={m.value}
                  format={(n) => (m.currency ? formatCurrency(n) : String(Math.round(n)))}
                />
              </p>
            </div>
          ))}
        </div>

        <Panel className="p-0">
          <div className="p-5">
            <SectionTitle title="Histórico" hint="Vendas registradas" action={<DemoTag />} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr className="border-y border-border text-left">
                  {["Client", "Service", "Value", "Date", "Payment", "Status"].map((h) => (
                    <th key={h} className="label-caps px-5 py-3 font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-foreground">{s.client}</td>
                    <td className="px-5 py-3 text-muted-foreground">{s.service}</td>
                    <td className="text-numeric px-5 py-3 text-foreground">
                      {formatCurrency(s.value)}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(s.date)}</td>
                    <td className="px-5 py-3 text-muted-foreground capitalize">{s.payment}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[0.625rem] tracking-[0.12em] uppercase ${
                          s.status === "paid"
                            ? "border-success/35 bg-success/10 text-success"
                            : "border-warning/30 bg-warning/10 text-warning"
                        }`}
                      >
                        {s.status === "paid" ? "pago" : "pendente"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
