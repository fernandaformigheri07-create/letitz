import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { LetitzLogo } from "@/components/brand/Logo";
import { ActionButton } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — LETITZ" },
      { name: "description", content: "Acesse o LETITZ, seu sistema operacional comercial comandado por um Agent." },
      { property: "og:title", content: "Entrar — LETITZ" },
      { property: "og:description", content: "Acesse seu operador comercial inteligente." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate({ to: "/" });
  }, [session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (res.error) return setMsg(res.error.message);
    if (mode === "signup" && !res.data.session) setMsg("Confirme seu e-mail pelo link enviado para entrar.");
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) setMsg(r.error.message);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute top-1/4 left-1/3 size-[30rem] rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute right-1/4 bottom-0 size-[24rem] rounded-full bg-violet/10 blur-[140px]" />
      </div>
      <div className="relative w-full max-w-sm">
        <LetitzLogo />
        <h1 className="text-display mt-8 text-2xl text-foreground">
          {mode === "signin" ? "Bem-vinda de volta." : "Crie seu acesso."}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Seu operador comercial está pronto.</p>

        <form onSubmit={submit} className="mt-8 space-y-3">
          <input className="input-base" type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input-base" type="password" required minLength={6} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
          <ActionButton type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="size-3.5 animate-spin" />}
            {mode === "signin" ? "Entrar" : "Criar conta"}
          </ActionButton>
        </form>
        <ActionButton variant="outline" className="mt-3 w-full" onClick={google}>
          Continuar com Google
        </ActionButton>
        {msg && <p className="mt-4 text-xs text-muted-foreground">{msg}</p>}
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "Ainda não tem conta? Criar agora" : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}
