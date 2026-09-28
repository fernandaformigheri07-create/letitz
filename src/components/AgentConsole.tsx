import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Check, Loader2, Sparkles } from "lucide-react";

import { ActionButton, Chip, DemoTag, QualityBadge } from "@/components/ui-kit";
import { planFromPrompt, QUICK_ACTIONS, type AgentPlan } from "@/services/agent";
import { cn } from "@/lib/utils";

type Phase = "idle" | "running" | "result" | "confirmed";

export function AgentConsole({ compact = false }: { compact?: boolean }) {
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const run = (text: string) => {
    const value = text.trim();
    if (!value) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];

    const next = planFromPrompt(value);
    setPrompt(value);
    setPlan(next);
    setPhase("running");
    setStepIndex(0);

    next.steps.forEach((_, i) => {
      timers.current.push(setTimeout(() => setStepIndex(i + 1), 700 * (i + 1)));
    });
    timers.current.push(setTimeout(() => setPhase("result"), 700 * next.steps.length + 500));
  };

  return (
    <div className="panel overflow-hidden">
      <div className="relative border-b border-border p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[var(--gradient-surface)] opacity-60" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-primary" strokeWidth={1.7} />
            <span className="label-caps text-foreground">LETITZ Agent</span>
            <DemoTag className="ml-auto" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Tell me what you need.</p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  run(prompt);
                }
              }}
              rows={compact ? 2 : 3}
              placeholder="Procure leads, analise oportunidades, prepare campanhas ou revise suas conversas..."
              className="focus-ring w-full resize-none rounded-xl border border-border bg-background/60 p-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-border-strong"
            />
            <ActionButton onClick={() => run(prompt)} className="shrink-0 sm:h-[3.25rem] sm:px-6">
              {phase === "running" ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Execute
            </ActionButton>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Chip key={action.label} onClick={() => run(action.prompt)}>
                {action.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {plan && (
        <div className="space-y-4 p-5 sm:p-6">
          <p className="text-sm text-foreground">{plan.reply}</p>

          <ol className="grid gap-2 sm:grid-cols-2">
            {plan.steps.map((step, i) => {
              const done = stepIndex > i || phase !== "running";
              const active = phase === "running" && stepIndex === i;
              return (
                <li
                  key={step.label}
                  className={cn(
                    "panel-quiet flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors",
                    done ? "text-foreground" : active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {done ? (
                    <Check className="size-3.5 text-success" strokeWidth={2} />
                  ) : active ? (
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-border-strong" />
                  )}
                  <span>{step.label}</span>
                  <span className="text-numeric ml-auto text-[0.625rem] text-muted-foreground">
                    {step.tool}()
                  </span>
                </li>
              );
            })}
          </ol>

          {phase !== "running" && (
            <div className="rise-in space-y-4">
              <ul className="space-y-1.5">
                {plan.summary.map((line) => (
                  <li key={line} className="flex items-baseline gap-2 text-sm text-foreground">
                    <span className="accent-rule mt-2 size-1 shrink-0 rounded-full" />
                    {line}
                  </li>
                ))}
              </ul>

              {plan.leads.length > 0 && (
                <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {plan.leads.slice(0, 5).map((lead) => (
                    <Link
                      key={lead.id}
                      to="/leads/$leadId"
                      params={{ leadId: lead.id }}
                      className="interactive flex items-center gap-3 px-4 py-3 text-xs"
                    >
                      <span className="flex-1 truncate text-foreground">{lead.company_name}</span>
                      <span className="hidden text-muted-foreground sm:inline">
                        {lead.city} · {lead.segment}
                      </span>
                      <QualityBadge quality={lead.lead_quality} />
                      <span className="text-numeric w-10 text-right text-foreground">
                        {lead.lead_score}
                      </span>
                      <ArrowUpRight className="size-3.5 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {plan.confirmation && phase === "result" && (
                  <>
                    <ActionButton onClick={() => setPhase("confirmed")}>
                      {plan.confirmation.label}
                    </ActionButton>
                    <p className="text-xs text-muted-foreground">{plan.confirmation.description}</p>
                  </>
                )}
                {phase === "confirmed" && (
                  <p className="flex items-center gap-2 text-xs text-success">
                    <Check className="size-3.5" /> Ação confirmada (simulada nesta versão).
                  </p>
                )}
                <Link
                  to="/leads"
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Ver todos os leads
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
