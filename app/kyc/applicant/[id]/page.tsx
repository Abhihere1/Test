"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { getKYCById } from "@/lib/data";
import { getAvatarColor, getInitials } from "@/lib/utils";
import type { AuditEvent, ScreeningResult } from "@/lib/types";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col py-2 border-b border-slate-100 last:border-0">
      <dt className="text-xs text-slate-500 uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-slate-800 mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

function ScreeningRow({ r }: { r: ScreeningResult }) {
  const colors = { pass: "text-green-600 bg-green-50", warn: "text-yellow-600 bg-yellow-50", fail: "text-red-600 bg-red-50" };
  return (
    <tr className="border-t border-slate-100" data-testid={`screening-row-${r.check.replace(/\s+/g, "-").toLowerCase()}`}>
      <td className="px-3 py-2 text-sm text-slate-700">{r.check}</td>
      <td className="px-3 py-2">
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${colors[r.status]}`}>
          {r.result}
        </span>
      </td>
    </tr>
  );
}

function TimelineEvent({ event }: { event: AuditEvent }) {
  const icons: Record<string, string> = { system: "⚙", user: "👤" };
  return (
    <div className="flex gap-3 relative" data-testid={`audit-event-${event.id}`}>
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs flex-shrink-0">
          {icons[event.type]}
        </div>
        <div className="w-0.5 bg-slate-200 flex-1 mt-1" />
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <p className="text-sm text-slate-800">{event.event}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {event.actor} · {new Date(event.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function RiskCircle({ score }: { score: number }) {
  const color = score < 50 ? "#22c55e" : score <= 80 ? "#f59e0b" : "#ef4444";
  const r = 42;
  const circ = 2 * Math.PI * r;
  const pct = circ * (1 - score / 100);
  return (
    <div className="flex items-center justify-center" data-testid="risk-score-circle">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={pct}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="bold" fill={color}>
          {score}
        </text>
      </svg>
    </div>
  );
}

export default function ApplicantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const app = getKYCById(id);
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState(false);
  const [decision, setDecision] = useState<string | null>(null);

  const riskScore = app.riskScore;
  const riskColor = riskScore < 50 ? "#22c55e" : riskScore <= 80 ? "#f59e0b" : "#ef4444";

  function handleDecision(type: string) {
    if (!notes.trim()) {
      setNotesError(true);
      return;
    }
    setDecision(type);
  }

  if (decision) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" data-testid="decision-success">
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-200 max-w-sm">
          <div className="text-5xl mb-4">{decision === "Approve" ? "✅" : decision === "Escalate" ? "⚠️" : "❌"}</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Application {decision}d</h2>
          <p className="text-slate-500 text-sm mb-4">Decision recorded in audit trail.</p>
          <button
            data-testid="back-to-queue-btn"
            onClick={() => router.push("/kyc/queue")}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg"
          >
            Back to Queue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="applicant-detail-page">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center gap-3">
          <button
            data-testid="back-to-queue-link"
            onClick={() => router.push("/kyc/queue")}
            className="text-sm text-teal-600 hover:text-teal-800"
          >
            &#8592; KYC Queue
          </button>
          <span className="text-slate-300">/</span>
          <h1 className="text-xl font-bold text-slate-900" data-testid="applicant-detail-heading">
            {app.fullName}
          </h1>
          <span className="text-sm text-slate-400">{app.referenceId}</span>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto p-6">
        <div className="flex gap-6 items-start">
          {/* Left Column */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Applicant Info Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5" data-testid="applicant-info-card">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ backgroundColor: getAvatarColor(app.fullName) }}
                >
                  {getInitials(app.fullName)}
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-lg" data-testid="applicant-name">{app.fullName}</h2>
                  <p className="text-sm text-slate-500">{app.accountType}</p>
                </div>
              </div>
              <dl>
                <InfoRow label="Date of Birth" value={app.dateOfBirth} />
                <InfoRow label="SSN" value={<span className="tracking-widest" data-testid="applicant-ssn">{app.ssn}</span>} />
                <InfoRow label="Citizenship" value={app.citizenship} />
                <InfoRow label="Address" value={app.address} />
                <InfoRow label="Phone" value={app.phone} />
                <InfoRow label="Email" value={app.email} />
                <InfoRow label="Occupation" value={app.occupation} />
                <InfoRow label="Employer" value={app.employer} />
              </dl>
            </div>

            {/* Identity Documents Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5" data-testid="identity-documents-card">
              <h3 className="font-semibold text-slate-800 mb-4">Identity Documents</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="h-24 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs" data-testid="id-front-placeholder">
                  ID Front
                </div>
                <div className="h-24 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs" data-testid="id-back-placeholder">
                  ID Back
                </div>
              </div>
              <table className="w-full text-sm" data-testid="documents-table">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left pb-2 text-xs text-slate-500">Document</th>
                    <th className="text-left pb-2 text-xs text-slate-500">Type</th>
                    <th className="text-left pb-2 text-xs text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {app.documents.map((doc) => {
                    const sc = doc.status === "Verified" ? "bg-green-100 text-green-700" : doc.status === "Failed" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700";
                    return (
                      <tr key={doc.id} className="border-t border-slate-100" data-testid={`doc-row-${doc.id}`}>
                        <td className="py-2 text-slate-800">{doc.name}</td>
                        <td className="py-2 text-slate-500 text-xs">{doc.type}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${sc}`}>{doc.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Screening Results Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5" data-testid="screening-results-card">
              <h3 className="font-semibold text-slate-800 mb-3">Screening Results</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left pb-2 text-xs text-slate-500">Check</th>
                    <th className="text-left pb-2 text-xs text-slate-500">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {app.screeningResults.map((r) => (
                    <ScreeningRow key={r.check} r={r} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column — sticky decision panel */}
          <div className="w-80 flex-shrink-0 space-y-4 sticky top-6" data-testid="decision-panel">
            {/* Risk Assessment Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5" data-testid="risk-assessment-card">
              <h3 className="font-semibold text-slate-800 mb-4">Risk Assessment</h3>
              <RiskCircle score={riskScore} />
              <p
                className="text-center text-sm font-semibold mt-2"
                style={{ color: riskColor }}
                data-testid="risk-level-label"
              >
                {app.riskLevel} Risk
              </p>
              <div className="mt-4 space-y-2" data-testid="risk-checklist">
                {app.screeningResults.map((r) => {
                  const icon = r.status === "pass" ? "✓" : r.status === "warn" ? "!" : "✗";
                  const color = r.status === "pass" ? "text-green-600" : r.status === "warn" ? "text-yellow-600" : "text-red-600";
                  return (
                    <div key={r.check} className="flex items-center gap-2 text-sm" data-testid={`checklist-${r.check.replace(/\s+/g, "-").toLowerCase()}`}>
                      <span className={`font-bold ${color}`}>{icon}</span>
                      <span className="text-slate-700">{r.check}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviewer Notes */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5" data-testid="reviewer-notes-card">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Reviewer Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                data-testid="reviewer-notes-textarea"
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setNotesError(false); }}
                rows={4}
                placeholder="Enter mandatory audit comments..."
                className={`w-full px-3 py-2 text-sm border rounded-lg resize-none outline-none ${
                  notesError ? "border-red-400 bg-red-50" : "border-slate-200"
                } focus:border-indigo-500`}
              />
              {notesError && (
                <p className="text-red-500 text-xs mt-1" data-testid="notes-error">Reviewer notes are required before submitting a decision.</p>
              )}
            </div>

            {/* Decision Actions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-2" data-testid="decision-actions">
              <button
                data-testid="approve-kyc-btn"
                onClick={() => handleDecision("Approve")}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Approve KYC
              </button>
              <button
                data-testid="escalate-btn"
                onClick={() => handleDecision("Escalate")}
                className="w-full px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors"
              >
                Escalate
              </button>
              <button
                data-testid="reject-btn"
                onClick={() => handleDecision("Reject")}
                className="w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
              >
                Reject
              </button>
            </div>

            {/* Audit Trail */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5" data-testid="audit-trail">
              <h3 className="font-semibold text-slate-800 mb-4">Audit Trail</h3>
              <div className="space-y-0">
                {app.auditLogs.map((event) => (
                  <TimelineEvent key={event.id} event={event} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
