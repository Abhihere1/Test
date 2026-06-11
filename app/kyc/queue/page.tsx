"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KYC_APPLICATIONS } from "@/lib/data";
import { getAvatarColor, getInitials, formatDate } from "@/lib/utils";
import type { KYCApplication, KYCStatus, RiskLevel, KYCIdVerificationStatus } from "@/lib/types";

const STATS = [
  { label: "Verified This Month", value: 47, trend: "+12%", up: true, testid: "stat-verified" },
  { label: "Pending Review", value: 14, trend: "+3%", up: true, testid: "stat-pending" },
  { label: "Failed / Rejected", value: 5, trend: "-8%", up: false, testid: "stat-failed" },
  { label: "Avg Processing Time", value: "2.4h", trend: "-15%", up: false, testid: "stat-avg-time" },
];

const ID_VERIFICATION_STYLES: Record<KYCIdVerificationStatus, string> = {
  MATCH: "bg-green-100 text-green-700",
  MISMATCH: "bg-red-100 text-red-700",
  PENDING: "bg-yellow-100 text-yellow-700",
};

const ID_VERIFICATION_LABELS: Record<KYCIdVerificationStatus, string> = {
  MATCH: "ID Match",
  MISMATCH: "Mismatch",
  PENDING: "In Progress",
};

const RISK_DOT_COLORS: Record<RiskLevel, string> = {
  LOW: "bg-green-500",
  MEDIUM: "bg-yellow-500",
  HIGH: "bg-red-500",
};

const STATUS_STYLES: Record<KYCStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  ESCALATED: "bg-orange-100 text-orange-700",
  REJECTED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<KYCStatus, string> = {
  PENDING: "Pending Review",
  APPROVED: "Approved",
  ESCALATED: "Escalated",
  REJECTED: "Rejected",
};

type FilterTab = "All" | "Pending" | "High Risk" | "Escalated";
const TABS: FilterTab[] = ["All", "Pending", "High Risk", "Escalated"];

function filterApps(apps: KYCApplication[], tab: FilterTab): KYCApplication[] {
  switch (tab) {
    case "Pending": return apps.filter((a) => a.status === "PENDING");
    case "High Risk": return apps.filter((a) => a.riskLevel === "HIGH");
    case "Escalated": return apps.filter((a) => a.status === "ESCALATED");
    default: return apps;
  }
}

export default function KYCQueuePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = filterApps(KYC_APPLICATIONS, activeTab)
    .slice()
    .sort((a, b) => {
      const d = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      return sortDir === "asc" ? d : -d;
    });

  return (
    <div className="min-h-screen bg-slate-50" data-testid="kyc-queue-page">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900" data-testid="kyc-queue-heading">
              KYC Verification Center
            </h1>
            <p className="text-sm text-slate-500">Identity verification queue</p>
          </div>
          <div className="flex gap-2">
            <button
              data-testid="new-kyc-application-btn"
              onClick={() => router.push("/kyc/applicant/new")}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
            >
              + New Application
            </button>
            <button
              data-testid="start-kyc-review-btn"
              onClick={() => router.push("/kyc/apply")}
              className="px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
            >
              Start KYC Review
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" data-testid="stats-grid">
          {STATS.map((s) => (
            <div
              key={s.label}
              data-testid={s.testid}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
            >
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <div className={`flex items-center gap-1 text-xs mt-1 ${s.up ? "text-green-600" : "text-red-600"}`}>
                <span>{s.up ? "▲" : "▼"}</span>
                <span>{s.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex gap-2" data-testid="filter-bar">
          {TABS.map((tab) => (
            <button
              key={tab}
              data-testid={`filter-tab-${tab.replace(/\s+/g, "-").toLowerCase()}`}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab
                  ? "bg-teal-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" data-testid="kyc-queue-table">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Applicant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Account Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">ID Verification</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Risk Level</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                  data-testid="sort-by-date-btn"
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                >
                  Submitted {sortDir === "asc" ? "▲" : "▼"}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => (
                <tr
                  key={app.id}
                  data-testid={`kyc-row-${app.id}`}
                  onClick={() => router.push(`/kyc/applicant/${app.id}`)}
                  className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: getAvatarColor(app.fullName) }}
                        data-testid={`avatar-${app.id}`}
                      >
                        {getInitials(app.fullName)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900" data-testid={`applicant-name-${app.id}`}>{app.fullName}</p>
                        <p className="text-xs text-slate-400">{app.referenceId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700" data-testid={`account-type-${app.id}`}>
                    {app.accountType}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      data-testid={`id-verification-${app.id}`}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${ID_VERIFICATION_STYLES[app.idVerificationStatus]}`}
                    >
                      {ID_VERIFICATION_LABELS[app.idVerificationStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2" data-testid={`risk-level-${app.id}`}>
                      <div className={`w-2 h-2 rounded-full ${RISK_DOT_COLORS[app.riskLevel]}`} />
                      <span className="text-slate-700 capitalize">{app.riskLevel.toLowerCase()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      data-testid={`status-badge-${app.id}`}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[app.status]}`}
                    >
                      {STATUS_LABELS[app.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs" data-testid={`submitted-date-${app.id}`}>
                    {formatDate(app.submittedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-slate-400 py-10 text-sm">No applications match the current filter.</p>
          )}
        </div>
      </main>
    </div>
  );
}
