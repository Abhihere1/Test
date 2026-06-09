"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { calculateRiskScore } from "@/lib/utils";
import type { BeneficialOwner, RiskLevel } from "@/lib/types";

const STEPS = [
  "Company Info",
  "Product Selection",
  "Compliance",
  "Technical Setup",
  "Review",
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
];

interface FormData {
  legalEntityName: string;
  entityType: string;
  ein: string;
  stateOfIncorporation: string;
  registeredAddress: string;
  companyWebsite: string;
  primaryContactEmail: string;
  businessModelDescription: string;
  requestedProducts: string[];
  monthlyTransactionVolume: string;
  operatingStates: string;
  msbRegistrationStatus: string;
  stateMTLicenses: string;
  uploadedDocs: File[];
  beneficialOwners: BeneficialOwner[];
  integrationType: string;
  webhookCallbackUrl: string;
  ipWhitelisting: string;
}

const defaultForm: FormData = {
  legalEntityName: "",
  entityType: "",
  ein: "",
  stateOfIncorporation: "",
  registeredAddress: "",
  companyWebsite: "",
  primaryContactEmail: "",
  businessModelDescription: "",
  requestedProducts: [],
  monthlyTransactionVolume: "",
  operatingStates: "",
  msbRegistrationStatus: "",
  stateMTLicenses: "",
  uploadedDocs: [],
  beneficialOwners: [],
  integrationType: "",
  webhookCallbackUrl: "",
  ipWhitelisting: "",
};

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8" data-testid="wizard-stepper">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              data-testid={`step-indicator-${i + 1}`}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                i < current
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : i === current
                  ? "bg-white border-indigo-600 text-indigo-600"
                  : "bg-white border-slate-300 text-slate-400"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              className={`text-xs mt-1 whitespace-nowrap ${
                i === current ? "text-indigo-600 font-semibold" : "text-slate-400"
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-0.5 w-12 mx-1 mb-5 ${
                i < current ? "bg-indigo-600" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Step1({
  form,
  onChange,
  errors,
}: {
  form: FormData;
  onChange: (k: keyof FormData, v: string) => void;
  errors: Partial<Record<keyof FormData, string>>;
}) {
  return (
    <div className="space-y-4" data-testid="step-1-company-info">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Company Information</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Legal Entity Name" required error={errors.legalEntityName}>
          <input
            data-testid="input-legal-entity-name"
            type="text"
            value={form.legalEntityName}
            onChange={(e) => onChange("legalEntityName", e.target.value)}
            className="input-field"
            placeholder="Acme Financial LLC"
          />
        </Field>
        <Field label="Entity Type" required error={errors.entityType}>
          <select
            data-testid="select-entity-type"
            value={form.entityType}
            onChange={(e) => onChange("entityType", e.target.value)}
            className="input-field"
          >
            <option value="">Select type</option>
            <option>C-Corp</option>
            <option>S-Corp</option>
            <option>LLC</option>
            <option>Partnership</option>
          </select>
        </Field>
        <Field label="EIN / Tax ID" required error={errors.ein} hint="Format: XX-XXXXXXX">
          <input
            data-testid="input-ein"
            type="text"
            value={form.ein}
            onChange={(e) => onChange("ein", e.target.value)}
            placeholder="12-3456789"
            className="input-field"
          />
        </Field>
        <Field label="State of Incorporation" required error={errors.stateOfIncorporation}>
          <select
            data-testid="select-state-of-incorporation"
            value={form.stateOfIncorporation}
            onChange={(e) => onChange("stateOfIncorporation", e.target.value)}
            className="input-field"
          >
            <option value="">Select state</option>
            {US_STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Registered Address" required error={errors.registeredAddress} className="sm:col-span-2">
          <input
            data-testid="input-registered-address"
            type="text"
            value={form.registeredAddress}
            onChange={(e) => onChange("registeredAddress", e.target.value)}
            placeholder="123 Main St, City, State ZIP"
            className="input-field"
          />
        </Field>
        <Field label="Company Website" required error={errors.companyWebsite}>
          <input
            data-testid="input-company-website"
            type="url"
            value={form.companyWebsite}
            onChange={(e) => onChange("companyWebsite", e.target.value)}
            placeholder="https://example.com"
            className="input-field"
          />
        </Field>
        <Field label="Primary Contact Email" required error={errors.primaryContactEmail}>
          <input
            data-testid="input-primary-contact-email"
            type="email"
            value={form.primaryContactEmail}
            onChange={(e) => onChange("primaryContactEmail", e.target.value)}
            placeholder="contact@example.com"
            className="input-field"
          />
        </Field>
        <Field label="Business Model Description" required error={errors.businessModelDescription} className="sm:col-span-2">
          <textarea
            data-testid="input-business-model"
            value={form.businessModelDescription}
            onChange={(e) => onChange("businessModelDescription", e.target.value)}
            rows={3}
            placeholder="Describe your business model..."
            className="input-field resize-none"
          />
        </Field>
      </div>
    </div>
  );
}

const PRODUCTS = ["Payments", "BaaS", "Card Issuing", "Stored Value"] as const;
const PRODUCT_COLORS: Record<string, string> = {
  Payments: "border-blue-300 bg-blue-50",
  BaaS: "border-purple-300 bg-purple-50",
  "Card Issuing": "border-orange-300 bg-orange-50",
  "Stored Value": "border-teal-300 bg-teal-50",
};

function Step2({
  form,
  onChange,
  onProductToggle,
  errors,
}: {
  form: FormData;
  onChange: (k: keyof FormData, v: string) => void;
  onProductToggle: (p: string) => void;
  errors: Partial<Record<keyof FormData, string>>;
}) {
  const showPaymentConditional = form.requestedProducts.includes("Payments");

  return (
    <div className="space-y-6" data-testid="step-2-product-selection">
      <h2 className="text-lg font-bold text-slate-800">Product Selection</h2>
      <div>
        <p className="text-sm font-medium text-slate-700 mb-3">
          Requested Products <span className="text-red-500">*</span>
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="product-checkboxes">
          {PRODUCTS.map((p) => {
            const selected = form.requestedProducts.includes(p);
            return (
              <button
                key={p}
                type="button"
                data-testid={`product-card-${p.replace(/\s+/g, "-").toLowerCase()}`}
                onClick={() => onProductToggle(p)}
                className={`border-2 rounded-xl p-4 text-sm font-medium transition-all text-left ${
                  selected
                    ? `${PRODUCT_COLORS[p]} border-opacity-100`
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className={`w-4 h-4 rounded border-2 mb-2 flex items-center justify-center ${selected ? "bg-indigo-600 border-indigo-600" : "border-slate-300"}`}>
                  {selected && <span className="text-white text-xs">✓</span>}
                </div>
                {p}
              </button>
            );
          })}
        </div>
        {errors.requestedProducts && (
          <p className="text-red-500 text-xs mt-1">{errors.requestedProducts}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Monthly Transaction Volume" error={errors.monthlyTransactionVolume}>
          <select
            data-testid="select-monthly-volume"
            value={form.monthlyTransactionVolume}
            onChange={(e) => onChange("monthlyTransactionVolume", e.target.value)}
            className="input-field"
          >
            <option value="">Select range</option>
            <option>{"<$1M"}</option>
            <option>$1M-$10M</option>
            <option>$10M-$50M</option>
            <option>$50M+</option>
          </select>
        </Field>
        <Field label="Operating States" required error={errors.operatingStates}>
          <input
            data-testid="input-operating-states"
            type="text"
            value={form.operatingStates}
            onChange={(e) => onChange("operatingStates", e.target.value)}
            placeholder="CA, TX, NY"
            className="input-field"
          />
        </Field>
      </div>

      {showPaymentConditional && (
        <div
          className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5"
          data-testid="msb-conditional-section"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-200 text-amber-800">
              Conditional
            </span>
            <p className="text-sm font-medium text-amber-900">
              Payment Processing Requirements
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="MSB Registration Status" required error={errors.msbRegistrationStatus}>
              <select
                data-testid="select-msb-status"
                value={form.msbRegistrationStatus}
                onChange={(e) => onChange("msbRegistrationStatus", e.target.value)}
                className="input-field"
              >
                <option value="">Select status</option>
                <option>Registered</option>
                <option>Pending</option>
                <option>Not Registered</option>
                <option>Exempt</option>
              </select>
            </Field>
            <Field label="State Money Transmitter Licenses" required error={errors.stateMTLicenses}>
              <select
                data-testid="select-mtl"
                value={form.stateMTLicenses}
                onChange={(e) => onChange("stateMTLicenses", e.target.value)}
                className="input-field"
              >
                <option value="">Select</option>
                <option>1-5 States</option>
                <option>6-10 States</option>
                <option>11-25 States</option>
                <option>26+ States</option>
                <option>None</option>
              </select>
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}

function Step3({
  form,
  onFileUpload,
  onAddOwner,
  onRemoveOwner,
  onOwnerChange,
  errors,
}: {
  form: FormData;
  onFileUpload: (files: File[]) => void;
  onAddOwner: () => void;
  onRemoveOwner: (id: string) => void;
  onOwnerChange: (id: string, field: string, value: string | boolean) => void;
  errors: Partial<Record<keyof FormData, string>>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const valid: File[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 25 * 1024 * 1024) {
        alert(`${f.name} exceeds 25MB limit`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length) onFileUpload(valid);
  }

  return (
    <div className="space-y-6" data-testid="step-3-compliance">
      <h2 className="text-lg font-bold text-slate-800">Compliance Documentation</h2>

      {/* File upload */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">
          Document Upload <span className="text-red-500">*</span>
        </p>
        <div
          data-testid="document-upload-zone"
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            dragOver ? "border-indigo-400 bg-indigo-50" : "border-slate-300 bg-slate-50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-3xl mb-2">&#128196;</div>
          <p className="text-sm font-medium text-slate-700">Drop files here or click to browse</p>
          <p className="text-xs text-slate-400 mt-1">PDF, DOC, Images — max 25MB each</p>
          <input
            ref={fileInputRef}
            data-testid="document-file-input"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
        {form.uploadedDocs.length > 0 && (
          <ul className="mt-3 space-y-1" data-testid="uploaded-docs-list">
            {form.uploadedDocs.map((f, i) => (
              <li key={i} className="text-sm text-slate-700 flex items-center gap-2">
                <span className="text-green-500">✓</span>
                {f.name} <span className="text-slate-400">({(f.size / 1024).toFixed(0)} KB)</span>
              </li>
            ))}
          </ul>
        )}
        {errors.uploadedDocs && (
          <p className="text-red-500 text-xs mt-1">{errors.uploadedDocs}</p>
        )}
      </div>

      {/* Beneficial Owners */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-slate-700">
            Beneficial Owners <span className="text-red-500">*</span>
          </p>
          <button
            type="button"
            data-testid="add-beneficial-owner-btn"
            onClick={onAddOwner}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            + Add Owner
          </button>
        </div>
        {form.beneficialOwners.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No owners added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden" data-testid="beneficial-owners-table">
              <thead className="bg-slate-50">
                <tr>
                  {["Name","Title","% Own","DOB","SSN (Last 4)","Verified",""].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.beneficialOwners.map((o) => (
                  <tr key={o.id} className="border-t border-slate-100" data-testid={`owner-row-${o.id}`}>
                    <td className="px-2 py-1">
                      <input data-testid={`owner-name-${o.id}`} type="text" value={o.name} onChange={(e) => onOwnerChange(o.id, "name", e.target.value)} className="input-field text-xs w-28" placeholder="Full name" />
                    </td>
                    <td className="px-2 py-1">
                      <input data-testid={`owner-title-${o.id}`} type="text" value={o.title} onChange={(e) => onOwnerChange(o.id, "title", e.target.value)} className="input-field text-xs w-24" placeholder="CEO" />
                    </td>
                    <td className="px-2 py-1">
                      <input data-testid={`owner-pct-${o.id}`} type="number" min="0" max="100" value={o.ownershipPct} onChange={(e) => onOwnerChange(o.id, "ownershipPct", e.target.value)} className="input-field text-xs w-16" />
                    </td>
                    <td className="px-2 py-1">
                      <input data-testid={`owner-dob-${o.id}`} type="date" value={o.dob} onChange={(e) => onOwnerChange(o.id, "dob", e.target.value)} className="input-field text-xs w-32" />
                    </td>
                    <td className="px-2 py-1">
                      <input data-testid={`owner-ssn-${o.id}`} type="text" maxLength={4} value={o.ssnLast4} onChange={(e) => onOwnerChange(o.id, "ssnLast4", e.target.value)} placeholder="XXXX" className="input-field text-xs w-16" />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <input data-testid={`owner-verified-${o.id}`} type="checkbox" checked={o.verified} onChange={(e) => onOwnerChange(o.id, "verified", e.target.checked)} className="w-4 h-4" />
                    </td>
                    <td className="px-2 py-1">
                      <button data-testid={`remove-owner-${o.id}`} type="button" onClick={() => onRemoveOwner(o.id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Step4({
  form,
  onChange,
  errors,
}: {
  form: FormData;
  onChange: (k: keyof FormData, v: string) => void;
  errors: Partial<Record<keyof FormData, string>>;
}) {
  return (
    <div className="space-y-4" data-testid="step-4-technical-setup">
      <h2 className="text-lg font-bold text-slate-800">Technical Setup</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Integration Type" required error={errors.integrationType}>
          <select
            data-testid="select-integration-type"
            value={form.integrationType}
            onChange={(e) => onChange("integrationType", e.target.value)}
            className="input-field"
          >
            <option value="">Select type</option>
            <option>REST API</option>
            <option>SDK</option>
            <option>Webhook</option>
          </select>
        </Field>
        <Field label="Webhook Callback URL" required error={errors.webhookCallbackUrl}>
          <input
            data-testid="input-webhook-url"
            type="url"
            value={form.webhookCallbackUrl}
            onChange={(e) => onChange("webhookCallbackUrl", e.target.value)}
            placeholder="https://api.example.com/webhook"
            className="input-field font-mono text-sm"
          />
        </Field>
        <Field label="IP Whitelisting" className="sm:col-span-2" hint="Comma-separated IPs">
          <input
            data-testid="input-ip-whitelisting"
            type="text"
            value={form.ipWhitelisting}
            onChange={(e) => onChange("ipWhitelisting", e.target.value)}
            placeholder="192.168.1.1, 10.0.0.1"
            className="input-field font-mono text-sm"
          />
        </Field>
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-200">
        <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
        <button
          type="button"
          data-testid={`edit-step-${step}-btn`}
          onClick={() => onEdit(step)}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Edit
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
      <dt className="text-xs text-slate-500 w-40 flex-shrink-0">{label}</dt>
      <dd className="text-sm text-slate-800">{value}</dd>
    </div>
  );
}

function Step5({
  form,
  onEdit,
}: {
  form: FormData;
  onEdit: (step: number) => void;
}) {
  const { score, level } = calculateRiskScore({
    operatingStates: form.operatingStates,
    productTags: form.requestedProducts,
    monthlyVolume: form.monthlyTransactionVolume,
    msbStatus: form.msbRegistrationStatus,
    hasInternationalWires: false,
  });

  const riskColors: Record<RiskLevel, string> = {
    LOW: "bg-green-100 border-green-400 text-green-800",
    MEDIUM: "bg-yellow-100 border-yellow-400 text-yellow-800",
    HIGH: "bg-red-100 border-red-400 text-red-800",
  };

  return (
    <div className="space-y-5" data-testid="step-5-review">
      <h2 className="text-lg font-bold text-slate-800">Review & Submit</h2>

      {/* Risk Banner */}
      <div
        data-testid="risk-score-banner"
        className={`border-2 rounded-xl p-4 ${riskColors[level]}`}
      >
        <p className="text-sm font-semibold mb-1">Calculated Risk Assessment</p>
        <div className="flex items-center gap-4">
          <div>
            <span className="text-3xl font-bold">{score}</span>
            <span className="text-sm ml-1">/ 100</span>
          </div>
          <div>
            <span className="text-sm font-semibold">{level} Risk</span>
            <p className="text-xs opacity-75">Based on products, states, and volume</p>
          </div>
        </div>
      </div>

      <ReviewSection title="Company Information" step={0} onEdit={onEdit}>
        <dl className="space-y-2">
          <ReviewItem label="Legal Entity Name" value={form.legalEntityName} />
          <ReviewItem label="Entity Type" value={form.entityType} />
          <ReviewItem label="EIN / Tax ID" value={form.ein} />
          <ReviewItem label="State of Incorporation" value={form.stateOfIncorporation} />
          <ReviewItem label="Registered Address" value={form.registeredAddress} />
          <ReviewItem label="Website" value={form.companyWebsite} />
          <ReviewItem label="Primary Contact Email" value={form.primaryContactEmail} />
          <ReviewItem label="Business Model" value={form.businessModelDescription} />
        </dl>
      </ReviewSection>

      <ReviewSection title="Product Selection" step={1} onEdit={onEdit}>
        <dl className="space-y-2">
          <ReviewItem label="Requested Products" value={form.requestedProducts.join(", ") || "—"} />
          <ReviewItem label="Monthly Volume" value={form.monthlyTransactionVolume || "—"} />
          <ReviewItem label="Operating States" value={form.operatingStates} />
          {form.requestedProducts.includes("Payments") && (
            <>
              <ReviewItem label="MSB Status" value={form.msbRegistrationStatus || "—"} />
              <ReviewItem label="MTL Coverage" value={form.stateMTLicenses || "—"} />
            </>
          )}
        </dl>
      </ReviewSection>

      <ReviewSection title="Compliance" step={2} onEdit={onEdit}>
        <dl className="space-y-2">
          <ReviewItem label="Documents" value={`${form.uploadedDocs.length} file(s) uploaded`} />
          <ReviewItem label="Beneficial Owners" value={`${form.beneficialOwners.length} owner(s) added`} />
        </dl>
      </ReviewSection>

      <ReviewSection title="Technical Setup" step={3} onEdit={onEdit}>
        <dl className="space-y-2">
          <ReviewItem label="Integration Type" value={form.integrationType || "—"} />
          <ReviewItem label="Webhook URL" value={<code className="font-mono text-xs">{form.webhookCallbackUrl || "—"}</code>} />
          <ReviewItem label="IP Whitelist" value={form.ipWhitelisting || "—"} />
        </dl>
      </ReviewSection>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="text-xs text-slate-400 ml-1">({hint})</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function ApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  function handleChange(k: keyof FormData, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  }

  function handleProductToggle(p: string) {
    setForm((prev) => ({
      ...prev,
      requestedProducts: prev.requestedProducts.includes(p)
        ? prev.requestedProducts.filter((x) => x !== p)
        : [...prev.requestedProducts, p],
    }));
  }

  function handleFileUpload(files: File[]) {
    setForm((prev) => ({ ...prev, uploadedDocs: [...prev.uploadedDocs, ...files] }));
  }

  function handleAddOwner() {
    const newOwner: BeneficialOwner = {
      id: `owner-${Date.now()}`,
      name: "",
      title: "",
      ownershipPct: 0,
      dob: "",
      ssnLast4: "",
      verified: false,
    };
    setForm((prev) => ({ ...prev, beneficialOwners: [...prev.beneficialOwners, newOwner] }));
  }

  function handleRemoveOwner(id: string) {
    setForm((prev) => ({ ...prev, beneficialOwners: prev.beneficialOwners.filter((o) => o.id !== id) }));
  }

  function handleOwnerChange(id: string, field: string, value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      beneficialOwners: prev.beneficialOwners.map((o) =>
        o.id === id ? { ...o, [field]: value } : o
      ),
    }));
  }

  function validateStep(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (step === 0) {
      if (!form.legalEntityName) errs.legalEntityName = "Required";
      if (!form.entityType) errs.entityType = "Required";
      if (!form.ein || !/^\d{2}-\d{7}$/.test(form.ein)) errs.ein = "Format: XX-XXXXXXX";
      if (!form.stateOfIncorporation) errs.stateOfIncorporation = "Required";
      if (!form.registeredAddress) errs.registeredAddress = "Required";
      if (!form.companyWebsite) errs.companyWebsite = "Required";
      if (!form.primaryContactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.primaryContactEmail))
        errs.primaryContactEmail = "Valid email required";
      if (!form.businessModelDescription) errs.businessModelDescription = "Required";
    }
    if (step === 1) {
      if (form.requestedProducts.length === 0) errs.requestedProducts = "Select at least one product";
      if (!form.operatingStates) errs.operatingStates = "Required";
    }
    if (step === 2) {
      if (form.uploadedDocs.length === 0) errs.uploadedDocs = "At least one document required";
    }
    if (step === 3) {
      if (!form.integrationType) errs.integrationType = "Required";
      if (!form.webhookCallbackUrl) errs.webhookCallbackUrl = "Required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validateStep()) setStep((s) => s + 1);
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  function handleSubmit() {
    setSubmitted(true);
    setTimeout(() => {
      router.push("/onboarding/pipeline");
    }, 2000);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" data-testid="submission-success">
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-200 max-w-sm">
          <div className="text-5xl mb-4">&#10003;</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
          <p className="text-slate-500 text-sm">Redirecting to pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="apply-page">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold text-slate-900" data-testid="apply-heading">
            New Partner Application
          </h1>
          <p className="text-sm text-slate-500">Complete all steps to submit your application</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <Stepper current={step} />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {step === 0 && <Step1 form={form} onChange={handleChange} errors={errors} />}
          {step === 1 && <Step2 form={form} onChange={handleChange} onProductToggle={handleProductToggle} errors={errors} />}
          {step === 2 && <Step3 form={form} onFileUpload={handleFileUpload} onAddOwner={handleAddOwner} onRemoveOwner={handleRemoveOwner} onOwnerChange={handleOwnerChange} errors={errors} />}
          {step === 3 && <Step4 form={form} onChange={handleChange} errors={errors} />}
          {step === 4 && <Step5 form={form} onEdit={setStep} />}

          <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              data-testid="wizard-back-btn"
              onClick={handleBack}
              disabled={step === 0}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              Back
            </button>
            {step < 4 ? (
              <button
                type="button"
                data-testid="wizard-next-btn"
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                data-testid="submit-application-btn"
                onClick={handleSubmit}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Submit for Approval
              </button>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .input-field {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #1e293b;
          background: white;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-field:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        select.input-field {
          appearance: auto;
        }
      `}</style>
    </div>
  );
}
