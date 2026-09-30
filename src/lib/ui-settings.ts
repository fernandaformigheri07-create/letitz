/**
 * Configuração de interface do workspace (persistida em workspace_settings.ui).
 * Fonte única para o Agent (inspeção/alteração) e para o cliente (aplicação via CSS vars).
 */
import { z } from "zod";

export const NAV_ITEMS = [
  { path: "/", label: "Command Center" },
  { path: "/agent", label: "Agent" },
  { path: "/prospects", label: "Prospect" },
  { path: "/leads", label: "Leads" },
  { path: "/campaigns", label: "Campaigns" },
  { path: "/opportunities", label: "Opportunities" },
  { path: "/sales", label: "Sales" },
  { path: "/knowledge", label: "Knowledge" },
  { path: "/settings", label: "Settings" },
] as const;
export type NavPath = (typeof NAV_ITEMS)[number]["path"];
export const NAV_PATHS = NAV_ITEMS.map((n) => n.path) as [NavPath, ...NavPath[]];

export const DASHBOARD_SECTIONS = [
  { id: "agent_prompt", label: "Campo do Agent" },
  { id: "metrics", label: "Métricas" },
  { id: "pending", label: "Decisões pendentes" },
  { id: "opportunities", label: "Oportunidades" },
  { id: "follow_ups", label: "Follow-ups" },
  { id: "sales", label: "Vendas" },
] as const;
export type SectionId = (typeof DASHBOARD_SECTIONS)[number]["id"];
export const SECTION_IDS = DASHBOARD_SECTIONS.map((s) => s.id) as [SectionId, ...SectionId[]];

export const METRIC_IDS = [
  "leads", "contacts", "companies", "conversations", "campaigns", "messages",
  "opportunities", "interested", "follow_ups", "sales", "revenue", "conversion",
] as const;
export type MetricId = (typeof METRIC_IDS)[number];

export const themeSchema = z.object({
  /** Matiz do acento principal (0-360). Azul ≈ 256, violeta ≈ 288. */
  accent_hue: z.number().min(0).max(360),
  /** Matiz do acento secundário. */
  accent2_hue: z.number().min(0).max(360),
  /** Saturação do acento (0.05 sóbrio – 0.26 vibrante). */
  accent_chroma: z.number().min(0.02).max(0.3),
  /** Luminosidade do fundo (0.08 quase preto – 0.26 grafite claro). */
  background_lightness: z.number().min(0.06).max(0.28),
  /** Matiz da base (fundo/superfícies). 265 = navy, 250 = azul-grafite, 285 = ameixa. */
  base_hue: z.number().min(0).max(360),
  /** Intensidade de brilho/profundidade (0 = nenhum, 1 = padrão, 2 = forte). */
  glow: z.number().min(0).max(2),
});

export const uiSchema = z.object({
  theme: themeSchema,
  /** Arredondamento global em rem (0 – 1.25). */
  radius: z.number().min(0).max(1.25),
  /** Escala global (0.85 compacto – 1.15 espaçoso). Afeta tipografia e espaçamentos. */
  scale: z.number().min(0.8).max(1.2),
  /** Largura da sidebar em rem (11 – 20). */
  sidebar_width: z.number().min(11).max(20),
  /** Densidade de tabelas/listas. */
  table_density: z.enum(["compact", "default", "comfortable"]),
  nav: z.object({
    labels: z.record(z.string(), z.string()),
    hidden: z.array(z.string()),
    order: z.array(z.string()),
  }),
  dashboard: z.object({
    hidden: z.array(z.string()),
    order: z.array(z.string()),
    hidden_metrics: z.array(z.string()),
  }),
  agent: z.object({
    /** Mostra o painel lateral de contexto na tela do Agent. */
    side_panel: z.boolean(),
    /** Largura máxima da conversa em rem (40 – 72). */
    chat_width: z.number().min(40).max(72),
  }),
});
export type UiSettings = z.infer<typeof uiSchema>;

export const DEFAULT_UI: UiSettings = {
  theme: {
    accent_hue: 256,
    accent2_hue: 288,
    accent_chroma: 0.185,
    background_lightness: 0.135,
    base_hue: 265,
    glow: 1,
  },
  radius: 0.75,
  scale: 1,
  sidebar_width: 15,
  table_density: "default",
  nav: { labels: {}, hidden: [], order: [] },
  dashboard: { hidden: [], order: [], hidden_metrics: [] },
  agent: { side_panel: true, chat_width: 48 },
};

type Plain = Record<string, unknown>;
const isObj = (v: unknown): v is Plain => typeof v === "object" && v !== null && !Array.isArray(v);

export function deepMerge<T>(base: T, patch: unknown): T {
  if (!isObj(base) || !isObj(patch)) return (patch === undefined ? base : (patch as T));
  const out: Plain = { ...(base as Plain) };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === null) continue;
    out[k] = isObj(v) && isObj(out[k]) ? deepMerge(out[k], v) : v;
  }
  return out as T;
}

/** Normaliza qualquer JSON salvo em uma configuração válida (campos inválidos voltam ao padrão). */
export function resolveUi(stored: unknown): UiSettings {
  const merged = deepMerge(DEFAULT_UI, stored ?? {});
  const parsed = uiSchema.safeParse(merged);
  return parsed.success ? parsed.data : DEFAULT_UI;
}

export function uiCssVars(ui: UiSettings): Record<string, string> {
  const t = ui.theme;
  return {
    "--accent-h": String(t.accent_hue),
    "--accent2-h": String(t.accent2_hue),
    "--accent-c": String(t.accent_chroma),
    "--bg-l": String(t.background_lightness),
    "--base-h": String(t.base_hue),
    "--glow": String(t.glow),
    "--radius": `${ui.radius}rem`,
    "--ui-scale": String(ui.scale),
    "--sidebar-w": `${ui.sidebar_width}rem`,
    "--row-py": ui.table_density === "compact" ? "0.4rem" : ui.table_density === "comfortable" ? "1rem" : "0.7rem",
    "--chat-w": `${ui.agent.chat_width}rem`,
  };
}

export function orderedNav(ui: UiSettings) {
  const order = ui.nav.order.filter((p) => NAV_PATHS.includes(p as NavPath));
  const rest = NAV_ITEMS.map((n) => n.path).filter((p) => !order.includes(p));
  return [...order, ...rest]
    .map((p) => NAV_ITEMS.find((n) => n.path === p)!)
    .filter((n) => !ui.nav.hidden.includes(n.path) || n.path === "/agent" || n.path === "/settings")
    .map((n) => ({ path: n.path, label: ui.nav.labels[n.path] || n.label }));
}

export function orderedSections(ui: UiSettings): SectionId[] {
  const order = ui.dashboard.order.filter((s) => SECTION_IDS.includes(s as SectionId)) as SectionId[];
  return [...order, ...SECTION_IDS.filter((s) => !order.includes(s))].filter((s) => !ui.dashboard.hidden.includes(s));
}
