"use client";

import { useState, useEffect, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import type { RiskLevel, KYCStatus, AccountType } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadedFile {
  name: string;
  size: number;
}

interface ScreeningRow {
  check: string;
  result: "No Match" | "Match Found" | "Pending";
  status: "pass" | "warn" | "fail";
}

interface FormData {
  // Step 1
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  ssn: string;
  address: string;
  phone: string;
  email: string;
  citizenship: string;
  accountType: AccountType | "";
  occupation: string;
  employer: string;
  // Step 3
  monthlyDepositVolume: string;
  sourceOfFunds: string;
  purposeOfAccount: string;
  internationalWires: string;
  // Step 4
  decisionNotes: string;
}

type StepErrors = Partial<Record<keyof FormData, string>>;

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Personal Info" },
  { id: 2, label: "Documents" },
  { id: 3, label: "Risk Screening" },
  { id: 4, label: "Review & Decision" },
];

const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Australia", "Germany",
  "France", "Mexico", "Brazil", "India", "China", "Japan", "Other",
];

const ACCOUNT_TYPES: AccountType[] = [
  "Personal Checking", "Savings", "Business Checking", "SBA Loan", "Mortgage",
];

const MONTHLY_VOLUMES = [
  "<$2,500", "$2,500-$10k", "$10k-$25k", "$25k+",
];

const SOURCES_OF_FUNDS = [
  "Employment", "Self-Employment", "Investments", "Inheritance", "Other",
];

const ACCOUNT_PURPOSES = [
  "Personal Expenses", "Business Ops", "Investment Activity", "Real Estate",
];

const WIRE_OPTIONS = [
  "No", "Yes - occasionally", "Yes - regularly",
];

const INITIAL_SCREENING: ScreeningRow[] = [
  { check: "OFAC Sanctions", result: "Pending", status: "pass" },
  { check: "PEP Screening", result: "Pending", status: "pass" },
  { check: "Global Sanctions", result: "Pending", status: "pass" },
  { check: "Adverse Media", result: "Pending", status: "pass" },
  { check: "ChexSystems", result: "Pending", status: "pass" },
];

const RESOLVED_SCREENING: ScreeningRow[] = [
  { check: "OFAC Sanctions", result: "No Match", status: "pass" },
  { check: "PEP Screening", result: "No Match", status: "pass" },
  { check: "Global Sanctions", result: "No Match", status: "pass" },
  { check: "Adverse Media", result: "No Match", status: "pass" },
  { check: "ChexSystems", result: "No Match", status: "pass" },
];

// ─── Utility functions ────────────────────────────────────────────────────────

function computeRisk(data: FormData): { score: number; level: RiskLevel; recommendation: string } {
  let score = 20;
  if (data.monthlyDepositVolume === "$25k+") score += 35;
  else if (data.monthlyDepositVolume === "$10k-$25k") score += 20;
  else if (data.monthlyDepositVolume === "$2,500-$10k") score += 10;

  if (data.internationalWires === "Yes - regularly") score += 25;
  else if (data.internationalWires === "Yes - occasionally") score += 12;

  if (data.sourceOfFunds === "Inheritance") score += 10;
  if (data.purposeOfAccount === "Investment Activity") score += 10;
  if (data.accountType === "SBA Loan" || data.accountType === "Business Checking") score += 5;

  const capped = Math.min(score, 100);
  const level: RiskLevel = capped >= 60 ? "HIGH" : capped >= 35 ? "MEDIUM" : "LOW";
  const recommendation =
    level === "LOW" ? "Recommend: Auto-Approve" :
    level === "MEDIUM" ? "Recommend: Manual Review" :
    "Recommend: Escalate";
  return { score: capped, level, recommendation };
}

function validateStep1(data: FormData): StepErrors {
  const errors: StepErrors = {};
  if (!data.firstName.trim()) errors.firstName = "Required";
  if (!data.lastName.trim()) errors.lastName = "Required";
  if (!data.dateOfBirth) errors.dateOfBirth = "Required";
  if (!data.ssn.trim()) errors.ssn = "Required";
  if (!data.address.trim()) errors.address = "Required";
  if (!data.phone.trim()) errors.phone = "Required";
  if (!data.email.trim()) errors.email = "Required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Invalid email";
  if (!data.citizenship) errors.citizenship = "Required";
  if (!data.accountType) errors.accountType = "Required";
  return errors;
}

function validateStep4(data: FormData): StepErrors {
  const errors: StepErrors = {};
  if (!data.decisionNotes.trim()) errors.decisionNotes = "Decision notes are required before submitting.";
  return errors;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stepper({ current }: { current: number }) {
  return (
    <nav data-testid="wizard-stepper" className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const done = step.id < current;
        const active = step.id === current;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center" data-testid={`step-${step.id}`}>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  done
                    ? "bg-teal-600 border-teal-600 text-white"
                    : active
                    ? "bg-white border-teal-600 text-teal-600"
                    : "bg-white border-slate-300 text-slate-400"
                }`}
                data-testid={`step-circle-${step.id}`}
              >
                {done ? "✓" : step.id}
              </div>
              <span
                className={`mt-1 text-xs font-medium ${
                  active ? "text-teal-700" : done ? "text-teal-500" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-16 mx-1 mb-5 transition-colors ${
                  done ? "bg-teal-500" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-red-500 text-xs mt-1" role="alert">{msg}</p>;
}

function FormField({
  label,
  required,
  error,
  children,
  testid,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  testid?: string;
}) {
  return (
    <div data-testid={testid}>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      <FieldError msg={error} />
    </div>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

interface UploadZoneProps {
  label: string;
  hint: string;
  required?: boolean;
  accept?: string;
  multiple?: boolean;
  files: UploadedFile[];
  onFiles: (files: UploadedFile[]) => void;
  status?: React.ReactNode;
  testid: string;
}

function UploadZone({
  label, hint, required, accept, multiple, files, onFiles, status, testid,
}: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: UploadedFile[] = Array.from(fileList).map((f) => ({
        name: f.name,
        size: f.size,
      }));
      onFiles(multiple ? [...files, ...newFiles] : newFiles);
    },
    [files, multiple, onFiles]
  );

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) processFiles(e.target.files);
  }

  return (
    <div data-testid={testid}>
      <p className="text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </p>
      <div
        data-testid={`${testid}-dropzone`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragging ? "border-teal-400 bg-teal-50" : files.length ? "border-green-400 bg-green-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleChange}
          data-testid={`${testid}-input`}
        />
        {files.length === 0 ? (
          <>
            <div className="text-3xl mb-2">📎</div>
            <p className="text-sm text-slate-600 font-medium">Drop files here or click to browse</p>
            <p className="text-xs text-slate-400 mt-1">{hint}</p>
          </>
        ) : (
          <div className="space-y-1">
            {files.map((f, i) => (
              <p key={i} className="text-sm text-green-700 font-medium" data-testid={`${testid}-file-${i}`}>
                ✓ {f.name}
              </p>
            ))}
            <p className="text-xs text-slate-400 mt-1">Click to replace</p>
          </div>
        )}
      </div>
      {status && <div className="mt-2" data-testid={`${testid}-status`}>{status}</div>}
    </div>
  );
}

// ─── Step 1: Personal Information ────────────────────────────────────────────

function Step1({
  data,
  errors,
  onChange,
}: {
  data: FormData;
  errors: StepErrors;
  onChange: (field: keyof FormData, value: string) => void;
}) {
  const inputCls = (field: keyof FormData) =>
    `w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-teal-500 ${
      errors[field] ? "border-red-400 bg-red-50" : "border-slate-200"
    }`;

  return (
    <div data-testid="step1-personal-info" className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="First Name" required error={errors.firstName} testid="field-first-name">
          <input
            data-testid="input-first-name"
            type="text"
            value={data.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            className={inputCls("firstName")}
            placeholder="John"
          />
        </FormField>
        <FormField label="Last Name" required error={errors.lastName} testid="field-last-name">
          <input
            data-testid="input-last-name"
            type="text"
            value={data.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            className={inputCls("lastName")}
            placeholder="Doe"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Date of Birth" required error={errors.dateOfBirth} testid="field-dob">
          <input
            data-testid="input-dob"
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => onChange("dateOfBirth", e.target.value)}
            className={inputCls("dateOfBirth")}
          />
        </FormField>
        <FormField label="SSN" required error={errors.ssn} testid="field-ssn">
          <input
            data-testid="input-ssn"
            type="password"
            value={data.ssn}
            onChange={(e) => onChange("ssn", e.target.value)}
            className={inputCls("ssn")}
            placeholder="•••-••-••••"
            autoComplete="off"
          />
          <p className="text-xs text-slate-400 mt-1" data-testid="ssn-hint">
            Encrypted at rest — AES-256
          </p>
        </FormField>
      </div>

      <FormField label="Residential Address" required error={errors.address} testid="field-address">
        <input
          data-testid="input-address"
          type="text"
          value={data.address}
          onChange={(e) => onChange("address", e.target.value)}
          className={inputCls("address")}
          placeholder="123 Main St, City, State, ZIP"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Phone Number" required error={errors.phone} testid="field-phone">
          <input
            data-testid="input-phone"
            type="tel"
            value={data.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            className={inputCls("phone")}
            placeholder="(555) 000-0000"
          />
        </FormField>
        <FormField label="Email Address" required error={errors.email} testid="field-email">
          <input
            data-testid="input-email"
            type="email"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            className={inputCls("email")}
            placeholder="john.doe@example.com"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Country of Citizenship" required error={errors.citizenship} testid="field-citizenship">
          <select
            data-testid="select-citizenship"
            value={data.citizenship}
            onChange={(e) => onChange("citizenship", e.target.value)}
            className={inputCls("citizenship")}
          >
            <option value="">Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Account Type Requested" required error={errors.accountType} testid="field-account-type">
          <select
            data-testid="select-account-type"
            value={data.accountType}
            onChange={(e) => onChange("accountType", e.target.value)}
            className={inputCls("accountType")}
          >
            <option value="">Select account type</option>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Occupation" testid="field-occupation">
          <input
            data-testid="input-occupation"
            type="text"
            value={data.occupation}
            onChange={(e) => onChange("occupation", e.target.value)}
            className={inputCls("occupation")}
            placeholder="e.g. Software Engineer"
          />
        </FormField>
        <FormField label="Employer Name" testid="field-employer">
          <input
            data-testid="input-employer"
            type="text"
            value={data.employer}
            onChange={(e) => onChange("employer", e.target.value)}
            className={inputCls("employer")}
            placeholder="e.g. Acme Corp"
          />
        </FormField>
      </div>
    </div>
  );
}

// ─── Step 2: Document Upload ──────────────────────────────────────────────────

interface DocState {
  idFront: UploadedFile[];
  idBack: UploadedFile[];
  proofOfAddress: UploadedFile[];
  selfie: UploadedFile[];
}

interface DocSimStatus {
  ocrStatus: "idle" | "processing" | "done";
  addressMatch: "idle" | "processing" | "done";
  selfieMatch: number | null;
}

function Step2({
  docs,
  simStatus,
  onDocsChange,
}: {
  docs: DocState;
  simStatus: DocSimStatus;
  onDocsChange: (field: keyof DocState, files: UploadedFile[]) => void;
}) {
  return (
    <div data-testid="step2-document-upload" className="space-y-6">
      {/* Photo ID Zone */}
      <div data-testid="photo-id-zone" className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">
          Photo ID <span className="text-red-500">*</span>
          <span className="ml-2 text-xs font-normal text-slate-400">Front and back required</span>
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <UploadZone
            testid="upload-id-front"
            label="Front Side"
            hint="Passport, Driver's License, or State ID"
            required
            accept="image/*,.pdf"
            files={docs.idFront}
            onFiles={(f) => onDocsChange("idFront", f)}
            status={
              docs.idFront.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  {simStatus.ocrStatus === "processing" && (
                    <span data-testid="ocr-status-processing" className="text-yellow-600 animate-pulse">
                      ⏳ OCR processing…
                    </span>
                  )}
                  {simStatus.ocrStatus === "done" && (
                    <span data-testid="ocr-status-done" className="text-green-600">
                      ✓ OCR complete — data extracted
                    </span>
                  )}
                </div>
              )
            }
          />
          <UploadZone
            testid="upload-id-back"
            label="Back Side"
            hint="Must show barcode or magnetic stripe"
            required
            accept="image/*,.pdf"
            files={docs.idBack}
            onFiles={(f) => onDocsChange("idBack", f)}
          />
        </div>
      </div>

      {/* Proof of Address Zone */}
      <div data-testid="proof-of-address-zone" className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">
          Proof of Address <span className="text-red-500">*</span>
        </h3>
        <p className="text-xs text-slate-400 mb-3">Utility bill or bank statement — must be less than 90 days old</p>
        <UploadZone
          testid="upload-proof-of-address"
          label="Upload Document"
          hint="PDF, JPG, or PNG — max 10 MB"
          required
          accept="image/*,.pdf"
          files={docs.proofOfAddress}
          onFiles={(f) => onDocsChange("proofOfAddress", f)}
          status={
            docs.proofOfAddress.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                {simStatus.addressMatch === "processing" && (
                  <span data-testid="address-match-processing" className="text-yellow-600 animate-pulse">
                    ⏳ Verifying address match…
                  </span>
                )}
                {simStatus.addressMatch === "done" && (
                  <span data-testid="address-match-done" className="text-green-600">
                    ✓ Address match confirmed
                  </span>
                )}
              </div>
            )
          }
        />
      </div>

      {/* Selfie Zone */}
      <div data-testid="selfie-zone" className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">
          Selfie / Live Photo
          <span className="ml-2 text-xs font-normal text-slate-400">(Optional)</span>
        </h3>
        <p className="text-xs text-slate-400 mb-3">Used for facial match comparison against Photo ID</p>
        <UploadZone
          testid="upload-selfie"
          label="Upload Selfie"
          hint="Clear face photo — no sunglasses or hats"
          accept="image/*"
          files={docs.selfie}
          onFiles={(f) => onDocsChange("selfie", f)}
          status={
            docs.selfie.length > 0 && simStatus.selfieMatch !== null && (
              <div className="flex items-center gap-2 text-xs">
                <span
                  data-testid="selfie-match-confidence"
                  className={simStatus.selfieMatch >= 80 ? "text-green-600" : "text-yellow-600"}
                >
                  {simStatus.selfieMatch >= 80 ? "✓" : "⚠"} Facial match confidence:{" "}
                  <strong>{simStatus.selfieMatch}%</strong>
                </span>
              </div>
            )
          }
        />
      </div>
    </div>
  );
}

// ─── Step 3: Risk Screening & Source of Funds ─────────────────────────────────

function Step3({
  data,
  errors,
  onChange,
  screeningRows,
  screeningLoading,
}: {
  data: FormData;
  errors: StepErrors;
  onChange: (field: keyof FormData, value: string) => void;
  screeningRows: ScreeningRow[];
  screeningLoading: boolean;
}) {
  const selectCls = (field: keyof FormData) =>
    `w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-teal-500 ${
      errors[field] ? "border-red-400 bg-red-50" : "border-slate-200"
    }`;

  const statusColors = {
    pass: "bg-green-100 text-green-700",
    warn: "bg-yellow-100 text-yellow-700",
    fail: "bg-red-100 text-red-700",
  };

  return (
    <div data-testid="step3-risk-screening" className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Expected Monthly Deposit Volume"
          required
          error={errors.monthlyDepositVolume}
          testid="field-monthly-volume"
        >
          <select
            data-testid="select-monthly-volume"
            value={data.monthlyDepositVolume}
            onChange={(e) => onChange("monthlyDepositVolume", e.target.value)}
            className={selectCls("monthlyDepositVolume")}
          >
            <option value="">Select range</option>
            {MONTHLY_VOLUMES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </FormField>
        <FormField
          label="Primary Source of Funds"
          required
          error={errors.sourceOfFunds}
          testid="field-source-of-funds"
        >
          <select
            data-testid="select-source-of-funds"
            value={data.sourceOfFunds}
            onChange={(e) => onChange("sourceOfFunds", e.target.value)}
            className={selectCls("sourceOfFunds")}
          >
            <option value="">Select source</option>
            {SOURCES_OF_FUNDS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Purpose of Account"
          required
          error={errors.purposeOfAccount}
          testid="field-purpose-of-account"
        >
          <select
            data-testid="select-purpose-of-account"
            value={data.purposeOfAccount}
            onChange={(e) => onChange("purposeOfAccount", e.target.value)}
            className={selectCls("purposeOfAccount")}
          >
            <option value="">Select purpose</option>
            {ACCOUNT_PURPOSES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </FormField>
        <FormField
          label="International Wires"
          testid="field-international-wires"
        >
          <select
            data-testid="select-international-wires"
            value={data.internationalWires}
            onChange={(e) => onChange("internationalWires", e.target.value)}
            className={selectCls("internationalWires")}
          >
            <option value="">Select option</option>
            {WIRE_OPTIONS.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </FormField>
      </div>

      {/* Automated Screening Table */}
      <div
        data-testid="screening-results-table"
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Automated Screening Results</h3>
          {screeningLoading && (
            <span
              data-testid="screening-loading-indicator"
              className="text-xs text-yellow-600 animate-pulse font-medium"
            >
              ⏳ Running checks…
            </span>
          )}
          {!screeningLoading && (
            <span
              data-testid="screening-complete-indicator"
              className="text-xs text-green-600 font-medium"
            >
              ✓ All checks complete
            </span>
          )}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Check</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Result</th>
            </tr>
          </thead>
          <tbody>
            {screeningRows.map((row) => (
              <tr
                key={row.check}
                className="border-t border-slate-100"
                data-testid={`screening-row-${row.check.replace(/\s+/g, "-").toLowerCase()}`}
              >
                <td className="px-4 py-2.5 text-slate-700">{row.check}</td>
                <td className="px-4 py-2.5">
                  {row.result === "Pending" ? (
                    <span
                      data-testid={`screening-result-${row.check.replace(/\s+/g, "-").toLowerCase()}`}
                      className="text-xs px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-500 animate-pulse"
                    >
                      Pending…
                    </span>
                  ) : (
                    <span
                      data-testid={`screening-result-${row.check.replace(/\s+/g, "-").toLowerCase()}`}
                      className={`text-xs px-2 py-0.5 rounded font-medium ${statusColors[row.status]}`}
                    >
                      {row.result === "No Match" ? "✓ No Match" : "✗ Match Found"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Step 4: Review & Decision ────────────────────────────────────────────────

function Step4({
  data,
  formData,
  docs,
  errors,
  onChange,
}: {
  data: FormData;
  formData: FormData;
  docs: DocState;
  errors: StepErrors;
  onChange: (field: keyof FormData, value: string) => void;
}) {
  const { score, level, recommendation } = computeRisk(formData);

  const riskBannerColors: Record<RiskLevel, string> = {
    LOW: "bg-green-50 border-green-300 text-green-800",
    MEDIUM: "bg-yellow-50 border-yellow-300 text-yellow-800",
    HIGH: "bg-red-50 border-red-300 text-red-800",
  };

  const riskScoreColors: Record<RiskLevel, string> = {
    LOW: "text-green-700",
    MEDIUM: "text-yellow-700",
    HIGH: "text-red-700",
  };

  const totalDocs =
    docs.idFront.length + docs.idBack.length + docs.proofOfAddress.length + docs.selfie.length;

  return (
    <div data-testid="step4-review-decision" className="space-y-6">
      {/* Risk Banner */}
      <div
        data-testid="risk-banner"
        className={`rounded-xl border-2 px-5 py-4 flex items-center justify-between ${riskBannerColors[level]}`}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-0.5">Risk Assessment</p>
          <p className="text-lg font-bold" data-testid="risk-banner-level">
            {level} Risk
          </p>
          <p className="text-sm" data-testid="risk-banner-recommendation">{recommendation}</p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-70 mb-0.5">Score</p>
          <p
            className={`text-4xl font-black ${riskScoreColors[level]}`}
            data-testid="risk-banner-score"
          >
            {score}
          </p>
          <p className="text-xs opacity-60">/ 100</p>
        </div>
      </div>

      {/* Summary — two columns */}
      <div className="grid grid-cols-2 gap-4" data-testid="review-summary">
        {/* Applicant Summary */}
        <div
          data-testid="applicant-summary"
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
        >
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Applicant Summary</h3>
          <dl className="space-y-2 text-sm">
            {[
              { label: "Full Name", value: `${data.firstName} ${data.lastName}`.trim() || "—" },
              { label: "Date of Birth", value: data.dateOfBirth || "—" },
              { label: "SSN", value: data.ssn ? "•••-••-" + data.ssn.slice(-4) : "—" },
              { label: "Address", value: data.address || "—" },
              { label: "Phone", value: data.phone || "—" },
              { label: "Email", value: data.email || "—" },
              { label: "Citizenship", value: data.citizenship || "—" },
              { label: "Account Type", value: data.accountType || "—" },
              { label: "Occupation", value: data.occupation || "—" },
              { label: "Employer", value: data.employer || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col border-b border-slate-50 pb-1.5 last:border-0">
                <dt className="text-xs text-slate-400 uppercase tracking-wide">{label}</dt>
                <dd className="text-slate-800 font-medium" data-testid={`summary-${label.replace(/\s+/g, "-").toLowerCase()}`}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Verification Summary */}
        <div
          data-testid="verification-summary"
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
        >
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Verification Summary</h3>
          <dl className="space-y-2 text-sm">
            {[
              {
                label: "Photo ID",
                value:
                  docs.idFront.length && docs.idBack.length
                    ? "✓ Front + Back uploaded"
                    : docs.idFront.length
                    ? "⚠ Front only"
                    : "✗ Not uploaded",
              },
              {
                label: "Proof of Address",
                value: docs.proofOfAddress.length ? "✓ Uploaded" : "✗ Not uploaded",
              },
              {
                label: "Selfie",
                value: docs.selfie.length ? "✓ Uploaded" : "— Not provided",
              },
              {
                label: "Monthly Deposit",
                value: data.monthlyDepositVolume || "—",
              },
              {
                label: "Source of Funds",
                value: data.sourceOfFunds || "—",
              },
              {
                label: "Account Purpose",
                value: data.purposeOfAccount || "—",
              },
              {
                label: "International Wires",
                value: data.internationalWires || "—",
              },
              {
                label: "Documents Submitted",
                value: `${totalDocs} file${totalDocs !== 1 ? "s" : ""}`,
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col border-b border-slate-50 pb-1.5 last:border-0">
                <dt className="text-xs text-slate-400 uppercase tracking-wide">{label}</dt>
                <dd className="text-slate-800 font-medium" data-testid={`verification-${label.replace(/\s+/g, "-").toLowerCase()}`}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Decision Notes */}
      <div data-testid="decision-notes-section" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <label className="block text-sm font-semibold text-slate-800 mb-2">
          Decision Notes <span className="text-red-500">*</span>
        </label>
        <textarea
          data-testid="textarea-decision-notes"
          value={data.decisionNotes}
          onChange={(e) => onChange("decisionNotes", e.target.value)}
          rows={4}
          placeholder="Enter mandatory decision notes and audit comments…"
          className={`w-full px-3 py-2 text-sm border rounded-lg resize-none outline-none focus:border-teal-500 ${
            errors.decisionNotes ? "border-red-400 bg-red-50" : "border-slate-200"
          }`}
        />
        {errors.decisionNotes && (
          <p className="text-red-500 text-xs mt-1" data-testid="decision-notes-error" role="alert">
            {errors.decisionNotes}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const EMPTY_FORM: FormData = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  ssn: "",
  address: "",
  phone: "",
  email: "",
  citizenship: "",
  accountType: "",
  occupation: "",
  employer: "",
  monthlyDepositVolume: "",
  sourceOfFunds: "",
  purposeOfAccount: "",
  internationalWires: "",
  decisionNotes: "",
};

const EMPTY_DOCS: DocState = {
  idFront: [],
  idBack: [],
  proofOfAddress: [],
  selfie: [],
};

export default function NewKYCPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [docs, setDocs] = useState<DocState>(EMPTY_DOCS);
  const [errors, setErrors] = useState<StepErrors>({});
  const [decision, setDecision] = useState<KYCStatus | null>(null);

  // Document simulation state
  const [simStatus, setSimStatus] = useState<DocSimStatus>({
    ocrStatus: "idle",
    addressMatch: "idle",
    selfieMatch: null,
  });

  // Step 3 screening simulation
  const [screeningRows, setScreeningRows] = useState<ScreeningRow[]>(INITIAL_SCREENING);
  const [screeningLoading, setScreeningLoading] = useState(false);
  const screeningDoneRef = useRef(false);

  // Advance OCR simulation to "done" after a delay when "processing"
  useEffect(() => {
    if (simStatus.ocrStatus !== "processing") return;
    const t = setTimeout(
      () => setSimStatus((prev) => ({ ...prev, ocrStatus: "done" })),
      1800
    );
    return () => clearTimeout(t);
  }, [simStatus.ocrStatus]);

  // Advance address-match simulation to "done" after a delay when "processing"
  useEffect(() => {
    if (simStatus.addressMatch !== "processing") return;
    const t = setTimeout(
      () => setSimStatus((prev) => ({ ...prev, addressMatch: "done" })),
      2200
    );
    return () => clearTimeout(t);
  }, [simStatus.addressMatch]);

  // Set selfie match confidence after upload
  useEffect(() => {
    if (docs.selfie.length > 0 && simStatus.selfieMatch === null) {
      const t = setTimeout(
        () => setSimStatus((prev) => ({ ...prev, selfieMatch: 94 })),
        1500
      );
      return () => clearTimeout(t);
    }
  }, [docs.selfie, simStatus.selfieMatch]);

  // Trigger screening when entering Step 3
  useEffect(() => {
    if (step === 3 && !screeningDoneRef.current) {
      screeningDoneRef.current = true;
      setScreeningLoading(true);
      setScreeningRows(INITIAL_SCREENING);
      const t = setTimeout(() => {
        setScreeningRows(RESOLVED_SCREENING);
        setScreeningLoading(false);
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [step]);

  function handleFieldChange(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function handleDocChange(field: keyof DocState, files: UploadedFile[]) {
    setDocs((prev) => ({ ...prev, [field]: files }));
    if (field === "idFront" && files.length > 0) {
      setSimStatus((prev) =>
        prev.ocrStatus === "idle" ? { ...prev, ocrStatus: "processing" } : prev
      );
    }
    if (field === "proofOfAddress" && files.length > 0) {
      setSimStatus((prev) =>
        prev.addressMatch === "idle" ? { ...prev, addressMatch: "processing" } : prev
      );
    }
  }

  function goNext() {
    if (step === 1) {
      const errs = validateStep1(formData);
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
    }
    setErrors({});
    setStep((s) => s + 1);
  }

  function goBack() {
    setErrors({});
    setStep((s) => s - 1);
  }

  function handleDecision(type: KYCStatus) {
    const errs = validateStep4(formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setDecision(type);
  }

  // Success screen
  if (decision) {
    const icon = decision === "APPROVED" ? "✅" : decision === "ESCALATED" ? "⚠️" : "❌";
    const label = decision === "APPROVED" ? "Approved" : decision === "ESCALATED" ? "Escalated" : "Rejected";
    return (
      <div
        className="min-h-screen bg-slate-50 flex items-center justify-center"
        data-testid="kyc-wizard-success"
      >
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-200 max-w-sm w-full mx-4">
          <div className="text-5xl mb-4">{icon}</div>
          <h2
            className="text-xl font-bold text-slate-900 mb-2"
            data-testid="success-heading"
          >
            Application {label}
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            The KYC application has been recorded with status:{" "}
            <strong data-testid="success-status">{decision}</strong>.
          </p>
          <div className="flex flex-col gap-2">
            <button
              data-testid="success-back-to-queue-btn"
              onClick={() => router.push("/kyc/queue")}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Back to KYC Queue
            </button>
            <button
              data-testid="success-new-application-btn"
              onClick={() => {
                setDecision(null);
                setStep(1);
                setFormData(EMPTY_FORM);
                setDocs(EMPTY_DOCS);
                setErrors({});
                setSimStatus({ ocrStatus: "idle", addressMatch: "idle", selfieMatch: null });
                setScreeningRows(INITIAL_SCREENING);
                setScreeningLoading(false);
                screeningDoneRef.current = false;
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Start New Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { level: riskLevel } = computeRisk(formData);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="kyc-wizard-page">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            data-testid="wizard-back-to-queue-link"
            onClick={() => router.push("/kyc/queue")}
            className="text-sm text-teal-600 hover:text-teal-800 transition-colors"
          >
            ← KYC Queue
          </button>
          <span className="text-slate-300">/</span>
          <h1
            className="text-xl font-bold text-slate-900"
            data-testid="wizard-heading"
          >
            New KYC Application
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Stepper current={step} />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2
            className="text-base font-semibold text-slate-800 mb-5"
            data-testid="step-heading"
          >
            {step === 1 && "Step 1: Personal Information"}
            {step === 2 && "Step 2: Identity Document Upload"}
            {step === 3 && "Step 3: Risk Screening & Source of Funds"}
            {step === 4 && "Step 4: Review & Decision"}
          </h2>

          {step === 1 && (
            <Step1 data={formData} errors={errors} onChange={handleFieldChange} />
          )}
          {step === 2 && (
            <Step2 docs={docs} simStatus={simStatus} onDocsChange={handleDocChange} />
          )}
          {step === 3 && (
            <Step3
              data={formData}
              errors={errors}
              onChange={handleFieldChange}
              screeningRows={screeningRows}
              screeningLoading={screeningLoading}
            />
          )}
          {step === 4 && (
            <Step4
              data={formData}
              formData={formData}
              docs={docs}
              errors={errors}
              onChange={handleFieldChange}
            />
          )}

          {/* Navigation */}
          <div
            className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100"
            data-testid="wizard-navigation"
          >
            <div>
              {step > 1 && (
                <button
                  data-testid="wizard-back-btn"
                  onClick={goBack}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  ← Back
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {step < 4 && (
                <button
                  data-testid="wizard-next-btn"
                  onClick={goNext}
                  className="px-5 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Next →
                </button>
              )}

              {step === 4 && (
                <>
                  <button
                    data-testid="wizard-escalate-btn"
                    onClick={() => handleDecision("ESCALATED")}
                    className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors"
                  >
                    Escalate
                  </button>
                  <button
                    data-testid="wizard-reject-btn"
                    onClick={() => handleDecision("REJECTED")}
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    data-testid="wizard-approve-btn"
                    onClick={() => handleDecision("APPROVED")}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                      riskLevel === "HIGH"
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
