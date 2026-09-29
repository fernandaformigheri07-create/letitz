/** Email service placeholder — envio real será feito no backend. */

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
}

export const emailConnection = {
  status: "not_connected" as "not_connected" | "connected",
  provider: "transactional_email",
};

export async function sendEmail(_draft: EmailDraft): Promise<{ ok: false; reason: string }> {
  return { ok: false, reason: "Envio de e-mail não habilitado nesta versão." };
}
