import type { Application, RiskLevel } from "./types";

export function calculateRiskScore(data: {
  operatingStates: string;
  productTags: string[];
  monthlyVolume: string;
  msbStatus: string;
  hasInternationalWires: boolean;
}): { score: number; level: RiskLevel } {
  let score = 0;

  const stateCount = data.operatingStates
    .split(",")
    .filter((s) => s.trim()).length;
  if (stateCount > 10) score += 30;
  else if (stateCount > 5) score += 20;
  else if (stateCount > 2) score += 10;

  if (data.productTags.includes("Payments")) score += 25;
  if (data.productTags.includes("BaaS")) score += 15;
  if (data.productTags.includes("Card Issuing")) score += 15;
  if (data.productTags.includes("Stored Value")) score += 10;

  if (data.monthlyVolume === "$50M+") score += 25;
  else if (data.monthlyVolume === "$10M-$50M") score += 15;
  else if (data.monthlyVolume === "$1M-$10M") score += 8;

  if (data.msbStatus === "Not Registered") score += 20;
  else if (data.msbStatus === "Pending") score += 10;

  if (data.hasInternationalWires) score += 15;

  const level: RiskLevel =
    score >= 60 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW";
  return { score: Math.min(score, 100), level };
}

export function exportToCSV(applications: Application[]): void {
  const headers = [
    "ID",
    "Company Name",
    "Business Type",
    "Operating States",
    "Product Tags",
    "Submission Date",
    "Risk Level",
    "Status",
  ];
  const rows = applications.map((a) => [
    a.id,
    a.companyName,
    a.businessType,
    a.operatingStates,
    a.productTags.join("|"),
    a.submissionDate,
    a.riskLevel,
    a.status,
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${c}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pipeline-export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case "HIGH":
      return "#ef4444";
    case "MEDIUM":
      return "#f59e0b";
    case "LOW":
      return "#22c55e";
  }
}

const AVATAR_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#0ea5e9",
];

export function getAvatarColor(name: string): string {
  const idx =
    name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
