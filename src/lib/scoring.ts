/**
 * LETITZ internal lead scoring (0-100).
 * Modular by design: each factor is independent and weighted, so real
 * signals (Google Places, website crawl) can replace demo inputs later.
 * The score is an internal classification, never an absolute truth.
 */

export type WebsiteStatus =
  | "none"
  | "offline"
  | "outdated"
  | "slow"
  | "poor_mobile"
  | "missing_cta"
  | "low_quality"
  | "healthy";

export type LeadQuality = "exceptional" | "good" | "medium" | "low" | "discarded";

export interface ScoreInput {
  websiteStatus: WebsiteStatus;
  websiteScore: number | null; // 0-100 quality of existing site
  whatsapp: boolean;
  instagram: boolean;
  reviewCount: number;
  googleRating: number | null;
  commercialPresence: number; // 0-100
  segmentFit: number; // 0-100
}

export interface ScoreFactor {
  key: string;
  label: string;
  points: number;
  detail: string;
}

export interface ScoreResult {
  score: number;
  quality: LeadQuality;
  factors: ScoreFactor[];
}

const WEBSITE_POINTS: Record<WebsiteStatus, { points: number; detail: string }> = {
  none: { points: 34, detail: "Não possui site — maior oportunidade" },
  offline: { points: 31, detail: "Site fora do ar" },
  outdated: { points: 26, detail: "Site desatualizado" },
  low_quality: { points: 24, detail: "Site de baixa qualidade" },
  poor_mobile: { points: 20, detail: "Experiência mobile ruim" },
  missing_cta: { points: 17, detail: "Site sem chamada para ação clara" },
  slow: { points: 15, detail: "Site lento" },
  healthy: { points: 4, detail: "Site saudável — pouca dor imediata" },
};

export function calculateLeadScore(input: ScoreInput): ScoreResult {
  const factors: ScoreFactor[] = [];

  const web = WEBSITE_POINTS[input.websiteStatus];
  factors.push({
    key: "website",
    label: "Situação do site",
    points: web.points,
    detail: web.detail,
  });

  if (input.websiteScore !== null && input.websiteStatus !== "none") {
    const points = Math.round(((100 - input.websiteScore) / 100) * 8);
    factors.push({
      key: "website_quality",
      label: "Qualidade técnica do site",
      points,
      detail: `Site pontua ${input.websiteScore}/100`,
    });
  }

  factors.push({
    key: "whatsapp",
    label: "WhatsApp",
    points: input.whatsapp ? 14 : 0,
    detail: input.whatsapp ? "WhatsApp disponível" : "Sem WhatsApp identificado",
  });

  factors.push({
    key: "instagram",
    label: "Instagram",
    points: input.instagram ? 10 : 0,
    detail: input.instagram ? "Instagram ativo" : "Sem Instagram identificado",
  });

  const reviewPoints = Math.min(14, Math.round(Math.log10(Math.max(1, input.reviewCount)) * 7));
  factors.push({
    key: "reviews",
    label: "Volume de avaliações",
    points: reviewPoints,
    detail: `${input.reviewCount} avaliações no Google`,
  });

  const ratingPoints = input.googleRating ? Math.round(((input.googleRating - 3) / 2) * 10) : 0;
  factors.push({
    key: "rating",
    label: "Avaliação Google",
    points: Math.max(0, ratingPoints),
    detail: input.googleRating ? `Nota ${input.googleRating.toFixed(1)}` : "Sem nota",
  });

  factors.push({
    key: "presence",
    label: "Presença comercial",
    points: Math.round((input.commercialPresence / 100) * 10),
    detail: `Presença comercial ${input.commercialPresence}/100`,
  });

  factors.push({
    key: "segment",
    label: "Aderência do segmento",
    points: Math.round((input.segmentFit / 100) * 10),
    detail: `Aderência ${input.segmentFit}/100`,
  });

  const raw = factors.reduce((sum, f) => sum + f.points, 0);
  const score = Math.max(0, Math.min(100, raw));

  return { score, quality: qualityFromScore(score), factors };
}

export function qualityFromScore(score: number): LeadQuality {
  if (score >= 85) return "exceptional";
  if (score >= 70) return "good";
  if (score >= 50) return "medium";
  if (score >= 30) return "low";
  return "discarded";
}

export const QUALITY_LABEL: Record<LeadQuality, string> = {
  exceptional: "Exceptional",
  good: "Good Opportunity",
  medium: "Medium",
  low: "Low",
  discarded: "Discarded",
};

export const WEBSITE_STATUS_LABEL: Record<WebsiteStatus, string> = {
  none: "Sem site",
  offline: "Site offline",
  outdated: "Site desatualizado",
  slow: "Site lento",
  poor_mobile: "Mobile ruim",
  missing_cta: "Sem CTA",
  low_quality: "Baixa qualidade",
  healthy: "Site saudável",
};
