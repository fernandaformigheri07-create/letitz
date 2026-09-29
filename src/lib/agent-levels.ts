/** Níveis de autorização do Agent. Compartilhado entre cliente e servidor. */
export const AUTH_LEVELS = [
  { level: 1, key: "search", label: "Pesquisar" },
  { level: 2, key: "analyze", label: "Analisar" },
  { level: 3, key: "organize", label: "Organizar" },
  { level: 4, key: "prepare", label: "Preparar mensagem" },
  { level: 5, key: "start_conversation", label: "Iniciar conversa" },
  { level: 6, key: "continue_conversation", label: "Continuar conversa" },
  { level: 7, key: "send_proposal", label: "Enviar proposta" },
  { level: 8, key: "negotiate", label: "Negociar" },
  { level: 9, key: "close", label: "Tentar fechar" },
] as const;

export function levelLabel(level: number) {
  return AUTH_LEVELS.find((l) => l.level === level)?.label ?? `Nível ${level}`;
}

export type ActionStatus =
  | "preparing"
  | "awaiting_authorization"
  | "executing"
  | "completed"
  | "failed"
  | "denied";

export const ACTION_STATUS_LABEL: Record<ActionStatus, string> = {
  preparing: "Preparando",
  awaiting_authorization: "Aguardando autorização",
  executing: "Executando",
  completed: "Concluída",
  failed: "Falhou",
  denied: "Não autorizada",
};

export const AUTOPILOT_PERMISSIONS = [
  { key: "search", label: "Pesquisar" },
  { key: "analyze", label: "Analisar" },
  { key: "notify", label: "Notificar" },
  { key: "prepare", label: "Preparar mensagens" },
  { key: "follow_up", label: "Criar follow-ups" },
  { key: "send", label: "Enviar mensagens" },
  { key: "negotiate", label: "Negociar" },
  { key: "close", label: "Fechar" },
] as const;

/** Estado real das integrações. Nada é simulado. */
export const INTEGRATIONS = [
  { key: "whatsapp", label: "WhatsApp Business Platform", connected: false },
  { key: "places", label: "Google Places (prospecção)", connected: false },
  { key: "website", label: "Análise de websites", connected: false },
  { key: "email", label: "E-mail", connected: false },
  { key: "calendar", label: "Calendário", connected: false },
  { key: "sheets", label: "Planilhas", connected: false },
  { key: "storage", label: "Armazenamento de materiais", connected: false },
  { key: "ai", label: "Modelo de IA do Agent", connected: true },
] as const;
