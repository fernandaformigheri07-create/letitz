import mark from "@/assets/letitz-mark.png";
import { cn } from "@/lib/utils";

export function LetitzMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-2",
        className,
      )}
    >
      <img src={mark} alt="LETITZ" width={816} height={816} className="size-[70%] object-contain" />
    </span>
  );
}

export function LetitzLogo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LetitzMark />
      {!collapsed && (
        <span className="text-display text-[0.95rem] font-semibold tracking-[0.22em] text-foreground">
          LETITZ
        </span>
      )}
    </span>
  );
}
