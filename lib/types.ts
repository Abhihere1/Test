export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type ApplicationStatus =
  | "RECEIVED"
  | "DOCUMENT_REVIEW"
  | "COMPLIANCE_REVIEW"
  | "TECH_SETUP"
  | "FINAL_APPROVAL";

export type ProductTag = "Payments" | "BaaS" | "Card Issuing" | "Stored Value";

export interface Application {
  id: string;
  companyName: string;
  businessType: string;
  operatingStates: string;
  productTags: ProductTag[];
  submissionDate: string;
  riskLevel: RiskLevel;
  status: ApplicationStatus;
}

export type KYCIdVerificationStatus = "MATCH" | "MISMATCH" | "PENDING";
export type KYCStatus = "PENDING" | "APPROVED" | "ESCALATED" | "REJECTED";
export type AccountType =
  | "Personal Checking"
  | "Business Checking"
  | "Savings"
  | "SBA Loan"
  | "Mortgage";

export interface KYCApplication {
  id: string;
  referenceId: string;
  fullName: string;
  accountType: AccountType;
  idVerificationStatus: KYCIdVerificationStatus;
  riskLevel: RiskLevel;
  status: KYCStatus;
  submittedAt: string;
}

export interface ScreeningResult {
  check: string;
  result: "No Match" | "Match Found" | "Pending";
  status: "pass" | "warn" | "fail";
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  event: string;
  actor: string;
  type: "system" | "user";
}

export interface Document {
  id: string;
  name: string;
  type: string;
  status: "Verified" | "Pending" | "Failed";
}

export interface KYCApplicationDetail extends KYCApplication {
  dateOfBirth: string;
  ssn: string;
  citizenship: string;
  address: string;
  phone: string;
  email: string;
  occupation: string;
  employer: string;
  riskScore: number;
  screeningResults: ScreeningResult[];
  documents: Document[];
  auditLogs: AuditEvent[];
}

export interface BeneficialOwner {
  id: string;
  name: string;
  title: string;
  ownershipPct: number;
  dob: string;
  ssnLast4: string;
  verified: boolean;
}
