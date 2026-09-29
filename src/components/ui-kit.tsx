import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { QUALITY_LABEL, type LeadQuality } from "@/lib/scoring";

export function Panel({
  children,
  className,
  as: As = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return <As className={cn("panel p-5", className)}>{children}</As>;
}

export function SectionTitle({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-display text-sm font-medium text-foreground">{title}</h2>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function QualityBadge({
  quality,
  className,
}: {
  quality: LeadQuality;
  className?: string;
}) {
  const tone: Record<LeadQuality, string> = {
    exceptional: "border-primary/45 text-primary bg-primary/10",
    good: "border-success/35 text-success bg-success/10",
    medium: "border-warning/30 text-warning bg-warning/10",
    low: "border-border-strong text-muted-foreground bg-muted/40",
    discarded: "border-border text-muted-foreground bg-transparent",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[0.625rem] font-medium tracking-[0.12em] uppercase",
        tone[quality],
        className,
      )}
    >
      {QUALITY_LABEL[quality]}
    </span>
  );
}

export function Chip({
  children,
  active,
  onClick,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring interactive rounded-full border px-3.5 py-1.5 text-xs",
        active
          ? "border-primary/45 bg-primary/12 text-foreground"
          : "border-border bg-surface/50 text-muted-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function ActionButton({
  children,
  onClick,
  variant = "primary",
  className,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const styles = {
    primary:
      "accent-rule text-primary-foreground font-medium hover:brightness-110 glow-soft disabled:opacity-50",
    outline: "border border-border-strong text-foreground hover:bg-surface-2/70",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-surface-2/60",
  } as const;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs tracking-[0.1em] uppercase transition-all duration-200",
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function ScoreDial({ score, size = 64 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={3}
          className="stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-primary transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="text-numeric absolute inset-0 flex items-center justify-center text-sm text-foreground">
        {score}
      </span>
    </div>
  );
}

export function Counter({
  value,
  format = (n: number) => String(Math.round(n)),
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [value]);

  return <span className={cn("text-numeric", className)}>{format(display)}</span>;
}

export function Sparkline({
  values,
  className,
  height = 44,
}: {
  values: number[];
  className?: string;
  height?: number;
}) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = height - ((v - min) / (max - min || 1)) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className={cn("w-full", className)}
      style={{ height }}
    >
      <polyline
        points={points}
        fill="none"
        strokeWidth={1.2}
        vectorEffect="non-scaling-stroke"
        className="stroke-primary"
      />
      <polyline
        points={`0,${height} ${points} 100,${height}`}
        className="fill-primary/10 stroke-none"
      />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel-quiet flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="size-9 rounded-lg border border-border bg-surface-2" />
      <p className="text-display text-sm text-foreground">{title}</p>
      <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-2/70", className)} />;
}

export function DemoTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "rounded border border-border px-1.5 py-0.5 text-[0.5625rem] tracking-[0.16em] text-muted-foreground uppercase",
        className,
      )}
    >
      dados demo
    </span>
  );
}
