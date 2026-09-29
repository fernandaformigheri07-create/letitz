import { Link } from "@tanstack/react-router";
import { Globe, Instagram, MessageCircle } from "lucide-react";

import { QualityBadge } from "@/components/ui-kit";
import { WEBSITE_STATUS_LABEL } from "@/lib/scoring";
import { LEAD_STATUS_LABEL, type Lead } from "@/lib/demo-data";

export function LeadRow({ lead }: { lead: Lead }) {
  return (
    <Link
      to="/leads/$leadId"
      params={{ leadId: lead.id }}
      className="interactive grid grid-cols-[1fr_auto] items-center gap-3 border-b border-border px-4 py-3.5 last:border-0 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto_auto_auto]"
    >
      <div className="min-w-0">
        <p className="truncate text-sm text-foreground">{lead.company_name}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {lead.segment} · {lead.city}, {lead.state}
        </p>
      </div>

      <div className="hidden min-w-0 items-center gap-3 text-xs text-muted-foreground sm:flex">
        <span className="truncate">{WEBSITE_STATUS_LABEL[lead.website_status]}</span>
        <span className="flex items-center gap-1.5">
          {lead.whatsapp && <MessageCircle className="size-3.5 text-success" strokeWidth={1.7} />}
          {lead.instagram && <Instagram className="size-3.5 text-violet" strokeWidth={1.7} />}
          {lead.website && <Globe className="size-3.5" strokeWidth={1.7} />}
        </span>
      </div>

      <span className="hidden text-xs text-muted-foreground md:inline">
        {LEAD_STATUS_LABEL[lead.lead_status]}
      </span>

      <QualityBadge quality={lead.lead_quality} />

      <span className="text-numeric w-12 text-right text-sm text-foreground">{lead.lead_score}</span>
    </Link>
  );
}
