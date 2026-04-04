/**
 * app/dashboard/contracts/types.ts
 * Shared type definitions for the Contracts feature.
 */

export interface SavedContractAnalysis {
  id: string;
  name: string;
  date: string;
  score: number;
  result: AnalysisResult;
}

export interface RedFlag {
  clause: string;
  issue: string;
  explanation: string;
}

export interface KeyClause {
  clause: string;
  summary: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface MissingClause {
  name: string;
  explanation: string;
}

export interface SuggestedAmendment {
  clause: string;
  suggestion: string;
  amendedText: string;
  status?: 'accepted' | 'rejected' | null;
}

export interface AnalysisResult {
  riskScore: number;
  riskLevel: 'Low Risk' | 'Medium Risk' | 'High Risk';
  redFlags: RedFlag[];
  keyClauses: KeyClause[];
  missingClauses: MissingClause[];
  suggestedAmendments: SuggestedAmendment[];
}

export interface CompareResult {
  summary?: string;
  keyDifferences?: string[];
  addedClauses?: string[];
  removedClauses?: string[];
  modifiedTerms?: { term: string; original: string; revised: string }[];
}

export const CONTRACT_TEMPLATES = [
  { name: 'Non-Disclosure Agreement (NDA)', type: 'Confidentiality' },
  { name: 'Employment Agreement', type: 'HR' },
  { name: 'Master Service Agreement', type: 'Services' },
  { name: 'Memorandum of Understanding', type: 'General' },
  { name: 'Commercial Lease Agreement', type: 'Real Estate' },
  { name: 'Loan Agreement', type: 'Finance' },
] as const;

export type ContractTemplate = typeof CONTRACT_TEMPLATES[number];
