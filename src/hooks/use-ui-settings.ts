import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_UI, resolveUi, uiCssVars, type UiSettings } from "@/lib/ui-settings";

export const UI_SETTINGS_KEY = ["ui-settings"] as const;

export function useUiSettings(enabled = true): UiSettings {
  const q = useQuery({
    queryKey: UI_SETTINGS_KEY,
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("workspace_settings").select("ui").maybeSingle();
      return resolveUi(data?.ui);
    },
  });
  return q.data ?? DEFAULT_UI;
}

/** Aplica a configuração visual do workspace nas variáveis CSS globais. */
export function useApplyUiSettings(ui: UiSettings) {
  useEffect(() => {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(uiCssVars(ui))) root.style.setProperty(k, v);
  }, [ui]);
}
