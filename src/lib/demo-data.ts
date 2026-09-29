/**
 * DEMO DATA — dados fictícios estruturados para serem substituídos por dados
 * reais (Supabase / Google Places / WhatsApp Business Platform) no futuro.
 * Nada aqui representa empresas reais.
 */

import {
  calculateLeadScore,
  qualityFromScore,
  type LeadQuality,
  type WebsiteStatus,
} from "./scoring";

export const WORKSPACE_ID = "ws_demo_letitz";

export type LeadStatus =
  | "new"
  | "qualified"
  | "contacted"
  | "replied"
  | "followup"
  | "proposal"
  | "won"
  | "lost";

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "Novo",
  qualified: "Qualificado",
  contacted: "Contatado",
  replied: "Respondeu",
  followup: "Follow-up",
  proposal: "Proposta",
  won: "Ganho",
  lost: "Perdido",
};

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "new",
  "qualified",
  "contacted",
  "replied",
  "followup",
  "proposal",
  "won",
  "lost",
];

export interface Lead {
  id: string;
  workspace_id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  city: string;
  state: string;
  country: string;
  segment: string;
  google_place_id: string;
  website_status: WebsiteStatus;
  website_score: number | null;
  lead_score: number;
  lead_quality: LeadQuality;
  lead_status: LeadStatus;
  google_rating: number | null;
  review_count: number;
  reasons: string[];
  notes: string;
  source: string;
  created_at: string;
  updated_at: string;
  last_contact_at: string | null;
  next_followup_at: string | null;
  lat: number;
  lng: number;
}

interface CityDef {
  city: string;
  state: string;
  lat: number;
  lng: number;
}

const CITIES: CityDef[] = [
  { city: "Curitiba", state: "PR", lat: -25.43, lng: -49.27 },
  { city: "São Paulo", state: "SP", lat: -23.55, lng: -46.63 },
  { city: "Porto Alegre", state: "RS", lat: -30.03, lng: -51.23 },
  { city: "Florianópolis", state: "SC", lat: -27.59, lng: -48.55 },
  { city: "Belo Horizonte", state: "MG", lat: -19.92, lng: -43.94 },
  { city: "Rio de Janeiro", state: "RJ", lat: -22.91, lng: -43.17 },
];

const SEGMENTS = [
  "Hamburgueria",
  "Pizzaria",
  "Studio de estética",
  "Barbearia",
  "Petshop",
  "Academia",
  "Clínica odontológica",
  "Loja de móveis",
];

const PREFIX = [
  "Forno",
  "Brasa",
  "Nova",
  "Casa",
  "Bistrô",
  "Estúdio",
  "Ponto",
  "Vila",
  "Atelier",
  "Central",
];
const SUFFIX = [
  "Aurora",
  "Vértice",
  "Mirante",
  "Lumina",
  "Norte",
  "Alvorada",
  "Oriente",
  "Prisma",
  "Cedro",
  "Horizonte",
];
const FIRST = ["Marina", "Renato", "Camila", "Tiago", "Helena", "Bruno", "Laura", "Diego"];
const LAST = ["Vasques", "Andrade", "Moretti", "Salgado", "Ferraz", "Bueno", "Tavares"];

const WEBSITE_STATUSES: WebsiteStatus[] = [
  "none",
  "none",
  "offline",
  "outdated",
  "low_quality",
  "poor_mobile",
  "missing_cta",
  "slow",
  "healthy",
];

/** Deterministic pseudo-random so demo data is stable between renders/SSR. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function iso(daysAgo: number, hour = 10) {
  const base = Date.UTC(2026, 8, 28, hour, 0, 0);
  return new Date(base - daysAgo * 86400000).toISOString();
}

function buildLeads(): Lead[] {
  const rand = rng(42);
  const leads: Lead[] = [];

  for (let i = 0; i < 50; i++) {
    const place = CITIES[i % CITIES.length]!;
    const segment = SEGMENTS[Math.floor(rand() * SEGMENTS.length)]!;
    const company = `${PREFIX[Math.floor(rand() * PREFIX.length)]} ${SUFFIX[Math.floor(rand() * SUFFIX.length)]}`;
    const websiteStatus = WEBSITE_STATUSES[Math.floor(rand() * WEBSITE_STATUSES.length)]!;
    const hasWhatsapp = rand() > 0.18;
    const hasInstagram = rand() > 0.25;
    const reviewCount = Math.floor(rand() * 1400) + 6;
    const googleRating = Number((3.2 + rand() * 1.8).toFixed(1));
    const websiteScore = websiteStatus === "none" ? null : Math.floor(rand() * 70) + 12;

    const { score, quality, factors } = calculateLeadScore({
      websiteStatus,
      websiteScore,
      whatsapp: hasWhatsapp,
      instagram: hasInstagram,
      reviewCount,
      googleRating,
      commercialPresence: Math.floor(rand() * 60) + 40,
      segmentFit: Math.floor(rand() * 45) + 55,
    });

    const statusPool: LeadStatus[] =
      quality === "exceptional"
        ? ["qualified", "contacted", "replied", "proposal", "won", "followup"]
        : quality === "good"
          ? ["new", "qualified", "contacted", "followup", "replied"]
          : ["new", "new", "qualified", "lost"];
    const lead_status = statusPool[Math.floor(rand() * statusPool.length)]!;

    const slug = company.toLowerCase().replace(/[^a-z]+/g, "");
    const contact = `${FIRST[Math.floor(rand() * FIRST.length)]} ${LAST[Math.floor(rand() * LAST.length)]}`;
    const createdDays = Math.floor(rand() * 60);

    leads.push({
      id: `lead_${String(i + 1).padStart(3, "0")}`,
      workspace_id: WORKSPACE_ID,
      company_name: company,
      contact_name: contact,
      phone: `+55 ${41 + (i % 8)} 9${String(1000 + i).slice(0, 4)}-${String(2000 + i * 7).slice(0, 4)}`,
      whatsapp: hasWhatsapp
        ? `+55 ${41 + (i % 8)} 9${String(1000 + i).slice(0, 4)}-${String(2000 + i * 7).slice(0, 4)}`
        : null,
      email: rand() > 0.4 ? `contato@${slug}.demo` : null,
      website: websiteStatus === "none" ? null : `https://${slug}.demo`,
      instagram: hasInstagram ? `@${slug}` : null,
      city: place.city,
      state: place.state,
      country: "Brasil",
      segment,
      google_place_id: `demo_place_${i + 1}`,
      website_status: websiteStatus,
      website_score: websiteScore,
      lead_score: score,
      lead_quality: quality,
      lead_status,
      google_rating: googleRating,
      review_count: reviewCount,
      reasons: factors.filter((f) => f.points > 6).map((f) => f.detail),
      notes: "",
      source: "Lead Discovery (demo)",
      created_at: iso(createdDays),
      updated_at: iso(Math.max(0, createdDays - 3)),
      last_contact_at: ["contacted", "replied", "followup", "proposal", "won"].includes(lead_status)
        ? iso(Math.max(0, createdDays - 5))
        : null,
      next_followup_at: ["followup", "proposal"].includes(lead_status)
        ? iso(-Math.floor(rand() * 6) - 1)
        : null,
      lat: place.lat + (rand() - 0.5) * 0.9,
      lng: place.lng + (rand() - 0.5) * 0.9,
    });
  }

  return leads;
}

export const leads: Lead[] = buildLeads();

export function getLead(id: string): Lead | undefined {
  return leads.find((l) => l.id === id);
}

export const qualityCounts = leads.reduce<Record<LeadQuality, number>>(
  (acc, l) => {
    acc[l.lead_quality] += 1;
    return acc;
  },
  { exceptional: 0, good: 0, medium: 0, low: 0, discarded: 0 },
);

/* ---------- Overview metrics (DEMO) ---------- */

export const overviewMetrics = [
  { key: "captured", label: "Leads captados", value: 2847, delta: "+12,4%" },
  { key: "qualified", label: "Leads qualificados", value: 1126, delta: "+8,1%" },
  { key: "contacts", label: "Contatos", value: 743, delta: "+5,9%" },
  { key: "replies", label: "Respostas", value: 184, delta: "+3,2%" },
  { key: "clients", label: "Clientes", value: 18, delta: "+2" },
  { key: "revenue", label: "Faturamento", value: 21600, delta: "+9,7%", currency: true },
];

export const discoveryPanels = [
  { label: "Businesses found", value: 127 },
  { label: "Websites analyzed", value: 94 },
  { label: "High opportunity", value: 38 },
  { label: "Exceptional", value: 12 },
  { label: "Processing", value: 21 },
];

/* ---------- Campaigns ---------- */

export interface Campaign {
  id: string;
  workspace_id: string;
  name: string;
  channel: "whatsapp" | "email";
  status: "draft" | "review" | "scheduled" | "paused";
  audience: number;
  quality: { exceptional: number; good: number; medium: number };
  message: string;
  created_at: string;
}

export const campaigns: Campaign[] = [
  {
    id: "camp_001",
    workspace_id: WORKSPACE_ID,
    name: "Hamburguerias sem site — Curitiba",
    channel: "whatsapp",
    status: "review",
    audience: 104,
    quality: { exceptional: 12, good: 58, medium: 34 },
    message:
      "Olá [NOME], tudo bem? Vi a [EMPRESA] aqui em [CIDADE] e notei que o negócio não tem site próprio. Trabalho com [SEGMENTO] e consigo colocar uma página que converte em poucos dias. Posso te mostrar um exemplo?",
    created_at: iso(6),
  },
  {
    id: "camp_002",
    workspace_id: WORKSPACE_ID,
    name: "Studios de estética — site desatualizado",
    channel: "whatsapp",
    status: "draft",
    audience: 62,
    quality: { exceptional: 7, good: 31, medium: 24 },
    message:
      "Oi [NOME], passei pelo site da [EMPRESA] e ele está com uma estrutura antiga no celular. Posso te enviar um diagnóstico rápido?",
    created_at: iso(12),
  },
  {
    id: "camp_003",
    workspace_id: WORKSPACE_ID,
    name: "Pizzarias premium — São Paulo",
    channel: "email",
    status: "scheduled",
    audience: 143,
    quality: { exceptional: 18, good: 74, medium: 51 },
    message:
      "Olá [NOME], preparei uma análise da presença digital da [EMPRESA] em [CIDADE]. Vale 5 minutos da sua semana?",
    created_at: iso(20),
  },
];

/* ---------- Conversations ---------- */

export type ConversationTag = "unread" | "interested" | "followup" | "proposal" | "won" | "lost";

export interface ConversationMessage {
  id: string;
  from: "lead" | "me";
  body: string;
  at: string;
}

export interface Conversation {
  id: string;
  workspace_id: string;
  lead_id: string;
  channel: "whatsapp" | "email";
  tag: ConversationTag;
  unread: boolean;
  last_at: string;
  messages: ConversationMessage[];
}

function conversation(
  idx: number,
  leadId: string,
  tag: ConversationTag,
  unread: boolean,
  lines: Array<[ConversationMessage["from"], string]>,
): Conversation {
  return {
    id: `conv_${String(idx).padStart(3, "0")}`,
    workspace_id: WORKSPACE_ID,
    lead_id: leadId,
    channel: "whatsapp",
    tag,
    unread,
    last_at: iso(idx % 9, 9 + (idx % 8)),
    messages: lines.map(([from, body], i) => ({
      id: `msg_${idx}_${i}`,
      from,
      body,
      at: iso((idx % 9) + (lines.length - i) * 0.02, 9 + (idx % 8)),
    })),
  };
}

export const conversations: Conversation[] = [
  conversation(1, leads[0]!.id, "interested", true, [
    ["me", "Olá! Vi que a empresa aparece bem no Google mas não tem site. Posso te mostrar uma proposta?"],
    ["lead", "Oi, tudo bem? Tenho interesse sim, quanto fica?"],
  ]),
  conversation(2, leads[3]!.id, "proposal", false, [
    ["me", "Enviei a proposta com duas opções de escopo."],
    ["lead", "Recebi. Vou alinhar com meu sócio e te respondo amanhã."],
  ]),
  conversation(3, leads[7]!.id, "followup", true, [
    ["me", "Consegui reservar a agenda desta semana para o projeto."],
    ["lead", "Perfeito, me lembra na quinta."],
  ]),
  conversation(4, leads[11]!.id, "won", false, [
    ["me", "Fechado! Vou iniciar hoje mesmo."],
    ["lead", "Combinado, já fiz o pagamento da primeira parcela."],
  ]),
  conversation(5, leads[15]!.id, "lost", false, [
    ["me", "Posso te enviar um orçamento?"],
    ["lead", "Obrigado, mas acabamos fechando com outro fornecedor."],
  ]),
  conversation(6, leads[21]!.id, "interested", false, [
    ["me", "Notei que o site da empresa está fora do ar."],
    ["lead", "Sim, estamos sem ninguém cuidando disso. Me explica melhor?"],
  ]),
  conversation(7, leads[28]!.id, "followup", true, [
    ["me", "Bom dia! Retomando nossa conversa da semana passada."],
    ["lead", "Oi! Ainda estou avaliando."],
  ]),
  conversation(8, leads[33]!.id, "proposal", false, [
    ["me", "Segue a proposta revisada com o desconto combinado."],
    ["lead", "Ótimo, vou assinar."],
  ]),
];

export const conversationInsights = {
  analyzed: 30,
  avgResponseMinutes: 42,
  clarity: 78,
  objectionHandling: 64,
  followupDiscipline: 57,
  continuationProbability: 71,
  highlights: [
    "Abordagens com diagnóstico específico do site têm 2,1x mais respostas.",
    "Conversas sem follow-up em 48h perdem 38% do interesse inicial.",
    "Objeção mais frequente: preço sem contexto de retorno.",
  ],
};

/* ---------- Follow-ups ---------- */

export interface FollowUp {
  id: string;
  lead_id: string;
  due_at: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export const followUps: FollowUp[] = [
  { id: "fu_1", lead_id: leads[0]!.id, due_at: iso(-1), reason: "Respondeu e pediu preço", priority: "high" },
  { id: "fu_2", lead_id: leads[3]!.id, due_at: iso(-2), reason: "Proposta enviada sem retorno", priority: "high" },
  { id: "fu_3", lead_id: leads[7]!.id, due_at: iso(-3), reason: "Pediu lembrete na quinta", priority: "medium" },
  { id: "fu_4", lead_id: leads[28]!.id, due_at: iso(-4), reason: "Ainda avaliando", priority: "medium" },
  { id: "fu_5", lead_id: leads[21]!.id, due_at: iso(-6), reason: "Site fora do ar — urgência real", priority: "low" },
];

/* ---------- Sales ---------- */

export interface Sale {
  id: string;
  workspace_id: string;
  lead_id: string;
  client: string;
  service: string;
  value: number;
  date: string;
  payment: "pix" | "cartão" | "boleto";
  status: "paid" | "pending";
}

const SERVICES = ["Site institucional", "Landing page", "Site + tráfego", "Loja simples", "Redesign"];

export const sales: Sale[] = Array.from({ length: 32 }, (_, i) => {
  const rand = rng(1000 + i);
  const lead = leads[(i * 3) % leads.length]!;
  return {
    id: `sale_${String(i + 1).padStart(3, "0")}`,
    workspace_id: WORKSPACE_ID,
    lead_id: lead.id,
    client: lead.company_name,
    service: SERVICES[Math.floor(rand() * SERVICES.length)]!,
    value: [600, 750, 900, 1100, 1400][Math.floor(rand() * 5)]!,
    date: iso(Math.floor(rand() * 85)),
    payment: (["pix", "cartão", "boleto"] as const)[Math.floor(rand() * 3)]!,
    status: rand() > 0.28 ? "paid" : "pending",
  };
});

export const salesSummary = {
  count: sales.length,
  revenue: sales.reduce((s, x) => s + x.value, 0),
  paid: sales.filter((s) => s.status === "paid").reduce((s, x) => s + x.value, 0),
  pending: sales.filter((s) => s.status === "pending").reduce((s, x) => s + x.value, 0),
  averageTicket: Math.round(sales.reduce((s, x) => s + x.value, 0) / sales.length),
};

/* ---------- Analytics ---------- */

export type RangeKey = "today" | "7d" | "30d" | "90d" | "all";

export const analyticsRanges: Array<{ key: RangeKey; label: string }> = [
  { key: "today", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
  { key: "all", label: "Tudo" },
];

export interface AnalyticsSnapshot {
  captured: number;
  qualified: number;
  contacted: number;
  replies: number;
  proposals: number;
  won: number;
  conversion: number;
  revenue: number;
  series: number[];
}

export const analytics: Record<RangeKey, AnalyticsSnapshot> = {
  today: {
    captured: 86,
    qualified: 31,
    contacted: 19,
    replies: 6,
    proposals: 2,
    won: 1,
    conversion: 1.2,
    revenue: 900,
    series: [4, 8, 6, 11, 9, 14, 12, 18, 15, 21, 19, 24],
  },
  "7d": {
    captured: 512,
    qualified: 208,
    contacted: 141,
    replies: 38,
    proposals: 11,
    won: 4,
    conversion: 0.8,
    revenue: 3600,
    series: [22, 31, 28, 44, 39, 52, 47, 61, 58, 70, 66, 78],
  },
  "30d": {
    captured: 1482,
    qualified: 604,
    contacted: 398,
    replies: 97,
    proposals: 31,
    won: 12,
    conversion: 0.81,
    revenue: 11400,
    series: [58, 72, 66, 91, 84, 110, 102, 132, 124, 151, 143, 168],
  },
  "90d": {
    captured: 2847,
    qualified: 1126,
    contacted: 743,
    replies: 184,
    proposals: 58,
    won: 18,
    conversion: 0.63,
    revenue: 21600,
    series: [104, 128, 119, 162, 151, 194, 181, 232, 219, 268, 254, 296],
  },
  all: {
    captured: 4210,
    qualified: 1683,
    contacted: 1094,
    replies: 268,
    proposals: 84,
    won: 32,
    conversion: 0.76,
    revenue: 28800,
    series: [140, 178, 165, 224, 208, 266, 249, 318, 301, 366, 348, 404],
  },
};

/* ---------- Pipeline / activity ---------- */

export const pipeline = LEAD_STATUS_ORDER.filter((s) => s !== "lost").map((status) => ({
  status,
  label: LEAD_STATUS_LABEL[status],
  count: leads.filter((l) => l.lead_status === status).length,
}));

export interface ActivityEntry {
  id: string;
  at: string;
  title: string;
  detail: string;
  kind: "agent" | "lead" | "sale" | "campaign";
}

export const activity: ActivityEntry[] = [
  { id: "a1", at: iso(0, 21), title: "Agente concluiu uma busca", detail: "127 empresas descobertas em Curitiba", kind: "agent" },
  { id: "a2", at: iso(0, 18), title: "Lead respondeu", detail: `${leads[0]!.company_name} pediu orçamento`, kind: "lead" },
  { id: "a3", at: iso(1, 16), title: "Venda registrada", detail: "R$ 1.100 — Site institucional", kind: "sale" },
  { id: "a4", at: iso(1, 11), title: "Campanha em revisão", detail: "Hamburguerias sem site — Curitiba", kind: "campaign" },
  { id: "a5", at: iso(2, 9), title: "12 leads excepcionais qualificados", detail: "Score médio 91/100", kind: "agent" },
];

/* ---------- Formatting helpers ---------- */

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
