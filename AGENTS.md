<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- UI config lives in `workspace_settings.ui` (schema in `src/lib/ui-settings.ts`), applied as CSS vars by AppShell; the Agent changes it via tools in `agent.server.ts` — one source of truth so the Agent controls the whole design system, not individual pages.
