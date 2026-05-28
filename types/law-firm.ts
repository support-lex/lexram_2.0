// ── Core domain types for the Law Firm Management System ─────────────────

export type UserRole = "advocate" | "client" | "admin";

export type CaseType = "Civil" | "Criminal" | "Family" | "Tax" | "Labour" | "Constitutional" | "Writ" | "Arbitration" | "Other";
export type CaseStage = "Filing" | "Pre-Trial" | "Trial" | "Arguments" | "Reserved" | "Disposed" | "Appeal";
export type CaseStatus = "active" | "pending" | "closed" | "archived";

export interface Case {
  id: string;
  caseNumber: string;
  cnr: string;
  title: string;
  client: string;
  advocate: string;
  court: string;
  type: CaseType;
  stage: CaseStage;
  status: CaseStatus;
  nextHearing: string | null;
  lastPurpose: string;
  filingDate: string;
  description?: string;
}

export interface Deadline {
  id: string;
  title: string;
  date: string;
  type: "hearing" | "filing" | "limitation" | "meeting";
  caseId?: string;
  caseNumber?: string;
  court?: string;
  description?: string;
}

export interface OverviewStats {
  totalCases: number;
  activeCases: number;
  pendingCases: number;
  closedCases: number;
  byType: Record<CaseType, number>;
  byStage: Record<CaseStage, number>;
}

export interface SearchFilters {
  cnr?: string;
  type?: CaseType;
  number?: string;
  year?: string;
  query?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  citations?: AICitation[];
  draft?: string;
}

export interface AICitation {
  title: string;
  url?: string;
  snippet?: string;
}

export interface AISession {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
}
