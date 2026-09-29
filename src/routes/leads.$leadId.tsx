import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ActionButton, EmptyState, QualityBadge, SectionTitle } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { levelLabel } from "@/lib/agent-levels";
import { formatDateTime, signalsOf } from "@/lib/format";
import type { LeadQuality } from "@/lib/scoring";

export const Route = createFileRoute("/leads/$leadId")({
  head: () => ({
    meta: [
      { title: "Lead — LETITZ" },
      { name: "description", content: "Detalhe do lead: sinais, conversas, autorizações e histórico de ações do Agent." },
      { property: "og:title", content: "Lead — LETITZ" },
      { property: "og:description", content: "Contexto completo de uma oportunidade comercial." },
    ],
  }),
  component: () => (
    <AppShell>
      <LeadDetail />
    </AppShell>
  ),
});

function LeadDetail() {
  const { leadId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [notes, setNotes] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["lead", leadId],
    queryFn: async () => {
      const [lead, convs, auths, actions] = await Promise.all([
        supabase.from("leads").select("*").eq("id", leadId).maybeSingle(),
        supabase.from("conversations").select("id,interlocutor_type,last_intent,conversation_messages(id,direction,body,delivery_status,created_at)").eq("lead_id", leadId),
        supabase.from("authorizations").select("id,level,scope,granted_at").eq("lead_id", leadId).is("revoked_at", null),
        supabase.from("agent_actions").select("id,summary,status,created_at,error").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(20),
      ]);
      return { lead: lead.data, convs: convs.data ?? [], auths: auths.data ?? [], actions: actions.data ?? [] };
    },
  });

  if (q.isLoading) return null;
  const lead = q.data?.lead;
  if (!lead) return <EmptyState title="Lead não encontrado." description="Ele pode ter sido removido." action={<Link to="/leads" className="text-xs text-primary">Voltar</Link>} />;

  const revoke = async (id: string) => {
    await supabase.from("authorizations").update({ revoked_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["lead", leadId] });
  };
  const saveNotes = async () => {
    await supabase.from("leads").update({ notes }).eq("id", leadId);
    qc.invalidateQueries({ queryKey: ["lead", leadId] });
    setNotes(null);
  };
  const messages = q.data!.convs.flatMap((c) => c.conversation_messages ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const conv = q.data!.convs[0];

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <Link to="/leads" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Leads</Link>

      <header className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-display text-2xl text-foreground">{lead.company_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{[lead.contact_name, lead.segment, lead.city, lead.state].filter(Boolean).join(" · ") || "Sem dados adicionais"}</p>
        </div>
        <QualityBadge quality={lead.lead_quality as LeadQuality} />
        <ActionButton onClick={() => navigate({ to: "/agent", search: { q: `Sobre o lead ${lead.company_name}${lead.contact_name ? ` (${lead.contact_name})` : ""}: ` } })}>
          <Sparkles className="size-3.5" /> Falar com o Agent
        </ActionButton>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-10">
          <section>
            <SectionTitle title="Por que este lead" hint="Somente sinais realmente obtidos" />
            {signalsOf(lead.signals).length ? (
              <ul className="space-y-1.5 text-sm text-foreground">{signalsOf(lead.signals).map((s) => <li key={s}>· {s}</li>)}</ul>
            ) : <p className="text-xs text-muted-foreground">Nenhum sinal registrado.</p>}
          </section>

          <section>
            <SectionTitle title="Conversa" hint={conv ? `Interlocutor: ${conv.interlocutor_type ?? "desconhecido"}${conv.last_intent ? ` · ${conv.last_intent}` : ""}` : undefined} />
            {messages.length ? (
              <div className="space-y-2">
                {messages.map((m) => (
                  <div key={m.id} className={m.direction === "inbound" ? "flex" : "flex justify-end"}>
                    <p className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.direction === "inbound" ? "bg-surface-2/70 text-foreground" : "bg-primary/15 text-foreground"}`}>
                      {m.body}
                      <span className="mt-1 block text-[0.625rem] text-muted-foreground">{formatDateTime(m.created_at)} · {m.delivery_status}</span>
                    </p>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-muted-foreground">Nenhuma conversa registrada. WhatsApp não conectado.</p>}
          </section>

          <section>
            <SectionTitle title="Notas" />
            <textarea className="input-base min-h-24" value={notes ?? lead.notes ?? ""} onChange={(e) => setNotes(e.target.value)} />
            {notes !== null && <ActionButton className="mt-2" onClick={saveNotes}>Salvar notas</ActionButton>}
          </section>
        </div>

        <aside className="space-y-8">
          <section>
            <p className="label-caps mb-3">Contato</p>
            <dl className="space-y-1.5 text-xs">
              <Row k="WhatsApp" v={lead.whatsapp} /><Row k="Telefone" v={lead.phone} /><Row k="E-mail" v={lead.email} /><Row k="Site" v={lead.website ?? "sem site"} />
            </dl>
          </section>
          <section>
            <p className="label-caps mb-3">Autorizações</p>
            {q.data!.auths.length ? q.data!.auths.map((a) => (
              <div key={a.id} className="mb-2 text-xs">
                <p className="text-foreground">Até {levelLabel(a.level)}</p>
                <p className="text-muted-foreground">{a.scope}</p>
                <button onClick={() => revoke(a.id)} className="mt-1 text-[0.6875rem] text-destructive hover:underline">Revogar</button>
              </div>
            )) : <p className="text-xs text-muted-foreground">Nenhuma. O Agent não pode conversar com este contato.</p>}
          </section>
          <section>
            <p className="label-caps mb-3">Ações do Agent</p>
            {q.data!.actions.length ? (
              <ul className="space-y-2 text-xs">{q.data!.actions.map((a) => (
                <li key={a.id}><p className="text-foreground">{a.summary}</p><p className="text-muted-foreground">{a.status}{a.error ? ` — ${a.error}` : ""}</p></li>
              ))}</ul>
            ) : <p className="text-xs text-muted-foreground">Nenhuma ação ainda.</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | null }) {
  return <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="truncate text-foreground">{v ?? "—"}</dd></div>;
}
