import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { DigitalGlobe } from "@/components/DigitalGlobe";
import { ActionButton, Panel, SectionTitle } from "@/components/ui-kit";
import { resolveLocation } from "@/lib/locations";

export const Route = createFileRoute("/prospects")({
  head: () => ({
    meta: [
      { title: "Prospect — LETITZ" },
      {
        name: "description",
        content: "Defina segmento, região e critérios de prospecção. O Agent interpreta e busca quando a fonte estiver conectada.",
      },
      { property: "og:title", content: "Prospect — LETITZ" },
      { property: "og:description", content: "Prospecção estruturada por segmento e localização." },
    ],
  }),
  component: () => (
    <AppShell greeting="Prospect" subtitle="Estruture a busca. Nenhum resultado é inventado.">
      <Prospects />
    </AppShell>
  ),
});

function Prospects() {
  const navigate = useNavigate();
  const [segment, setSegment] = useState("");
  const [country, setCountry] = useState("Brasil");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [quantity, setQuantity] = useState(30);
  const [noSite, setNoSite] = useState(false);
  const [whats, setWhats] = useState(false);

  const target = resolveLocation([city, state, country].filter(Boolean).join(", "));

  const send = () => {
    const where = [region, city, state, country].filter(Boolean).join(", ");
    const crit = [noSite && "sem site", whats && "com WhatsApp"].filter(Boolean).join(" e ");
    const q = `Procure ${quantity} ${segment || "empresas"}${where ? ` em ${where}` : ""}${crit ? ` ${crit}` : ""}.`;
    navigate({ to: "/agent", search: { q } });
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[20rem_1fr]">
      <Panel className="h-fit">
        <SectionTitle title="Nova busca" hint="O Agent interpreta e executa" />
        <div className="space-y-3">
          <Field label="Segmento"><input className="input-base" placeholder="Hamburguerias" value={segment} onChange={(e) => setSegment(e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="País"><input className="input-base" value={country} onChange={(e) => setCountry(e.target.value)} /></Field>
            <Field label="Estado"><input className="input-base" placeholder="RS" value={state} onChange={(e) => setState(e.target.value)} /></Field>
          </div>
          <Field label="Cidade"><input className="input-base" placeholder="Porto Alegre" value={city} onChange={(e) => setCity(e.target.value)} /></Field>
          <Field label="Região / bairro"><input className="input-base" value={region} onChange={(e) => setRegion(e.target.value)} /></Field>
          <Field label="Quantidade"><input type="number" min={1} max={200} className="input-base" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></Field>
          <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={noSite} onChange={(e) => setNoSite(e.target.checked)} /> Somente sem site</label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={whats} onChange={(e) => setWhats(e.target.checked)} /> Somente com WhatsApp</label>
          <ActionButton className="w-full" onClick={send} disabled={!segment.trim()}>Pedir ao Agent</ActionButton>
        </div>
      </Panel>

      <div className="space-y-4">
        <div className="relative h-[24rem] overflow-hidden rounded-2xl sm:h-[30rem]">
          <DigitalGlobe target={target} searching={false} />
          <div className="pointer-events-none absolute top-4 left-4">
            <p className="label-caps">Região alvo</p>
            <p className="text-display mt-1 text-sm text-foreground">{target.label}</p>
          </div>
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-warning" />
          Fonte de prospecção (Google Places) não conectada. O Agent registra o pedido e informa o estado — sem resultados fictícios.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label-caps">{label}</span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}
