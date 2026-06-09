import Link from "next/link";
import { getApplicationById, APPLICATIONS } from "@/lib/data";
import { formatDate, getRiskColor } from "@/lib/utils";
import type { ProductTag } from "@/lib/types";
import { notFound } from "next/navigation";

const PRODUCT_TAG_COLORS: Record<ProductTag, string> = {
  Payments: "bg-blue-100 text-blue-700",
  BaaS: "bg-purple-100 text-purple-700",
  "Card Issuing": "bg-orange-100 text-orange-700",
  "Stored Value": "bg-teal-100 text-teal-700",
};

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Received",
  DOCUMENT_REVIEW: "Document Review",
  COMPLIANCE_REVIEW: "Compliance Review",
  TECH_SETUP: "Technical Setup",
  FINAL_APPROVAL: "Final Approval",
};

export function generateStaticParams() {
  return APPLICATIONS.map((a) => ({ id: a.id }));
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const app = getApplicationById(id);
  if (!app) notFound();

  const riskColor = getRiskColor(app.riskLevel);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="application-detail-page">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link
            href="/onboarding/pipeline"
            data-testid="back-to-pipeline-link"
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            &#8592; Pipeline
          </Link>
          <span className="text-slate-300">/</span>
          <h1
            className="text-xl font-bold text-slate-900"
            data-testid="application-detail-heading"
          >
            {app.companyName}
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Overview card */}
        <div
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
          data-testid="application-overview-card"
        >
          <div
            className="h-1.5"
            style={{ backgroundColor: riskColor }}
          />
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2
                  className="text-2xl font-bold text-slate-900"
                  data-testid="detail-company-name"
                >
                  {app.companyName}
                </h2>
                <p className="text-slate-500">{app.businessType}</p>
              </div>
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: riskColor + "20", color: riskColor }}
                data-testid="detail-risk-level"
              >
                {app.riskLevel} Risk
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-500 uppercase tracking-wide">Status</dt>
                <dd
                  className="mt-1 text-sm font-medium text-slate-800"
                  data-testid="detail-status"
                >
                  {STATUS_LABELS[app.status]}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 uppercase tracking-wide">Operating States</dt>
                <dd
                  className="mt-1 text-sm font-medium text-slate-800"
                  data-testid="detail-operating-states"
                >
                  {app.operatingStates}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 uppercase tracking-wide">Submission Date</dt>
                <dd
                  className="mt-1 text-sm font-medium text-slate-800"
                  data-testid="detail-submission-date"
                >
                  {formatDate(app.submissionDate)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 uppercase tracking-wide">Products</dt>
                <dd className="mt-1 flex flex-wrap gap-1" data-testid="detail-products">
                  {app.productTags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-xs px-2 py-0.5 rounded font-medium ${PRODUCT_TAG_COLORS[tag]}`}
                    >
                      {tag}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/onboarding/pipeline"
            data-testid="return-to-pipeline-btn"
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Return to Pipeline
          </Link>
        </div>
      </main>
    </div>
  );
}
