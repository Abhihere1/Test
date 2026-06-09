"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  "Personal Info",
  "ID Upload",
  "Risk & Funds",
  "Review & Decision",
];

const COUNTRIES = [
  "United States","Canada","United Kingdom","Australia","Germany","France",
  "Japan","China","India","Brazil","Mexico","Spain","Italy","Netherlands",
  "Singapore","Other",
];

const ACCOUNT_TYPES = [
  "Personal Checking","Savings","Business Checking","SBA Loan","Mortgage",
];

interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  ssn: string;
  residentialAddress: string;
  phoneNumber: string;
  emailAddress: string;
  countryOfCitizenship: string;
  accountTypeRequested: string;
}

interface UploadedFile {
  file: File | null;
  status: "idle" | "processing" | "done";
  confidence?: number;
}

interface IDUpload {
  idFront: UploadedFile;
  idBack: UploadedFile;
  proofOfAddress: UploadedFile;
  selfie: UploadedFile;
}

interface RiskData {
  expectedMonthlyVolume: string;
  primarySourceOfFunds: string;
  purposeOfAccount: string;
  internationalWires: string;
}

interface ScreenResult {
  check: string;
  result: "No Match" | "Match Found" | "Pending";
  status: "pass" | "fail" | "warn";
}

const MOCK_SCREENING: ScreenResult[] = [
  { check: "OFAC Sanctions", result: "No Match", status: "pass" },
  { check: "PEP Screening", result: "No Match", status: "pass" },
  { check: "Global Sanctions", result: "No Match", status: "pass" },
  { check: "Adverse Media", result: "No Match", status: "pass" },
  { check: "ChexSystems", result: "No Match", status: "pass" },
  { check: "USPS Address", result: "No Match", status: "pass" },
];

const defaultPersonal: PersonalInfo = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  ssn: "",
  residentialAddress: "",
  phoneNumber: "",
  emailAddress: "",
  countryOfCitizenship: "",
  accountTypeRequested: "",
};

const defaultUpload: IDUpload = {
  idFront: { file: null, status: "idle" },
  idBack: { file: null, status: "idle" },
  proofOfAddress: { file: null, status: "idle" },
  selfie: { file: null, status: "idle" },
};

const defaultRisk: RiskData = {
  expectedMonthlyVolume: "",
  primarySourceOfFunds: "",
  purposeOfAccount: "",
  internationalWires: "",
};

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8" data-testid="kyc-wizard-stepper">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              data-testid={`kyc-step-indicator-${i + 1}`}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                i < current
                  ? "bg-teal-600 border-teal-600 text-white"
                  : i === current
                  ? "bg-white border-teal-600 text-teal-600"
                  : "bg-white border-slate-300 text-slate-400"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span className={`text-xs mt-1 whitespace-nowrap ${i === current ? "text-teal-600 font-semibold" : "text-slate-400"}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-12 mx-1 mb-5 ${i < current ? "bg-teal-600" : "bg-slate-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function Field({
  label, required, hint, error, children, className,
}: {
  label: string; required?: boolean; hint?: string; error?: string;
  children: React.ReactNode; className?: string;
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

function Step1({
  form, onChange, errors,
}: {
  form: PersonalInfo;
  onChange: (k: keyof PersonalInfo, v: string) => void;
  errors: Partial<Record<keyof PersonalInfo, string>>;
}) {
  return (
    <div className="space-y-4" data-testid="kyc-step-1">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Personal Information</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First Name" required error={errors.firstName}>
          <input data-testid="input-first-name" type="text" value={form.firstName} onChange={(e) => onChange("firstName", e.target.value)} className="input-field" placeholder="John" />
        </Field>
        <Field label="Last Name" required error={errors.lastName}>
          <input data-testid="input-last-name" type="text" value={form.lastName} onChange={(e) => onChange("lastName", e.target.value)} className="input-field" placeholder="Doe" />
        </Field>
        <Field label="Date of Birth" required error={errors.dateOfBirth}>
          <input data-testid="input-dob" type="date" value={form.dateOfBirth} onChange={(e) => onChange("dateOfBirth", e.target.value)} max={new Date().toISOString().split("T")[0]} className="input-field" />
        </Field>
        <Field label="SSN" required hint="Encrypted at rest" error={errors.ssn}>
          <input data-testid="input-ssn" type="password" value={form.ssn} onChange={(e) => onChange("ssn", e.target.value)} placeholder="•••-••-••••" className="input-field" maxLength={11} />
        </Field>
        <Field label="Residential Address" required error={errors.residentialAddress} className="sm:col-span-2">
          <input data-testid="input-residential-address" type="text" value={form.residentialAddress} onChange={(e) => onChange("residentialAddress", e.target.value)} className="input-field" placeholder="123 Main St, City, State ZIP" />
        </Field>
        <Field label="Phone Number" required error={errors.phoneNumber}>
          <input data-testid="input-phone" type="tel" value={form.phoneNumber} onChange={(e) => onChange("phoneNumber", e.target.value)} className="input-field" placeholder="(555) 000-0000" />
        </Field>
        <Field label="Email Address" required error={errors.emailAddress}>
          <input data-testid="input-email" type="email" value={form.emailAddress} onChange={(e) => onChange("emailAddress", e.target.value)} className="input-field" placeholder="john@example.com" />
        </Field>
        <Field label="Country of Citizenship" required error={errors.countryOfCitizenship}>
          <select data-testid="select-citizenship" value={form.countryOfCitizenship} onChange={(e) => onChange("countryOfCitizenship", e.target.value)} className="input-field">
            <option value="">Select country</option>
            {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Account Type Requested" required error={errors.accountTypeRequested}>
          <select data-testid="select-account-type" value={form.accountTypeRequested} onChange={(e) => onChange("accountTypeRequested", e.target.value)} className="input-field">
            <option value="">Select type</option>
            {ACCOUNT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>
    </div>
  );
}

function UploadZone({
  label, hint, required, upload, onUpload, testid,
}: {
  label: string; hint?: string; required?: boolean;
  upload: UploadedFile;
  onUpload: (f: File) => void; testid: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="border-2 border-dashed rounded-xl p-5 text-center" data-testid={testid}>
      <p className="text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </p>
      {hint && <p className="text-xs text-slate-400 mb-3">{hint}</p>}
      {upload.status === "idle" && (
        <button
          type="button"
          data-testid={`${testid}-browse-btn`}
          onClick={() => ref.current?.click()}
          className="px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200"
        >
          Choose File
        </button>
      )}
      {upload.status === "processing" && (
        <div className="flex items-center justify-center gap-2 text-sm text-amber-600" data-testid={`${testid}-processing`}>
          <span className="animate-spin">&#9696;</span>
          OCR Processing...
        </div>
      )}
      {upload.status === "done" && upload.file && (
        <div className="text-sm text-green-600" data-testid={`${testid}-done`}>
          <p className="font-medium">&#10003; {upload.file.name}</p>
          {upload.confidence !== undefined && (
            <p className="text-xs mt-1">Match: {upload.confidence}%</p>
          )}
        </div>
      )}
      <input
        ref={ref}
        data-testid={`${testid}-input`}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) onUpload(e.target.files[0]); }}
      />
    </div>
  );
}

function Step2({
  uploads, onUpload, errors,
}: {
  uploads: IDUpload;
  onUpload: (field: keyof IDUpload, f: File) => void;
  errors: Partial<Record<keyof IDUpload, string>>;
}) {
  return (
    <div className="space-y-5" data-testid="kyc-step-2">
      <h2 className="text-lg font-bold text-slate-800">ID Document Upload</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UploadZone label="Government Photo ID (Front)" required upload={uploads.idFront} onUpload={(f) => onUpload("idFront", f)} testid="upload-id-front" />
        <UploadZone label="Government Photo ID (Back)" required upload={uploads.idBack} onUpload={(f) => onUpload("idBack", f)} testid="upload-id-back" />
        <UploadZone label="Proof of Address" hint="Must be within 90 days" required upload={uploads.proofOfAddress} onUpload={(f) => onUpload("proofOfAddress", f)} testid="upload-proof-of-address" />
        <UploadZone label="Selfie / Live Photo" hint="Facial match confidence %" upload={uploads.selfie} onUpload={(f) => onUpload("selfie", f)} testid="upload-selfie" />
      </div>
      {errors.idFront && <p className="text-red-500 text-xs">{errors.idFront}</p>}
      {errors.idBack && <p className="text-red-500 text-xs">{errors.idBack}</p>}
      {errors.proofOfAddress && <p className="text-red-500 text-xs">{errors.proofOfAddress}</p>}
    </div>
  );
}

function Step3({
  riskData, onChange, screeningResults, errors,
}: {
  riskData: RiskData;
  onChange: (k: keyof RiskData, v: string) => void;
  screeningResults: ScreenResult[] | null;
  errors: Partial<Record<keyof RiskData, string>>;
}) {
  return (
    <div className="space-y-5" data-testid="kyc-step-3">
      <h2 className="text-lg font-bold text-slate-800">Risk & Financial Profile</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Expected Monthly Volume" required error={errors.expectedMonthlyVolume}>
          <select data-testid="select-monthly-volume" value={riskData.expectedMonthlyVolume} onChange={(e) => onChange("expectedMonthlyVolume", e.target.value)} className="input-field">
            <option value="">Select range</option>
            <option>{"<$2.5k"}</option>
            <option>$2.5k-$10k</option>
            <option>$10k-$25k</option>
            <option>$25k+</option>
          </select>
        </Field>
        <Field label="Primary Source of Funds" required error={errors.primarySourceOfFunds}>
          <select data-testid="select-source-of-funds" value={riskData.primarySourceOfFunds} onChange={(e) => onChange("primarySourceOfFunds", e.target.value)} className="input-field">
            <option value="">Select source</option>
            <option>Employment</option>
            <option>Investments</option>
            <option>Business Income</option>
            <option>Retirement</option>
            <option>Other</option>
          </select>
        </Field>
        <Field label="Purpose of Account" required error={errors.purposeOfAccount}>
          <select data-testid="select-purpose" value={riskData.purposeOfAccount} onChange={(e) => onChange("purposeOfAccount", e.target.value)} className="input-field">
            <option value="">Select purpose</option>
            <option>Personal</option>
            <option>Business</option>
            <option>Savings</option>
            <option>Investment</option>
          </select>
        </Field>
        <Field label="International Wires">
          <select data-testid="select-intl-wires" value={riskData.internationalWires} onChange={(e) => onChange("internationalWires", e.target.value)} className="input-field">
            <option value="">Select</option>
            <option>No</option>
            <option>Occasionally</option>
            <option>Regularly</option>
          </select>
        </Field>
      </div>

      {screeningResults ? (
        <div data-testid="automated-screening-results">
          <p className="text-sm font-medium text-slate-700 mb-3">Automated Screening Results</p>
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Check</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Result</th>
              </tr>
            </thead>
            <tbody>
              {screeningResults.map((r) => {
                const s = r.status === "pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
                return (
                  <tr key={r.check} className="border-t border-slate-100" data-testid={`screen-${r.check.replace(/\s+/g, "-").toLowerCase()}`}>
                    <td className="px-3 py-2 text-slate-700">{r.check}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${s}`}>{r.result}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-6 text-slate-400 text-sm" data-testid="screening-pending">
          Screening will run automatically when you proceed.
        </div>
      )}
    </div>
  );
}

function Step4({
  personal, riskData, riskScore,
}: {
  personal: PersonalInfo;
  riskData: RiskData;
  riskScore: number;
}) {
  const level = riskScore < 40 ? "LOW" : riskScore < 70 ? "MEDIUM" : "HIGH";
  const bannerColors: Record<string, string> = {
    LOW: "bg-green-100 border-green-400 text-green-800",
    MEDIUM: "bg-yellow-100 border-yellow-400 text-yellow-800",
    HIGH: "bg-red-100 border-red-400 text-red-800",
  };
  return (
    <div className="space-y-5" data-testid="kyc-step-4">
      <h2 className="text-lg font-bold text-slate-800">Review & Decision</h2>
      <div className={`border-2 rounded-xl p-4 ${bannerColors[level]}`} data-testid="kyc-risk-banner">
        <p className="text-sm font-semibold">Risk Score: {riskScore}/100 — {level} Risk</p>
        <p className="text-xs opacity-75 mt-0.5">Calculated from profile data and screening results</p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-3" data-testid="review-applicant-section">
          <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Applicant Details</h3>
          {[
            ["Full Name", `${personal.firstName} ${personal.lastName}`],
            ["Date of Birth", personal.dateOfBirth],
            ["Citizenship", personal.countryOfCitizenship],
            ["Address", personal.residentialAddress],
            ["Phone", personal.phoneNumber],
            ["Email", personal.emailAddress],
            ["Account Type", personal.accountTypeRequested],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-slate-500">{label}</span>
              <span className="text-slate-800 font-medium">{val || "—"}</span>
            </div>
          ))}
        </div>
        <div className="space-y-3" data-testid="review-verification-section">
          <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Financial Profile</h3>
          {[
            ["Monthly Volume", riskData.expectedMonthlyVolume],
            ["Source of Funds", riskData.primarySourceOfFunds],
            ["Account Purpose", riskData.purposeOfAccount],
            ["International Wires", riskData.internationalWires],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-slate-500">{label}</span>
              <span className="text-slate-800 font-medium">{val || "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function computeRiskScore(personal: PersonalInfo, risk: RiskData): number {
  let s = 20;
  if (risk.expectedMonthlyVolume === "$25k+") s += 30;
  else if (risk.expectedMonthlyVolume === "$10k-$25k") s += 15;
  if (risk.internationalWires === "Regularly") s += 25;
  else if (risk.internationalWires === "Occasionally") s += 10;
  if (personal.countryOfCitizenship !== "United States") s += 15;
  return Math.min(s, 100);
}

export default function KYCApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [personal, setPersonal] = useState<PersonalInfo>(defaultPersonal);
  const [uploads, setUploads] = useState<IDUpload>(defaultUpload);
  const [riskData, setRiskData] = useState<RiskData>(defaultRisk);
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [screeningResults, setScreeningResults] = useState<ScreenResult[] | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Trigger screening when entering step 3
  useEffect(() => {
    if (step === 2 && screeningResults === null) {
      const timer = setTimeout(() => {
        setScreeningResults(MOCK_SCREENING);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, screeningResults]);

  function handlePersonalChange(k: keyof PersonalInfo, v: string) {
    setPersonal((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => { const n = { ...prev }; delete n[k]; return n; });
  }

  function handleRiskChange(k: keyof RiskData, v: string) {
    setRiskData((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => { const n = { ...prev }; delete n[k]; return n; });
  }

  function simulateOCR(field: keyof IDUpload, file: File) {
    setUploads((prev) => ({ ...prev, [field]: { file, status: "processing" } }));
    setTimeout(() => {
      setUploads((prev) => ({
        ...prev,
        [field]: {
          file,
          status: "done",
          confidence: field === "selfie" ? 98 : undefined,
        },
      }));
    }, 2000);
  }

  function validateStep(): boolean {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!personal.firstName) errs.firstName = "Required";
      if (!personal.lastName) errs.lastName = "Required";
      if (!personal.dateOfBirth) errs.dateOfBirth = "Required";
      else if (new Date(personal.dateOfBirth) >= new Date()) errs.dateOfBirth = "Must be in the past";
      if (!personal.ssn) errs.ssn = "Required";
      if (!personal.residentialAddress) errs.residentialAddress = "Required";
      if (!personal.phoneNumber) errs.phoneNumber = "Required";
      if (!personal.emailAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.emailAddress))
        errs.emailAddress = "Valid email required";
      if (!personal.countryOfCitizenship) errs.countryOfCitizenship = "Required";
      if (!personal.accountTypeRequested) errs.accountTypeRequested = "Required";
    }
    if (step === 1) {
      if (!uploads.idFront.file) errs.idFront = "Government ID (Front) is required";
      if (!uploads.idBack.file) errs.idBack = "Government ID (Back) is required";
      if (!uploads.proofOfAddress.file) errs.proofOfAddress = "Proof of Address is required";
    }
    if (step === 2) {
      if (!riskData.expectedMonthlyVolume) errs.expectedMonthlyVolume = "Required";
      if (!riskData.primarySourceOfFunds) errs.primarySourceOfFunds = "Required";
      if (!riskData.purposeOfAccount) errs.purposeOfAccount = "Required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validateStep()) setStep((s) => s + 1);
  }

  function handleApprove() {
    if (!notes.trim()) { setNotesError(true); return; }
    setSubmitted(true);
    setTimeout(() => router.push("/kyc/queue"), 2000);
  }

  const riskScore = computeRiskScore(personal, riskData);

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" data-testid="kyc-submission-success">
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-200 max-w-sm">
          <div className="text-5xl mb-4">&#10003;</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">KYC Application Approved!</h2>
          <p className="text-slate-500 text-sm">Account opening workflow triggered. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="kyc-apply-page">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold text-slate-900" data-testid="kyc-apply-heading">
            New KYC Verification
          </h1>
          <p className="text-sm text-slate-500">4-step verification process</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <Stepper current={step} />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {step === 0 && <Step1 form={personal} onChange={handlePersonalChange} errors={errors as Partial<Record<keyof PersonalInfo, string>>} />}
          {step === 1 && <Step2 uploads={uploads} onUpload={simulateOCR} errors={errors as Partial<Record<keyof IDUpload, string>>} />}
          {step === 2 && <Step3 riskData={riskData} onChange={handleRiskChange} screeningResults={screeningResults} errors={errors as Partial<Record<keyof RiskData, string>>} />}
          {step === 3 && (
            <div className="space-y-5">
              <Step4 personal={personal} riskData={riskData} riskScore={riskScore} />
              <div data-testid="decision-notes-section">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Decision Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  data-testid="decision-notes-textarea"
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); setNotesError(false); }}
                  rows={4}
                  placeholder="Required for audit trail..."
                  className={`w-full px-3 py-2 text-sm border rounded-lg resize-none outline-none ${notesError ? "border-red-400 bg-red-50" : "border-slate-200"} focus:border-teal-500`}
                />
                {notesError && (
                  <p className="text-red-500 text-xs mt-1" data-testid="decision-notes-error">Decision notes are required.</p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              data-testid="kyc-back-btn"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              Back
            </button>
            {step < 3 ? (
              <button
                type="button"
                data-testid="kyc-next-btn"
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                data-testid="kyc-approve-btn"
                onClick={handleApprove}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Approve
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
          border-color: #14b8a6;
          box-shadow: 0 0 0 3px rgba(20,184,166,0.1);
        }
        select.input-field {
          appearance: auto;
        }
      `}</style>
    </div>
  );
}
