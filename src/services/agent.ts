/**
 * LETITZ Agent — arquitetura baseada em ferramentas.
 * Nesta versão as execuções são SIMULADAS e sempre exigem confirmação do
 * usuário antes de alterar dados. Cada tool declara name/description/input/output.
 */

import { leads, type Lead } from "@/lib/demo-data";

export type AgentToolName =
  | "searchProspects"
  | "analyzeWebsite"
  | "scoreLead"
  | "createLead"
  | "updateLead"
  | "createCampaign"
  | "generateMessage"
  | "createFollowUp"
  | "analyzeConversation"
  | "createSale"
  | "generateReport";

export interface AgentTool {
  name: AgentToolName;
  description: string;
  input: string;
  output: string;
}

export const AGENT_TOOLS: AgentTool[] = [
  { name: "searchProspects", description: "Descobre empresas por segmento e localização", input: "segment, location, quantity", output: "lista de prospects" },
  { name: "analyzeWebsite", description: "Avalia a presença e a saúde do site", input: "website", output: "status, score, findings" },
  { name: "scoreLead", description: "Calcula o score interno do lead", input: "sinais do negócio", output: "score 0-100 + fatores" },
  { name: "createLead", description: "Cria um lead no CRM", input: "dados do negócio", output: "lead" },
  { name: "updateLead", description: "Atualiza status ou dados do lead", input: "lead_id, campos", output: "lead" },
  { name: "createCampaign", description: "Monta uma campanha para um público", input: "filtros, mensagem", output: "campanha" },
  { name: "generateMessage", description: "Escreve a abordagem personalizada", input: "lead, tom", output: "mensagem" },
  { name: "createFollowUp", description: "Agenda um follow-up", input: "lead_id, data, motivo", output: "follow-up" },
  { name: "analyzeConversation", description: "Analisa conversas e aponta melhorias", input: "conversation_ids", output: "insights" },
  { name: "createSale", description: "Registra uma venda", input: "lead_id, serviço, valor", output: "venda" },
  { name: "generateReport", description: "Gera relatório de desempenho", input: "período", output: "relatório" },
];

export type AgentActionStatus = "pending" | "running" | "awaiting_confirmation" | "done" | "failed";

export interface AgentAction {
  id: string;
  workspace_id: string;
  tool: AgentToolName;
  status: AgentActionStatus;
  input: Record<string, unknown>;
  output: string | null;
  created_at: string;
}

export interface AgentStep {
  label: string;
  tool: AgentToolName;
}

export interface AgentPlan {
  intent: string;
  reply: string;
  steps: AgentStep[];
  summary: string[];
  confirmation: { label: string; description: string } | null;
  leads: Lead[];
  simulated: true;
}

const byScore = [...leads].sort((a, b) => b.lead_score - a.lead_score);

/** Interpretador de intenção leve e local (sem chamada de modelo nesta versão). */
export function planFromPrompt(prompt: string): AgentPlan {
  const p = prompt.toLowerCase();

  if (/(follow|retom|lembr)/.test(p)) {
    return {
      intent: "follow_ups",
      reply: "Separei os leads que estão aguardando retorno.",
      steps: [
        { label: "Revisando conversas", tool: "analyzeConversation" },
        { label: "Priorizando por score", tool: "scoreLead" },
        { label: "Preparando follow-ups", tool: "createFollowUp" },
      ],
      summary: ["5 leads precisam de follow-up.", "2 estão com proposta enviada.", "3 responderam e ficaram sem retorno."],
      confirmation: { label: "Agendar follow-ups", description: "5 follow-ups prontos para serem agendados." },
      leads: byScore.slice(0, 5),
      simulated: true,
    };
  }

  if (/(vend|fatur|receita|relat)/.test(p)) {
    return {
      intent: "sales_report",
      reply: "Montei o resumo comercial do período.",
      steps: [
        { label: "Consolidando vendas", tool: "createSale" },
        { label: "Gerando relatório", tool: "generateReport" },
      ],
      summary: ["32 vendas registradas.", "R$ 28.800 em receita.", "Ticket médio de R$ 900."],
      confirmation: null,
      leads: [],
      simulated: true,
    };
  }

  if (/(campanh|abordagem|mensagem)/.test(p)) {
    return {
      intent: "campaign",
      reply: "Preparei uma campanha com o público mais aderente.",
      steps: [
        { label: "Selecionando público", tool: "searchProspects" },
        { label: "Escrevendo abordagem", tool: "generateMessage" },
        { label: "Montando campanha", tool: "createCampaign" },
      ],
      summary: ["104 leads no público.", "12 excepcionais, 58 bons, 34 médios.", "Mensagem com 4 variáveis personalizadas."],
      confirmation: { label: "Revisar campanha", description: "Campanha pronta para revisão — nada será enviado automaticamente." },
      leads: byScore.slice(0, 6),
      simulated: true,
    };
  }

  if (/(convers|inbox|resposta)/.test(p)) {
    return {
      intent: "conversations",
      reply: "Analisei as conversas mais recentes.",
      steps: [
        { label: "Lendo conversas", tool: "analyzeConversation" },
        { label: "Avaliando abordagem", tool: "generateReport" },
      ],
      summary: ["30 conversas analisadas.", "Tempo médio de resposta: 42 min.", "Disciplina de follow-up é o ponto mais fraco."],
      confirmation: null,
      leads: [],
      simulated: true,
    };
  }

  if (/(crm|adicion|melhores)/.test(p)) {
    const count = Number(p.match(/\b(\d{1,3})\b/)?.[1] ?? 10);
    return {
      intent: "add_to_crm",
      reply: "Selecionei os leads com maior score.",
      steps: [
        { label: "Ordenando por score", tool: "scoreLead" },
        { label: "Preparando registros", tool: "createLead" },
      ],
      summary: [`${count} leads prontos para serem adicionados.`, "Nenhum registro foi alterado ainda."],
      confirmation: { label: "Add to CRM", description: `${count} leads aguardando sua confirmação.` },
      leads: byScore.slice(0, Math.min(count, 12)),
      simulated: true,
    };
  }

  const count = Number(p.match(/\b(\d{1,3})\b/)?.[1] ?? 50);
  return {
    intent: "search",
    reply: "Vou procurar empresas com esse perfil.",
    steps: [
      { label: "Searching", tool: "searchProspects" },
      { label: "Scanning", tool: "analyzeWebsite" },
      { label: "Analyzing", tool: "analyzeWebsite" },
      { label: "Qualifying", tool: "scoreLead" },
    ],
    summary: [
      `Encontrei ${Math.min(count, 42)} empresas compatíveis.`,
      "12 são oportunidades excepcionais.",
      "18 são boas oportunidades.",
      "12 são oportunidades médias.",
    ],
    confirmation: { label: "Add to CRM", description: "Os melhores leads podem ser adicionados ao CRM." },
    leads: byScore.slice(0, 8),
    simulated: true,
  };
}

export const QUICK_ACTIONS = [
  { label: "Find leads", prompt: "Encontre 50 hamburguerias em Curitiba sem site." },
  { label: "Analyze opportunities", prompt: "Analise minhas melhores oportunidades." },
  { label: "Prepare campaign", prompt: "Prepare uma campanha para os leads sem site." },
  { label: "Follow-ups", prompt: "Quais leads precisam de follow-up?" },
  { label: "Analyze conversations", prompt: "Analise minhas últimas 30 conversas." },
  { label: "Sales report", prompt: "Quanto eu vendi este mês?" },
];
