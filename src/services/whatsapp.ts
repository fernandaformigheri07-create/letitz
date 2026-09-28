/**
 * WhatsApp module — arquitetura preparada para a WhatsApp Business Platform
 * oficial. Nenhum scraping ou automação não oficial é usada.
 */

export type WhatsAppConnectionStatus = "not_connected" | "pending" | "connected";

export interface WhatsAppConnection {
  status: WhatsAppConnectionStatus;
  displayName: string | null;
  phoneNumber: string | null;
  provider: "whatsapp_business_platform";
}

export const whatsappConnection: WhatsAppConnection = {
  status: "not_connected",
  displayName: null,
  phoneNumber: null,
  provider: "whatsapp_business_platform",
};

export interface MessageTemplate {
  id: string;
  name: string;
  category: "prospecção" | "follow-up" | "proposta";
  body: string;
  variables: string[];
}

export const templates: MessageTemplate[] = [
  {
    id: "tpl_1",
    name: "Primeiro contato — sem site",
    category: "prospecção",
    body: "Olá [NOME], vi a [EMPRESA] em [CIDADE] e notei que ainda não tem site. Posso te mostrar como isso muda o volume de pedidos?",
    variables: ["[NOME]", "[EMPRESA]", "[CIDADE]"],
  },
  {
    id: "tpl_2",
    name: "Follow-up 48h",
    category: "follow-up",
    body: "Oi [NOME], passando para saber se faz sentido avançarmos com a proposta para a [EMPRESA].",
    variables: ["[NOME]", "[EMPRESA]"],
  },
  {
    id: "tpl_3",
    name: "Proposta enviada",
    category: "proposta",
    body: "[NOME], enviei a proposta para [SEGMENTO] com duas opções de escopo. Qualquer dúvida me chama por aqui.",
    variables: ["[NOME]", "[SEGMENTO]"],
  },
];

/** Placeholder — conexão real via WhatsApp Business Platform futuramente. */
export async function connectWhatsApp(): Promise<{ ok: false; reason: string }> {
  return { ok: false, reason: "Integração oficial do WhatsApp Business ainda não configurada." };
}

export function renderTemplate(body: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce((out, [key, value]) => out.split(key).join(value), body);
}
