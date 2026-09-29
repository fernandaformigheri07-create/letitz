import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowUp, Check, ChevronRight, Loader2, Sparkles, Square, X } from "lucide-react";

import { ActionCard } from "@/components/agent/ActionCard";
import { QualityBadge } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import type { LeadQuality } from "@/lib/scoring";
import { cn } from "@/lib/utils";

const TOOL_LABEL: Record<string, string> = {
  query_leads: "Consultando o CRM",
  set_selection: "Atualizando contexto",
  search_prospects: "Interpretando prospecção",
  create_leads: "Adicionando ao CRM",
  update_leads: "Organizando leads",
  create_opportunity: "Registrando oportunidade",
  grant_authorization: "Registrando autorização",
  request_authorization: "Pedindo autorização",
  prepare_message: "Preparando mensagem",
  send_message: "Envio de mensagem",
  record_inbound_message: "Registrando resposta do contato",
  get_conversation: "Lendo conversa",
  create_follow_up: "Criando follow-up",
  save_knowledge: "Aprendendo regra de negócio",
  propose_sale: "Propondo registro de venda",
};

export const SUGGESTIONS = [
  "Procure 30 hamburguerias em Porto Alegre sem site.",
  "Quais são meus 10 melhores leads?",
  "Quem demonstrou interesse?",
  "Me lembra daqui 3 horas de revisar as propostas.",
];

type ToolPart = {
  type: string;
  toolCallId: string;
  state: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  errorText?: string;
};

function ToolStep({ part }: { part: ToolPart }) {
  const name = part.type.replace(/^tool-/, "");
  const label = TOOL_LABEL[name] ?? name;
  const out = part.output ?? {};
  const running = part.state === "input-streaming" || part.state === "input-available";
  const failed = part.state === "output-error" || out["ok"] === false;
  const actionId = typeof out["action_id"] === "string" ? (out["action_id"] as string) : null;
  const showCard =
    actionId &&
    ["request_authorization", "send_message", "prepare_message", "propose_sale", "search_prospects"].includes(name);
  const leads = Array.isArray(out["leads"]) ? (out["leads"] as Array<Record<string, unknown>>) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[0.6875rem] text-muted-foreground">
        {running ? (
          <Loader2 className="size-3 animate-spin text-primary" />
        ) : failed ? (
          <X className="size-3 text-destructive" />
        ) : (
          <Check className="size-3 text-success" strokeWidth={2.2} />
        )}
        <span>{label}</span>
        {typeof out["reason"] === "string" && !showCard && <span className="text-destructive/90">— {out["reason"] as string}</span>}
      </div>
      {showCard && <ActionCard id={actionId} />}
      {leads && leads.length > 0 && (
        <div className="divide-y divide-border/50 overflow-hidden rounded-xl bg-surface/40">
          {leads.slice(0, 8).map((l) => (
            <Link
              key={String(l["id"])}
              to="/leads/$leadId"
              params={{ leadId: String(l["id"]) }}
              className="interactive flex items-center gap-3 px-4 py-2.5 text-xs"
            >
              <span className="flex-1 truncate text-foreground">
                {String(l["company_name"])}
                {l["contact_name"] ? <span className="text-muted-foreground"> · {String(l["contact_name"])}</span> : null}
              </span>
              <span className="hidden truncate text-muted-foreground sm:inline">{String(l["justification"] ?? "")}</span>
              <QualityBadge quality={l["lead_quality"] as LeadQuality} />
            </Link>
          ))}
          {leads.length > 8 && <p className="px-4 py-2 text-[0.6875rem] text-muted-foreground">+{leads.length - 8} no resultado</p>}
        </div>
      )}
    </div>
  );
}

function MessageView({ m }: { m: UIMessage }) {
  if (m.role === "user") {
    const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-surface-2/80 px-4 py-2.5 text-sm whitespace-pre-wrap text-foreground">
          {text}
        </p>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <span className="accent-rule mt-1.5 size-1.5 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-3">
        {m.parts.map((p, i) => {
          if (p.type === "text")
            return (
              <div key={i} className="prose-agent text-sm text-foreground">
                <ReactMarkdown>{p.text}</ReactMarkdown>
              </div>
            );
          if (p.type === "reasoning" && p.text)
            return (
              <details key={i} className="group text-[0.6875rem] text-muted-foreground">
                <summary className="flex cursor-pointer list-none items-center gap-1">
                  <ChevronRight className="size-3 transition-transform group-open:rotate-90" /> Raciocínio
                </summary>
                <p className="mt-1 pl-4 whitespace-pre-wrap">{p.text}</p>
              </details>
            );
          if (p.type.startsWith("tool-")) return <ToolStep key={i} part={p as unknown as ToolPart} />;
          return null;
        })}
      </div>
    </div>
  );
}

export function AgentChat({
  threadId,
  initialMessages,
  initialPrompt,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  initialPrompt?: string;
}) {
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agent",
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
        body: { threadId },
      }),
    [threadId],
  );

  const { messages, sendMessage, status, stop, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onFinish: () => {
      qc.invalidateQueries({ queryKey: ["agent-side"] });
      qc.invalidateQueries({ queryKey: ["agent-threads"] });
      qc.invalidateQueries({ queryKey: ["pending-count"] });
    },
  });

  const busy = status === "submitted" || status === "streaming";

  const send = (text: string) => {
    const v = text.trim();
    if (!v || busy) return;
    setInput("");
    sendMessage({ text: v });
  };

  useEffect(() => {
    if (initialPrompt && !sentInitial.current) {
      sentInitial.current = true;
      send(initialPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col lg:min-h-screen">
      <div className="flex-1 px-4 pt-8 sm:px-8">
        <div className="mx-auto max-w-3xl space-y-7 pb-8">
          {messages.length === 0 && (
            <div className="rise-in pt-10 sm:pt-20">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" strokeWidth={1.6} />
                <span className="label-caps text-foreground">LETITZ Agent</span>
              </div>
              <h1 className="text-display mt-4 text-2xl text-foreground sm:text-3xl">O que vamos operar agora?</h1>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                Peça em linguagem natural. Eu pesquiso, analiso e preparo — e só executo o que você autorizar.
              </p>
              <div className="mt-8 grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="focus-ring interactive rounded-xl bg-surface/40 px-4 py-3 text-left text-xs text-muted-foreground hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <MessageView key={m.id} m={m} />
          ))}
          {status === "submitted" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin text-primary" /> Pensando…
            </div>
          )}
          {error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
              {error.message || "O Agent não conseguiu responder."}
            </p>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="sticky bottom-0 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pt-6 pb-5 sm:px-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border/70 bg-surface/70 p-2 pl-4 shadow-[var(--shadow-elegant,none)] backdrop-blur-xl focus-within:border-primary/40"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Ex.: agora pega as 10 melhores e adiciona no CRM"
            className="max-h-40 min-h-[2.5rem] flex-1 resize-none bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {busy ? (
            <button type="button" onClick={stop} aria-label="Parar" className="focus-ring rounded-xl bg-surface-2 p-2.5 text-foreground">
              <Square className="size-4" />
            </button>
          ) : (
            <button
              type="submit"
              aria-label="Enviar"
              disabled={!input.trim()}
              className={cn("focus-ring accent-rule rounded-xl p-2.5 text-primary-foreground transition-opacity", !input.trim() && "opacity-40")}
            >
              <ArrowUp className="size-4" />
            </button>
          )}
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[0.625rem] text-muted-foreground">
          Autopilot desligado · nenhuma ação operacional acontece sem sua autorização
        </p>
      </div>
    </div>
  );
}
