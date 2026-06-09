"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { APPLICATIONS } from "@/lib/data";
import { exportToCSV, formatDate, getRiskColor } from "@/lib/utils";
import type { Application, ApplicationStatus, ProductTag } from "@/lib/types";

const COLUMNS: { status: ApplicationStatus; label: string }[] = [
  { status: "RECEIVED", label: "Received" },
  { status: "DOCUMENT_REVIEW", label: "Document Review" },
  { status: "COMPLIANCE_REVIEW", label: "Compliance Review" },
  { status: "TECH_SETUP", label: "Technical Setup" },
  { status: "FINAL_APPROVAL", label: "Final Approval" },
];

const PRODUCT_TAG_COLORS: Record<ProductTag, string> = {
  Payments: "bg-blue-100 text-blue-700",
  BaaS: "bg-purple-100 text-purple-700",
  "Card Issuing": "bg-orange-100 text-orange-700",
  "Stored Value": "bg-teal-100 text-teal-700",
};

function ApplicationCard({
  app,
  onDragStart,
  onClick,
}: {
  app: Application;
  onDragStart: (id: string) => void;
  onClick: (id: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(app.id)}
      onClick={() => onClick(app.id)}
      data-testid={`application-card-${app.id}`}
      className="bg-white rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow overflow-hidden flex"
    >
      <div
        className="w-1 flex-shrink-0"
        style={{ backgroundColor: getRiskColor(app.riskLevel) }}
        data-testid={`risk-indicator-${app.id}`}
      />
      <div className="p-3 flex-1 min-w-0">
        <p
          className="font-semibold text-slate-900 text-sm truncate"
          data-testid={`card-company-${app.id}`}
        >
          {app.companyName}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{app.businessType}</p>
        <p className="text-xs text-slate-400 mt-1 truncate">
          {app.operatingStates}
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          {app.productTags.map((tag) => (
            <span
              key={tag}
              data-testid={`product-tag-${app.id}-${tag}`}
              className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRODUCT_TAG_COLORS[tag]}`}
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {formatDate(app.submissionDate)}
        </p>
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  label,
  apps,
  onDragStart,
  onDrop,
  onCardClick,
}: {
  status: ApplicationStatus;
  label: string;
  apps: Application[];
  onDragStart: (id: string) => void;
  onDrop: (status: ApplicationStatus) => void;
  onCardClick: (id: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className="flex-shrink-0 w-64"
      data-testid={`kanban-column-${status}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={() => {
        setDragOver(false);
        onDrop(status);
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-700 text-sm" data-testid={`column-heading-${status}`}>
          {label}
        </h3>
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
          {apps.length}
        </span>
      </div>
      <div
        className={`min-h-32 rounded-xl p-2 flex flex-col gap-2 transition-colors ${
          dragOver ? "bg-indigo-50 border-2 border-dashed border-indigo-300" : "bg-slate-100"
        }`}
      >
        {apps.map((app) => (
          <ApplicationCard
            key={app.id}
            app={app}
            onDragStart={onDragStart}
            onClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>(APPLICATIONS);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function handleDragStart(id: string) {
    setDraggingId(id);
  }

  function handleDrop(targetStatus: ApplicationStatus) {
    if (!draggingId) return;
    setApps((prev) =>
      prev.map((a) =>
        a.id === draggingId ? { ...a, status: targetStatus } : a
      )
    );
    setDraggingId(null);
  }

  function handleCardClick(id: string) {
    router.push(`/onboarding/application/${id}`);
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="pipeline-page">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div>
            <h1
              className="text-xl font-bold text-slate-900"
              data-testid="pipeline-heading"
            >
              Partner Onboarding Pipeline
            </h1>
            <p className="text-sm text-slate-500">
              {apps.length} active applications
            </p>
          </div>
          <div className="flex items-center gap-3" data-testid="action-bar">
            <button
              data-testid="export-csv-btn"
              onClick={() => exportToCSV(apps)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Export CSV
            </button>
            <button
              data-testid="create-application-btn"
              onClick={() => router.push("/onboarding/apply")}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create new application
            </button>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="overflow-x-auto">
        <div
          className="flex gap-5 p-6 min-w-max max-w-screen-2xl mx-auto"
          data-testid="kanban-board"
        >
          {COLUMNS.map(({ status, label }) => (
            <KanbanColumn
              key={status}
              status={status}
              label={label}
              apps={apps.filter((a) => a.status === status)}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
