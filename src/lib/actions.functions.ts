import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Aprova ou nega uma ação do Agent. Execução real respeita integrações — nunca finge sucesso. */
export const resolveAgentAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), approve: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase: sb, userId } = context;
    const { data: action, error } = await sb.from("agent_actions").select("*").eq("id", data.id).maybeSingle();
    if (error || !action) throw new Error("Ação não encontrada");
    if (action.status !== "awaiting_authorization") return { status: action.status };

    const now = new Date().toISOString();
    const log = (event: string, status: string, detail?: string | null, err?: string | null) =>
      sb.from("agent_audit_log").insert({
        user_id: userId,
        thread_id: action.thread_id,
        action_id: action.id,
        intent: action.intent,
        event,
        detail: detail ?? action.summary,
        authorized_by: data.approve ? "usuário (aprovação na interface)" : null,
        status,
        error: err ?? null,
      });

    if (!data.approve) {
      await sb.from("agent_actions").update({ status: "denied", error: "Não autorizado pelo usuário", updated_at: now }).eq("id", action.id);
      await log("action.denied", "denied");
      return { status: "denied" };
    }

    await sb.from("agent_actions").update({ status: "executing", updated_at: now }).eq("id", action.id);
    await log("action.authorized", "executing");

    const input = (action.input ?? {}) as Record<string, unknown>;
    let status = "completed";
    let result: string | null = null;
    let err: string | null = null;

    if (action.tool === "send_message") {
      status = "failed";
      err = "Não foi possível enviar. WhatsApp ainda não está conectado.";
    } else if (action.tool === "register_sale") {
      const { error: e } = await sb.from("sales").insert({
        user_id: userId,
        lead_id: (input["lead_id"] as string | null) ?? null,
        client_name: String(input["client_name"] ?? ""),
        service: (input["service"] as string | null) ?? null,
        value: Number(input["value"] ?? 0),
        confirmed_by_user: true,
      });
      if (e) {
        status = "failed";
        err = e.message;
      } else result = "Venda registrada após confirmação do usuário.";
    } else if (action.tool === "request_authorization") {
      if (action.lead_id) {
        await sb.from("authorizations").insert({
          user_id: userId,
          lead_id: action.lead_id,
          level: action.authorization_level,
          scope: String(input["scope"] ?? action.summary),
        });
      }
      result = "Autorização concedida para este escopo.";
    }

    await sb.from("agent_actions").update({ status, result, error: err, updated_at: new Date().toISOString() }).eq("id", action.id);
    await log(`action.${status}`, status, result, err);
    return { status, error: err };
  });
