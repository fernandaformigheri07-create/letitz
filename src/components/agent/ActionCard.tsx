import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";

import { StatusPill } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { resolveAgentAction } from "@/lib/actions.functions";
import { levelLabel } from "@/lib/agent-levels";
import { cn } from "@/lib/utils";

export function useAction(id: string | null | undefined) {
  return useQuery({
    queryKey: ["agent-action", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_actions")
        .select("id,tool,summary,status,authorization_level,result,error,input,leads(company_name,contact_name)")
        .eq("id", id!)
        .maybeSingle();
      return data;
    },
  });
}

/** Cartão de ação: mostra estado real e, quando aplicável, os botões de autorização. */
export function ActionCard({ id, compact = false }: { id: string; compact?: boolean }) {
  const { data: action } = useAction(id);
  const qc = useQueryClient();
  const resolve = useServerFn(resolveAgentAction);
  const [busy, setBusy] = useState<null | "yes" | "no">(null);

  if (!action) return null;
  const awaiting = action.status === "awaiting_authorization";
  const lead = action.leads as { company_name?: string; contact_name?: string | null } | null;
  const body = (action.input as Record<string, unknown> | null)?.["body"];

  const decide = async (approve: boolean) => {
    setBusy(approve ? "yes" : "no");
    try {
      await resolve({ data: { id: action.id, approve } });
    } finally {
      setBusy(null);
      qc.invalidateQueries({ queryKey: ["agent-action", id] });
      qc.invalidateQueries({ queryKey: ["pending-actions"] });
      qc.invalidateQueries({ queryKey: ["pending-count"] });
      qc.invalidateQueries({ queryKey: ["agent-side"] });
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        awaiting ? "border-warning/30 bg-warning/5" : "border-border/60 bg-surface/40",
      )}
    >
      <div className="flex items-start gap-3">
        {awaiting && <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" strokeWidth={1.6} />}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-foreground">{action.summary}</p>
          <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">
            {lead?.contact_name || lead?.company_name ? `${lead?.contact_name ?? ""} ${lead?.company_name ?? ""} · ` : ""}
            Nível {action.authorization_level} · {levelLabel(action.authorization_level)}
          </p>
          {!compact && typeof body === "string" && (
            <p className="mt-2 rounded-lg bg-background/50 px-3 py-2 text-xs whitespace-pre-wrap text-foreground/90">{body}</p>
          )}
          {action.error && <p className="mt-2 text-xs text-destructive">{action.error}</p>}
          {action.result && !compact && action.tool !== "prepare_message" && (
            <p className="mt-2 text-xs text-muted-foreground">{action.result}</p>
          )}
        </div>
        <StatusPill status={action.status} className="shrink-0" />
      </div>
      {awaiting && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => decide(true)}
            disabled={busy !== null}
            className="focus-ring accent-rule inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-50"
          >
            {busy === "yes" && <Loader2 className="size-3 animate-spin" />} Autorizar
          </button>
          <button
            onClick={() => decide(false)}
            disabled={busy !== null}
            className="focus-ring rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Não autorizar
          </button>
        </div>
      )}
    </div>
  );
}
