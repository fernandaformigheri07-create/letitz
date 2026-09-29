import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ActionButton, Chip, EmptyState } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge — LETITZ" },
      { name: "description", content: "Business Knowledge: tudo que o Agent sabe sobre o seu negócio, regras e argumentos." },
      { property: "og:title", content: "Knowledge — LETITZ" },
      { property: "og:description", content: "O conhecimento de negócio que guia o Agent." },
    ],
  }),
  component: () => (
    <AppShell greeting="Knowledge" subtitle="O Agent usa apenas o que estiver aqui. Nada é inventado.">
      <Knowledge />
    </AppShell>
  ),
});

const CATEGORIES = [
  ["negocio", "Negócio"], ["servicos", "Serviços e produtos"], ["precos", "Preços"], ["diferenciais", "Diferenciais"],
  ["publico", "Público e posicionamento"], ["objecoes", "Objeções e respostas"], ["faq", "Perguntas frequentes"],
  ["condicoes", "Condições"], ["materiais", "Materiais, vídeos e documentos"], ["regras", "Regras"], ["mensagens", "Mensagens e argumentos"],
] as const;

function Knowledge() {
  const qc = useQueryClient();
  const [cat, setCat] = useState<string>("negocio");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const q = useQuery({
    queryKey: ["knowledge"],
    queryFn: async () => (await supabase.from("knowledge_items").select("*").order("created_at")).data ?? [],
  });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("knowledge_items").insert({ category: cat, title: title.trim(), content: content.trim() });
    setTitle("");
    setContent("");
    qc.invalidateQueries({ queryKey: ["knowledge"] });
  };
  const remove = async (id: string) => {
    await supabase.from("knowledge_items").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["knowledge"] });
  };

  const items = (q.data ?? []).filter((i) => i.category === cat);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(([k, l]) => {
          const n = (q.data ?? []).filter((i) => i.category === k).length;
          return <Chip key={k} active={cat === k} onClick={() => setCat(k)}>{l}{n ? ` · ${n}` : ""}</Chip>;
        })}
      </div>

      <form onSubmit={add} className="space-y-3 rounded-2xl bg-surface/40 p-5">
        <input required className="input-base" placeholder="Título (ex.: Plano Essencial)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea required className="input-base min-h-24" placeholder="Conteúdo, regra, resposta ou link do material" value={content} onChange={(e) => setContent(e.target.value)} />
        <ActionButton type="submit">Adicionar</ActionButton>
      </form>

      {items.length === 0 ? (
        <EmptyState title="Nada configurado nesta categoria." description="Sem isso, o Agent vai perguntar em vez de inventar." />
      ) : (
        <ul className="divide-y divide-border/50">
          {items.map((i) => (
            <li key={i.id} className="flex gap-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">
                  {i.title}
                  {i.source === "learned" && <span className="ml-2 text-[0.625rem] tracking-[0.12em] text-primary uppercase">aprendido na conversa</span>}
                </p>
                <p className="mt-1 text-xs whitespace-pre-wrap text-muted-foreground">{i.content}</p>
              </div>
              <button onClick={() => remove(i.id)} aria-label="Remover" className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
