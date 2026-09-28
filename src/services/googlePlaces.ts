/**
 * Mock Google Places service.
 * Interface estável: quando a integração real for ligada, apenas a
 * implementação muda (via server function + secret), não os consumidores.
 */

import { calculateLeadScore, type WebsiteStatus } from "@/lib/scoring";
import { leads, type Lead } from "@/lib/demo-data";

export interface SearchQuery {
  segment: string;
  location: string;
  quantity: number;
  onlyWithoutWebsite?: boolean;
  onlyWithWhatsapp?: boolean;
}

export interface SearchStage {
  key: string;
  label: string;
  durationMs: number;
}

export const SEARCH_STAGES: SearchStage[] = [
  { key: "places", label: "Searching Google Places", durationMs: 1400 },
  { key: "websites", label: "Scanning websites", durationMs: 1600 },
  { key: "presence", label: "Checking online presence", durationMs: 1300 },
  { key: "qualify", label: "Qualifying businesses", durationMs: 1500 },
  { key: "score", label: "Scoring opportunities", durationMs: 1200 },
];

export interface SearchResult {
  discovered: number;
  analyzed: number;
  highOpportunity: number;
  exceptional: number;
  good: number;
  medium: number;
  leads: Lead[];
  simulated: true;
}

/** Simulação — nenhuma API externa é consultada nesta versão. */
export async function searchProspects(query: SearchQuery): Promise<SearchResult> {
  const pool = leads.filter((l) => {
    if (query.onlyWithoutWebsite && l.website !== null) return false;
    if (query.onlyWithWhatsapp && !l.whatsapp) return false;
    const loc = query.location.trim().toLowerCase();
    if (loc.length > 2 && !`${l.city} ${l.state} ${l.country}`.toLowerCase().includes(loc.split(",")[0]!.trim()))
      return false;
    return true;
  });

  const selected = (pool.length ? pool : leads).slice(0, Math.max(6, Math.min(query.quantity, 50)));
  const exceptional = selected.filter((l) => l.lead_quality === "exceptional").length;
  const good = selected.filter((l) => l.lead_quality === "good").length;
  const medium = selected.filter((l) => l.lead_quality === "medium").length;

  return {
    discovered: 127,
    analyzed: 94,
    highOpportunity: exceptional + good,
    exceptional,
    good,
    medium,
    leads: selected,
    simulated: true,
  };
}

export interface WebsiteAnalysis {
  status: WebsiteStatus;
  score: number | null;
  findings: string[];
  simulated: true;
}

/** Mock — a análise real (crawl + lighthouse) será feita no backend. */
export async function analyzeWebsite(lead: Lead): Promise<WebsiteAnalysis> {
  const findings =
    lead.website === null
      ? ["Nenhum site encontrado para o negócio", "Presença dependente apenas de redes sociais"]
      : [
          `Status técnico: ${lead.website_status}`,
          `Qualidade estimada: ${lead.website_score ?? "-"} / 100`,
          "Sem chamada para ação clara acima da dobra",
        ];

  return { status: lead.website_status, score: lead.website_score, findings, simulated: true };
}

export function scoreLead(lead: Lead) {
  return calculateLeadScore({
    websiteStatus: lead.website_status,
    websiteScore: lead.website_score,
    whatsapp: Boolean(lead.whatsapp),
    instagram: Boolean(lead.instagram),
    reviewCount: lead.review_count,
    googleRating: lead.google_rating,
    commercialPresence: 72,
    segmentFit: 80,
  });
}

/** Coordenada aproximada para o globo. Representação visual, não navegação. */
export function resolveLocation(location: string): { lat: number; lng: number; label: string } {
  const key = location.trim().toLowerCase();
  const table: Array<[string, number, number, string]> = [
    ["curitiba", -25.43, -49.27, "Curitiba, PR"],
    ["são paulo", -23.55, -46.63, "São Paulo, SP"],
    ["sao paulo", -23.55, -46.63, "São Paulo, SP"],
    ["porto alegre", -30.03, -51.23, "Porto Alegre, RS"],
    ["florianópolis", -27.59, -48.55, "Florianópolis, SC"],
    ["belo horizonte", -19.92, -43.94, "Belo Horizonte, MG"],
    ["rio de janeiro", -22.91, -43.17, "Rio de Janeiro, RJ"],
    ["brasil", -14.24, -51.93, "Brasil"],
    ["portugal", 39.4, -8.22, "Portugal"],
    ["lisboa", 38.72, -9.14, "Lisboa"],
    ["miami", 25.76, -80.19, "Miami, FL"],
  ];
  for (const [needle, lat, lng, label] of table) {
    if (key.includes(needle)) return { lat, lng, label };
  }
  return { lat: -14.24, lng: -51.93, label: location.trim() || "Brasil" };
}
