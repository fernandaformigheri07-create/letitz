import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, isStepCount, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";

import type { Database, Json } from "@/integrations/supabase/types";
import { levelLabel } from "@/lib/agent-levels";

type SB = SupabaseClient<Database>;
const MODEL = "openai/gpt-6-astra";
const RUN_ID = "X-Lovable-AIG-Run-ID";

function userClient(token: string): SB {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        h.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

async function loadContext(sb: SB, threadId: string) {
  const [thread, knowledge, auths, actions, leadsCount, followUps] = await Promise.all([
    sb.from("agent_threads").select("context").eq("id", threadId).maybeSingle(),
    sb.from("knowledge_items").select("category,title,content,source").order("created_at"),
    sb
      .from("authorizations")
      .select("id,lead_id,level,scope,granted_at,leads(company_name,contact_name)")
      .is("revoked_at", null),
    sb
      .from("agent_actions")
      .select("id,tool,summary,status,authorization_level,result,error,lead_id,created_at")
      .order("created_at", { ascending: false })
      .limit(15),
    sb.from("leads").select("id", { count: "exact", head: true }),
    sb
      .from("follow_ups")
      .select("id,kind,reason,due_at,status,lead_id")
      .eq("status", "scheduled")
      .order("due_at")
      .limit(10),
  ]);
  return {
    context: (thread.data?.context ?? {}) as Record<string, unknown>,
    knowledge: knowledge.data ?? [],
    auths: auths.data ?? [],
    actions: actions.data ?? [],
    leadsCount: leadsCount.count ?? 0,
    followUps: followUps.data ?? [],
  };
}

function systemPrompt(ctx: Awaited<ReturnType<typeof loadContext>>) {
  const now = new Date().toISOString();
  const kn = ctx.knowledge.length
    ? ctx.knowledge
        .map((k) => `- [${k.category}${k.source === "learned" ? " · aprendido" : ""}] ${k.title}: ${k.content}`)
        .join("\n")
    : "(vazio — nenhuma informação do negócio foi configurada)";
  const auths = ctx.auths.length
    ? ctx.auths
        .map((a) => {
          const lead = a.leads as { company_name?: string; contact_name?: string | null } | null;
          return `- lead ${a.lead_id} (${lead?.contact_name ?? ""} ${lead?.company_name ?? ""}): até nível ${a.level} "${levelLabel(a.level)}" — escopo: ${a.scope}`;
        })
        .join("\n")
    : "(nenhuma)";
  const actions = ctx.actions.length
    ? ctx.actions
        .map((a) => `- ${a.id} ${a.tool} [${a.status}] ${a.summary}${a.error ? ` — erro: ${a.error}` : ""}`)
        .join("\n")
    : "(nenhuma)";

  return `Você é o LETITZ Agent, operador comercial inteligente de um único usuário. Responda sempre em português do Brasil, de forma curta, clara e progressiva (nunca despeje dezenas de itens; mostre no máximo ~8 e ofereça mais).

Data/hora atual (UTC): ${now}

## Regras invioláveis
1. NUNCA invente leads, contatos, empresas, conversas, mensagens enviadas, vendas, receita, preços ou resultados de pesquisa. Use somente dados retornados pelas ferramentas ou presentes neste contexto.
2. Diferencie explicitamente: **Confirmado** (dado do sistema), **Inferência**, **Sugestão**, **Preparado**, **Autorizado**, **Executado**, e **Informação ausente**. Quando faltar informação importante, pergunte.
3. Intenção ≠ autorização. Entender um comando não autoriza executá-lo.
4. Níveis: 1 pesquisar, 2 analisar, 3 organizar, 4 preparar mensagem, 5 iniciar conversa, 6 continuar conversa, 7 enviar proposta, 8 negociar, 9 tentar fechar. Níveis 1–4 são permitidos quando o próprio usuário pede. Níveis 5–9 exigem autorização explícita e específica para aquele lead.
5. Uma autorização de nível N cobre apenas os níveis até N, para aquele lead, no escopo declarado. NUNCA amplie autorização. "Pode conversar com Maria" = nível 5/6, NÃO inclui responder preço, desconto, proposta ou fechamento. Se o usuário acrescentar uma condição ("se demonstrar interesse me avisa"), registre-a no escopo.
6. Use grant_authorization SOMENTE quando a última mensagem do usuário concede a autorização de forma explícita; cite as palavras dele em user_quote.
7. Quando uma ação sair do escopo, pare e peça autorização (request_authorization), ex.: "Maria perguntou o preço. Posso responder?". Responder preço é nível 8 (negociar) salvo regra diferente no Business Knowledge.
8. Envio real só acontece por integração. WhatsApp NÃO está conectado: envios falham e você deve dizer isso claramente. Nunca finja sucesso.
9. Prospecção externa (Google Places) NÃO está conectada. Ao pedido de busca, interprete segmento/cidade/estado/critério/quantidade, chame search_prospects e informe que a fonte não está conectada. Você pode então procurar na base própria com query_leads.
10. "Me lembra" = lembrete (kind reminder). "Tenta novamente/faz daqui X" = execução agendada (kind execution), que ainda depende de autorização e integração.
11. Venda só é registrada com confirmação explícita do usuário: use propose_sale (cria ação aguardando autorização). "Gostei" = interesse; "Vou analisar" = consideração; "Quero contratar" = intenção de compra — nada disso é venda.
12. Qualificação: Exceptional, Good Opportunity, Medium, Low, Discarded. Mostre sinais e justificativa, não notas. Só afirme sinais realmente obtidos.
13. Interlocutor: aparentemente humano, responsável, decisor, funcionário, equipe, possível bot, possível automação, desconhecido — sempre com grau de confiança. "Digite 1 para vendas" → possível automação.
14. Aprendizado: quando o usuário responder uma regra de negócio (ex.: "só envie o vídeo após interesse", "desconto só se eu autorizar"), salve com save_knowledge.
15. Referências contextuais: "as 10 melhores", "essas", "essa", "ela" referem-se à seleção atual/último resultado abaixo. Use set_selection para manter a seleção atualizada. Se for ambíguo, pergunte.

## Contexto da operação (estado real)
Leads no CRM: ${ctx.leadsCount}
Seleção atual: ${JSON.stringify(ctx.context["selection"] ?? null)}
Lead ativo: ${JSON.stringify(ctx.context["active_lead"] ?? null)}
Último resultado: ${JSON.stringify(ctx.context["last_result"] ?? null)}

Autorizações vigentes:
${auths}

Ações recentes do Agent:
${actions}

Follow-ups agendados:
${ctx.followUps.map((f) => `- ${f.kind} ${f.due_at}: ${f.reason}`).join("\n") || "(nenhum)"}

## Business Knowledge
${kn}`;
}

export async function handleAgent(request: Request): Promise<Response> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Não autenticado" }, 401);
  const sb = userClient(token);
  const { data: userData, error: userErr } = await sb.auth.getUser(token);
  if (userErr || !userData.user) return json({ error: "Sessão inválida" }, 401);
  const userId = userData.user.id;

  const body = (await request.json()) as { threadId?: string; messages?: UIMessage[] };
  const threadId = body.threadId;
  const messages = body.messages ?? [];
  if (!threadId || !Array.isArray(messages)) return json({ error: "Requisição inválida" }, 400);

  const { data: thread } = await sb.from("agent_threads").select("id,title,context").eq("id", threadId).maybeSingle();
  if (!thread) return json({ error: "Operação não encontrada" }, 404);

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return json({ error: "Modelo de IA não configurado" }, 500);

  const ctx = await loadContext(sb, threadId);
  let threadContext: Record<string, unknown> = { ...ctx.context };

  const saveContext = async (patch: Record<string, unknown>) => {
    threadContext = { ...threadContext, ...patch };
    await sb
      .from("agent_threads")
      .update({ context: threadContext as Json, updated_at: new Date().toISOString() })
      .eq("id", threadId);
  };
  const audit = (event: string, extra: Partial<Database["public"]["Tables"]["agent_audit_log"]["Insert"]> = {}) =>
    sb.from("agent_audit_log").insert({ user_id: userId, thread_id: threadId, event, ...extra });

  const createAction = async (a: {
    tool: string;
    summary: string;
    input: unknown;
    level: number;
    status: string;
    lead_id?: string | null;
    intent?: string;
    result?: string | null;
    error?: string | null;
  }) => {
    const { data, error } = await sb
      .from("agent_actions")
      .insert({
        user_id: userId,
        thread_id: threadId,
        tool: a.tool,
        summary: a.summary,
        input: a.input as Json,
        authorization_level: a.level,
        status: a.status,
        lead_id: a.lead_id ?? null,
        intent: a.intent ?? null,
        result: a.result ?? null,
        error: a.error ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await audit(`action.${a.status}`, {
      action_id: data.id,
      intent: a.intent ?? a.tool,
      detail: a.summary,
      status: a.status,
      error: a.error ?? null,
      authorized_by: a.status === "awaiting_authorization" ? null : "comando do usuário",
    });
    return data.id;
  };

  const authorizedLevel = async (leadId: string) => {
    const { data } = await sb
      .from("authorizations")
      .select("level,scope")
      .eq("lead_id", leadId)
      .is("revoked_at", null)
      .order("level", { ascending: false })
      .limit(1);
    return data?.[0] ?? null;
  };

  const leadCols =
    "id,company_name,segment,city,state,website,whatsapp,phone,contact_name,contact_role,lead_quality,lead_score,signals,justification,status";

  const tools = {
    query_leads: tool({
      description:
        "Consulta leads reais do CRM. Use para listar, filtrar, pegar 'as N melhores', ou localizar um contato por nome. O resultado vira o 'último resultado' do contexto.",
      inputSchema: z.object({
        search: z.string().nullable().describe("Texto livre: nome da empresa ou do contato"),
        city: z.string().nullable(),
        segment: z.string().nullable(),
        qualities: z.array(z.enum(["exceptional", "good", "medium", "low", "discarded"])).nullable(),
        without_website: z.boolean().nullable(),
        status: z.string().nullable(),
        lead_ids: z.array(z.string()).nullable().describe("Restringe a estes ids (ex.: seleção atual)"),
        limit: z.number().int().min(1).max(50),
      }),
      execute: async (i) => {
        let q = sb.from("leads").select(leadCols).order("lead_score", { ascending: false }).limit(i.limit);
        if (i.search) q = q.or(`company_name.ilike.%${i.search}%,contact_name.ilike.%${i.search}%`);
        if (i.city) q = q.ilike("city", `%${i.city}%`);
        if (i.segment) q = q.ilike("segment", `%${i.segment}%`);
        if (i.qualities?.length) q = q.in("lead_quality", i.qualities);
        if (i.without_website) q = q.is("website", null);
        if (i.status) q = q.eq("status", i.status);
        if (i.lead_ids?.length) q = q.in("id", i.lead_ids);
        const { data, error } = await q;
        if (error) return { ok: false, error: error.message };
        const leads = data ?? [];
        await saveContext({ last_result: { label: "consulta de leads", lead_ids: leads.map((l) => l.id) } });
        return { ok: true, count: leads.length, leads };
      },
    }),

    set_selection: tool({
      description:
        "Define a seleção atual (ex.: 'as 10 melhores', 'essas') e/ou o lead ativo ('essa', 'ela'). Use sempre que o usuário restringir ou apontar entidades.",
      inputSchema: z.object({
        label: z.string(),
        lead_ids: z.array(z.string()),
        active_lead_id: z.string().nullable(),
      }),
      execute: async (i) => {
        let active: unknown = threadContext["active_lead"] ?? null;
        if (i.active_lead_id) {
          const { data } = await sb
            .from("leads")
            .select("id,company_name,contact_name")
            .eq("id", i.active_lead_id)
            .maybeSingle();
          active = data;
        }
        await saveContext({ selection: { label: i.label, lead_ids: i.lead_ids }, active_lead: active });
        return { ok: true, selection_count: i.lead_ids.length, active_lead: active };
      },
    }),

    search_prospects: tool({
      description:
        "Interpreta e registra um pedido de prospecção externa (segmento, local, critérios, quantidade). A fonte externa não está conectada: nunca retorna empresas inventadas.",
      inputSchema: z.object({
        segment: z.string(),
        country: z.string().nullable(),
        state: z.string().nullable(),
        city: z.string().nullable(),
        region: z.string().nullable(),
        criteria: z.array(z.string()),
        quantity: z.number().int().min(1).max(200),
      }),
      execute: async (i) => {
        const reason = "Fonte de prospecção (Google Places) ainda não está conectada.";
        const id = await createAction({
          tool: "search_prospects",
          intent: "pesquisar",
          summary: `Buscar ${i.quantity} ${i.segment}${i.city ? ` em ${i.city}` : ""}${i.criteria.length ? ` (${i.criteria.join(", ")})` : ""}`,
          input: i,
          level: 1,
          status: "failed",
          error: reason,
        });
        await saveContext({ last_search: i });
        return { ok: false, action_id: id, status: "failed", interpreted: i, reason, results: [] };
      },
    }),

    create_leads: tool({
      description:
        "Adiciona ao CRM empresas cujos dados foram fornecidos pelo usuário nesta conversa. Nunca invente campos: deixe null o que não foi informado.",
      inputSchema: z.object({
        leads: z
          .array(
            z.object({
              company_name: z.string(),
              contact_name: z.string().nullable(),
              segment: z.string().nullable(),
              city: z.string().nullable(),
              state: z.string().nullable(),
              whatsapp: z.string().nullable(),
              phone: z.string().nullable(),
              website: z.string().nullable(),
              notes: z.string().nullable(),
            }),
          )
          .min(1)
          .max(50),
      }),
      execute: async (i) => {
        const rows = i.leads.map((l) => {
          const signals: string[] = [];
          if (!l.website) signals.push("Sem site informado");
          if (l.whatsapp) signals.push("WhatsApp disponível");
          return {
            ...l,
            user_id: userId,
            source: "agent",
            signals: signals as unknown as Json,
            justification: signals.join(" + ") || null,
            lead_quality: "medium",
            lead_score: 50,
          };
        });
        const { data, error } = await sb.from("leads").insert(rows).select("id,company_name,contact_name");
        if (error) return { ok: false, error: error.message };
        const ids = (data ?? []).map((d) => d.id);
        await createAction({
          tool: "create_leads",
          intent: "organizar",
          summary: `${ids.length} lead(s) adicionados ao CRM`,
          input: i,
          level: 3,
          status: "completed",
          result: ids.join(","),
        });
        await saveContext({ selection: { label: "leads adicionados", lead_ids: ids }, last_result: { label: "leads adicionados", lead_ids: ids } });
        return { ok: true, created: data };
      },
    }),

    update_leads: tool({
      description: "Organiza leads existentes: muda status (new, contacted, interested, negotiating, won, lost) e/ou qualificação.",
      inputSchema: z.object({
        lead_ids: z.array(z.string()).min(1),
        status: z.string().nullable(),
        lead_quality: z.enum(["exceptional", "good", "medium", "low", "discarded"]).nullable(),
      }),
      execute: async (i) => {
        const patch: Record<string, string> = { updated_at: new Date().toISOString() };
        if (i.status) patch["status"] = i.status;
        if (i.lead_quality) patch["lead_quality"] = i.lead_quality;
        const { error } = await sb.from("leads").update(patch as never).in("id", i.lead_ids);
        if (error) return { ok: false, error: error.message };
        await createAction({ tool: "update_leads", intent: "organizar", summary: `${i.lead_ids.length} lead(s) atualizados`, input: i, level: 3, status: "completed" });
        return { ok: true };
      },
    }),

    create_opportunity: tool({
      description: "Registra uma oportunidade quando há sinal real de interesse, com o sinal observado e o próximo passo.",
      inputSchema: z.object({
        lead_id: z.string(),
        title: z.string(),
        stage: z.enum(["interest", "consideration", "purchase_intent", "proposal", "negotiation"]),
        signal: z.string().describe("O que foi realmente observado"),
        next_step: z.string().nullable(),
      }),
      execute: async (i) => {
        const { data, error } = await sb.from("opportunities").insert({ ...i, user_id: userId }).select("id").single();
        if (error) return { ok: false, error: error.message };
        await createAction({ tool: "create_opportunity", intent: "organizar", summary: i.title, input: i, level: 3, status: "completed", lead_id: i.lead_id });
        return { ok: true, id: data.id };
      },
    }),

    grant_authorization: tool({
      description:
        "Registra uma autorização concedida EXPLICITAMENTE pelo usuário na última mensagem, para um lead e nível específicos. Nunca amplie.",
      inputSchema: z.object({
        lead_id: z.string(),
        level: z.number().int().min(5).max(9),
        scope: z.string().describe("Escopo e condições, ex.: 'conversar; avisar se demonstrar interesse; sem negociar preço'"),
        user_quote: z.string(),
      }),
      execute: async (i) => {
        const { data, error } = await sb
          .from("authorizations")
          .insert({ user_id: userId, lead_id: i.lead_id, level: i.level, scope: i.scope })
          .select("id")
          .single();
        if (error) return { ok: false, error: error.message };
        await audit("authorization.granted", {
          intent: "autorizar",
          detail: `Nível ${i.level} (${levelLabel(i.level)}) — ${i.scope}`,
          authorized_by: `usuário: "${i.user_quote}"`,
          status: "completed",
        });
        return { ok: true, id: data.id, level: i.level, label: levelLabel(i.level) };
      },
    }),

    request_authorization: tool({
      description:
        "Pede autorização ao usuário para uma ação fora do escopo atual (ex.: responder preço, enviar proposta, negociar). Cria uma ação aguardando autorização; o usuário aprova na interface.",
      inputSchema: z.object({
        lead_id: z.string().nullable(),
        level: z.number().int().min(4).max(9),
        summary: z.string().describe("Pergunta curta: 'Maria perguntou o preço. Posso responder?'"),
        scope: z.string(),
      }),
      execute: async (i) => {
        const id = await createAction({
          tool: "request_authorization",
          intent: "autorizar",
          summary: i.summary,
          input: i,
          level: i.level,
          status: "awaiting_authorization",
          lead_id: i.lead_id,
        });
        return { ok: true, action_id: id, status: "awaiting_authorization" };
      },
    }),

    prepare_message: tool({
      description: "Prepara (não envia) uma mensagem personalizada para um lead, usando apenas Business Knowledge e dados reais.",
      inputSchema: z.object({ lead_id: z.string().nullable(), goal: z.string(), body: z.string() }),
      execute: async (i) => {
        const id = await createAction({
          tool: "prepare_message",
          intent: "preparar",
          summary: `Mensagem preparada: ${i.goal}`,
          input: i,
          level: 4,
          status: "completed",
          lead_id: i.lead_id,
          result: i.body,
        });
        return { ok: true, action_id: id, status: "prepared", body: i.body };
      },
    }),

    send_message: tool({
      description:
        "Solicita o envio de uma mensagem a um lead. Verifica autorização; sem autorização cria pedido. Com autorização tenta enviar pela integração (WhatsApp não conectado → falha real).",
      inputSchema: z.object({ lead_id: z.string(), body: z.string(), level: z.number().int().min(5).max(9) }),
      execute: async (i) => {
        const auth = await authorizedLevel(i.lead_id);
        if (!auth || auth.level < i.level) {
          const id = await createAction({
            tool: "send_message",
            intent: "enviar",
            summary: `Enviar mensagem (${levelLabel(i.level)})`,
            input: i,
            level: i.level,
            status: "awaiting_authorization",
            lead_id: i.lead_id,
          });
          return { ok: false, action_id: id, status: "awaiting_authorization", reason: "Sem autorização para este nível." };
        }
        const reason = "WhatsApp ainda não está conectado.";
        const id = await createAction({
          tool: "send_message",
          intent: "enviar",
          summary: "Envio de mensagem",
          input: i,
          level: i.level,
          status: "failed",
          lead_id: i.lead_id,
          error: reason,
        });
        return { ok: false, action_id: id, status: "failed", reason };
      },
    }),

    record_inbound_message: tool({
      description:
        "Registra uma mensagem recebida de um contato (quando o usuário a relata/cola) e classifica intenção e interlocutor com confiança.",
      inputSchema: z.object({
        lead_id: z.string(),
        body: z.string(),
        intents: z.array(z.string()).describe("interesse, dúvida, objeção, pedido de preço, pedido de material, rejeição, intenção de compra..."),
        interlocutor_type: z.string(),
        confidence: z.enum(["baixa", "média", "alta"]),
      }),
      execute: async (i) => {
        let { data: conv } = await sb.from("conversations").select("id").eq("lead_id", i.lead_id).limit(1).maybeSingle();
        if (!conv) {
          const res = await sb.from("conversations").insert({ user_id: userId, lead_id: i.lead_id }).select("id").single();
          conv = res.data;
        }
        if (!conv) return { ok: false, error: "Não foi possível registrar a conversa." };
        await sb.from("conversation_messages").insert({ user_id: userId, conversation_id: conv.id, direction: "inbound", body: i.body });
        await sb
          .from("conversations")
          .update({ last_intent: i.intents.join(", "), interlocutor_type: `${i.interlocutor_type} (confiança ${i.confidence})` })
          .eq("id", conv.id);
        const auth = await authorizedLevel(i.lead_id);
        return { ok: true, current_authorization: auth };
      },
    }),

    get_conversation: tool({
      description: "Lê as mensagens registradas de um lead para análise.",
      inputSchema: z.object({ lead_id: z.string() }),
      execute: async (i) => {
        const { data } = await sb
          .from("conversations")
          .select("id,channel,interlocutor_type,last_intent,conversation_messages(direction,body,delivery_status,created_at)")
          .eq("lead_id", i.lead_id);
        return { ok: true, conversations: data ?? [] };
      },
    }),

    create_follow_up: tool({
      description:
        "Cria follow-up estruturado. kind 'reminder' = só lembrar o usuário. kind 'execution' = executar a ação no horário (depende de autorização e integração).",
      inputSchema: z.object({
        lead_id: z.string().nullable(),
        kind: z.enum(["reminder", "execution"]),
        reason: z.string(),
        context: z.string().nullable(),
        action: z.string().nullable(),
        due_in_minutes: z.number().int().min(1).max(525600),
        required_level: z.number().int().min(1).max(9).nullable(),
      }),
      execute: async (i) => {
        const due = new Date(Date.now() + i.due_in_minutes * 60000).toISOString();
        let requires = false;
        if (i.kind === "execution" && i.lead_id && i.required_level && i.required_level >= 5) {
          const auth = await authorizedLevel(i.lead_id);
          requires = !auth || auth.level < i.required_level;
        }
        const { data, error } = await sb
          .from("follow_ups")
          .insert({
            user_id: userId,
            lead_id: i.lead_id,
            kind: i.kind,
            reason: i.reason,
            context: i.context,
            action: i.action,
            due_at: due,
            requires_authorization: requires,
          })
          .select("id,due_at")
          .single();
        if (error) return { ok: false, error: error.message };
        await createAction({
          tool: "create_follow_up",
          intent: i.kind === "reminder" ? "lembrar" : "acompanhar",
          summary: `${i.kind === "reminder" ? "Lembrete" : "Execução agendada"}: ${i.reason}`,
          input: i,
          level: i.kind === "reminder" ? 3 : (i.required_level ?? 3),
          status: "completed",
          lead_id: i.lead_id,
        });
        return {
          ok: true,
          id: data.id,
          due_at: data.due_at,
          requires_authorization: requires,
          note: i.kind === "execution" ? "Execução depende de autorização e da integração do WhatsApp (não conectada)." : "Lembrete apenas — nada será executado.",
        };
      },
    }),

    save_knowledge: tool({
      description: "Salva uma regra ou informação de negócio que o usuário ensinou nesta conversa no Business Knowledge.",
      inputSchema: z.object({
        category: z.enum(["negocio", "servicos", "precos", "diferenciais", "publico", "objecoes", "faq", "condicoes", "materiais", "regras", "mensagens"]),
        title: z.string(),
        content: z.string(),
      }),
      execute: async (i) => {
        const { error } = await sb.from("knowledge_items").insert({ ...i, user_id: userId, source: "learned" });
        if (error) return { ok: false, error: error.message };
        await audit("knowledge.learned", { detail: `${i.title}: ${i.content}`, authorized_by: "usuário (conversa)", status: "completed" });
        return { ok: true };
      },
    }),

    propose_sale: tool({
      description: "Propõe o registro de uma venda. Só é gravada depois que o usuário confirmar na interface.",
      inputSchema: z.object({
        lead_id: z.string().nullable(),
        client_name: z.string(),
        service: z.string().nullable(),
        value: z.number().min(0),
      }),
      execute: async (i) => {
        const id = await createAction({
          tool: "register_sale",
          intent: "fechar",
          summary: `Registrar venda: ${i.client_name} — R$ ${i.value.toLocaleString("pt-BR")}`,
          input: i,
          level: 9,
          status: "awaiting_authorization",
          lead_id: i.lead_id,
        });
        return { ok: true, action_id: id, status: "awaiting_authorization" };
      },
    }),
  };

  // Título da operação a partir do primeiro pedido
  if (thread.title === "Nova operação") {
    const first = messages.find((m) => m.role === "user");
    const text = first?.parts.find((p) => p.type === "text") as { text?: string } | undefined;
    if (text?.text) await sb.from("agent_threads").update({ title: text.text.slice(0, 60) }).eq("id", threadId);
  }

  let runId = request.headers.get(RUN_ID)?.trim() || undefined;
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(RUN_ID)) headers.set(RUN_ID, runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get(RUN_ID)?.trim() || undefined;
      return res;
    },
  });

  const result = streamText({
    model: provider.responses(MODEL),
    system: systemPrompt(ctx),
    messages: await convertToModelMessages(messages, { tools, ignoreIncompleteToolCalls: true }),
    tools,
    stopWhen: isStepCount(20),
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
    originalMessages: messages,
    onFinish: async ({ messages: all }) => {
      await sb.from("agent_messages").delete().eq("thread_id", threadId);
      if (all.length) {
        await sb.from("agent_messages").insert(
          all.map((m, idx) => ({
            user_id: userId,
            thread_id: threadId,
            role: m.role,
            parts: { id: m.id, parts: m.parts } as unknown as Json,
            created_at: new Date(Date.now() + idx).toISOString(),
          })),
        );
      }
      await sb.from("agent_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
    },
    onError: (err) => {
      console.error("agent stream error", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (/402|credit/i.test(msg)) return "Créditos de IA insuficientes para continuar.";
      if (/429/.test(msg)) return "Muitas solicitações no momento. Tente novamente em instantes.";
      return "O Agent não conseguiu concluir esta resposta.";
    },
  });
}
