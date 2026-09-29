import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { DigitalGlobe } from "@/components/DigitalGlobe";
import { ActionButton, Chip, DemoTag, Panel, SectionTitle } from "@/components/ui-kit";
import { LeadRow } from "@/components/LeadRow";
import {
  resolveLocation,
  searchProspects,
  SEARCH_STAGES,
  type SearchResult,
} from "@/services/googlePlaces";
import type { LeadQuality } from "@/lib/scoring";
import { discoveryPanels, formatNumber } from "@/lib/demo-data";

export const Route = createFileRoute("/prospects")({
  head: () => ({
    meta: [
      { title: "Lead Discovery — LETITZ" },
      {
        name: "description",
        content:
          "Descubra empresas por segmento e região com o globo de inteligência comercial do LETITZ e qualifique cada oportunidade por score.",
      },
      { property: "og:title", content: "Lead Discovery — LETITZ" },
      {
        property: "og:description",
        content: "Busque oportunidades por segmento e região e veja a qualificação em tempo real.",
      },
    ],
  }),
  component: Prospects,
});

const FILTERS: Array<{ key: LeadQuality | "all"; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "exceptional", label: "Excepcionais" },
  { key: "good", label: "Bons" },
  { key: "medium", label: "Médios" },
  { key: "low", label: "Baixa prioridade" },
];

function Prospects() {
  const [segment, setSegment] = useState("Hamburguerias");
  const [location, setLocation] = useState("Curitiba, Paraná");
  const [quantity, setQuantity] = useState(50);
  const [onlyWithoutWebsite, setOnlyWithoutWebsite] = useState(true);
  const [onlyWithWhatsapp, setOnlyWithWhatsapp] = useState(false);

  const [searching, setSearching] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [filter, setFilter] = useState<LeadQuality | "all">("all");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const target = resolveLocation(location);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const start = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setResult(null);
    setSearching(true);
    setStage(0);

    let elapsed = 0;
    SEARCH_STAGES.forEach((s, i) => {
      elapsed += s.durationMs;
      timers.current.push(setTimeout(() => setStage(i + 1), elapsed));
    });

    timers.current.push(
      setTimeout(async () => {
        const res = await searchProspects({
          segment,
          location,
          quantity,
          onlyWithoutWebsite,
          onlyWithWhatsapp,
        });
        setResult(res);
        setSearching(false);
      }, elapsed + 400),
    );
  };

  const visible =
    result?.leads.filter((l) => (filter === "all" ? true : l.lead_quality === filter)) ?? [];

  return (
    <AppShell
      greeting="Lead Discovery"
      subtitle="Descubra oportunidades por segmento e região. Nesta versão a varredura é simulada."
    >
      <div className="grid gap-6 xl:grid-cols-[20rem_1fr]">
        <Panel className="h-fit">
          <SectionTitle title="Nova busca" hint="Defina o perfil que o LETITZ deve procurar" />
          <div className="space-y-4">
            <Field label="Segmento">
              <input
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="input-base"
              />
            </Field>
            <Field label="Local">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input-base"
              />
            </Field>
            <Field label="Quantidade">
              <input
                type="number"
                min={5}
                max={50}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="input-base"
              />
            </Field>

            <div className="space-y-2 pt-1">
              <Toggle
                label="Somente sem site"
                checked={onlyWithoutWebsite}
                onChange={setOnlyWithoutWebsite}
              />
              <Toggle
                label="Somente com WhatsApp"
                checked={onlyWithWhatsapp}
                onChange={setOnlyWithWhatsapp}
              />
            </div>

            <ActionButton onClick={start} className="w-full" disabled={searching}>
              {searching ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Start search
            </ActionButton>
            <p className="text-[0.6875rem] text-muted-foreground">
              Busca simulada — nenhuma API externa é consultada nesta versão.
            </p>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="relative overflow-hidden p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="label-caps">Região alvo</p>
                <p className="text-display mt-1 text-sm text-foreground">{target.label}</p>
              </div>
              <div className="flex items-center gap-2">
                {searching && (
                  <span className="flex items-center gap-2 text-[0.6875rem] tracking-[0.14em] text-primary uppercase">
                    <Loader2 className="size-3 animate-spin" /> searching...
                  </span>
                )}
                <DemoTag />
              </div>
            </div>

            <div className="relative h-[24rem] sm:h-[30rem]">
              <DigitalGlobe target={target} searching={searching} />

              <div className="pointer-events-none absolute top-4 left-4 space-y-2">
                {livePanels.slice(0, 3).map((p) => (
                  <div
                    key={p.label}
                    className="panel-quiet w-36 bg-background/70 px-3 py-2 backdrop-blur-md"
                  >
                    <p className="label-caps text-[0.5625rem]">{p.label}</p>
                    <p className="text-numeric mt-0.5 text-sm text-foreground">{p.value}</p>
                  </div>
                ))}
              </div>

              <div className="pointer-events-none absolute top-4 right-4 space-y-2">
                {livePanels.slice(3).map((p) => (
                  <div
                    key={p.label}
                    className="panel-quiet w-36 bg-background/70 px-3 py-2 backdrop-blur-md"
                  >
                    <p className="label-caps text-[0.5625rem]">{p.label}</p>
                    <p className="text-numeric mt-0.5 text-sm text-foreground">{p.value}</p>
                  </div>
                ))}
              </div>

              {(searching || stage > 0) && (
                <ul className="pointer-events-none absolute bottom-4 left-4 space-y-1.5">
                  {SEARCH_STAGES.map((s, i) => (
                    <li
                      key={s.key}
                      className="flex items-center gap-2 text-[0.6875rem] text-muted-foreground"
                    >
                      {stage > i ? (
                        <Check className="size-3 text-success" strokeWidth={2.2} />
                      ) : stage === i && searching ? (
                        <Loader2 className="size-3 animate-spin text-primary" />
                      ) : (
                        <span className="size-1 rounded-full bg-border-strong" />
                      )}
                      <span className={stage > i ? "text-foreground" : undefined}>{s.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>

          {result && (
            <Panel className="rise-in">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-display text-lg text-foreground">
                    {formatNumber(result.discovered)} businesses discovered.
                  </p>
                  <p className="mt-1 text-sm text-primary">
                    {formatNumber(result.highOpportunity)} high-opportunity leads.
                  </p>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{result.exceptional} excepcionais</span>
                  <span>{result.good} bons</span>
                  <span>{result.medium} médios</span>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                  <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
                    {f.label}
                  </Chip>
                ))}
              </div>

              <div className="overflow-hidden rounded-xl border border-border">
                {visible.length === 0 ? (
                  <p className="px-4 py-10 text-center text-xs text-muted-foreground">
                    Nenhum lead neste filtro.
                  </p>
                ) : (
                  visible.map((lead) => <LeadRow key={lead.id} lead={lead} />)
                )}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </AppShell>
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

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="focus-ring flex w-full items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:border-border-strong"
    >
      <span className={checked ? "text-foreground" : undefined}>{label}</span>
      <span
        className={`relative h-4 w-7 rounded-full transition-colors ${checked ? "bg-primary/70" : "bg-muted"}`}
      >
        <span
          className={`absolute top-0.5 size-3 rounded-full bg-foreground transition-all ${checked ? "left-3.5" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}
