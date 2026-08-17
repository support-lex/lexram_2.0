import type { Case, Deadline, OverviewStats } from "@/types/law-firm";

export const MOCK_CASES: Case[] = [
  { id: "1", caseNumber: "CS/2024/1847", cnr: "DLHC010045672024", title: "Sharma Industries v. Tata Steel Ltd.", client: "Sharma Industries Pvt. Ltd.", advocate: "Adv. Rajesh Menon", court: "Delhi High Court", type: "Civil", stage: "Arguments", status: "active", nextHearing: "2026-04-14", lastPurpose: "Final arguments by plaintiff", filingDate: "2024-03-12" },
  { id: "2", caseNumber: "CRL/2025/0392", cnr: "MHBM020034562025", title: "State of Maharashtra v. Vikram Desai", client: "Vikram Desai", advocate: "Adv. Priya Nair", court: "Bombay High Court", type: "Criminal", stage: "Trial", status: "active", nextHearing: "2026-04-16", lastPurpose: "Cross-examination of PW-3", filingDate: "2025-01-18" },
  { id: "3", caseNumber: "WP/2025/5521", cnr: "KRHC030012342025", title: "Citizens Forum v. BBMP", client: "Bengaluru Citizens Forum", advocate: "Adv. Rajesh Menon", court: "Karnataka High Court", type: "Writ", stage: "Pre-Trial", status: "active", nextHearing: "2026-04-18", lastPurpose: "Compliance report awaited", filingDate: "2025-06-01" },
  { id: "4", caseNumber: "FAM/2024/0088", cnr: "TNCH040056782024", title: "Lakshmi Devi v. Suresh Kumar", client: "Lakshmi Devi", advocate: "Adv. Anjali Sharma", court: "Madras High Court — Family Division", type: "Family", stage: "Trial", status: "active", nextHearing: "2026-04-22", lastPurpose: "Evidence of respondent", filingDate: "2024-07-22" },
  { id: "5", caseNumber: "ARB/2025/0211", cnr: "DLHC010098762025", title: "Nexus Infra v. Metro Corp", client: "Nexus Infrastructure Ltd.", advocate: "Adv. Rajesh Menon", court: "Delhi High Court — Arbitration", type: "Arbitration", stage: "Arguments", status: "active", nextHearing: "2026-04-25", lastPurpose: "Oral arguments on jurisdiction", filingDate: "2025-02-14" },
  { id: "6", caseNumber: "CS/2023/4201", cnr: "SCHC050011232023", title: "Reliance Retail v. Future Group", client: "Reliance Retail Ltd.", advocate: "Adv. Priya Nair", court: "Supreme Court of India", type: "Civil", stage: "Reserved", status: "active", nextHearing: null, lastPurpose: "Judgment reserved on 28-Mar-2026", filingDate: "2023-11-05" },
  { id: "7", caseNumber: "TAX/2025/0773", cnr: "DLHC010077732025", title: "ABC Exports v. Commissioner of Income Tax", client: "ABC Exports Pvt. Ltd.", advocate: "Adv. Vikram Singh", court: "Delhi High Court — Tax", type: "Tax", stage: "Pre-Trial", status: "pending", nextHearing: "2026-05-02", lastPurpose: "Stay application pending", filingDate: "2025-04-10" },
  { id: "8", caseNumber: "LAB/2024/0156", cnr: "MHBM020015642024", title: "Workers Union v. Bharat Motors", client: "Bharat Motors Workers Union", advocate: "Adv. Anjali Sharma", court: "Bombay High Court — Labour", type: "Labour", stage: "Trial", status: "active", nextHearing: "2026-04-30", lastPurpose: "Management witness deposition", filingDate: "2024-09-03" },
  { id: "9", caseNumber: "CS/2022/8845", cnr: "KRHC030088452022", title: "Infosys v. TechServ Solutions", client: "Infosys Ltd.", advocate: "Adv. Rajesh Menon", court: "Karnataka High Court", type: "Civil", stage: "Disposed", status: "closed", nextHearing: null, lastPurpose: "Decree in favor of plaintiff", filingDate: "2022-05-17" },
  { id: "10", caseNumber: "CRL/2024/2109", cnr: "UPHC060021092024", title: "State of UP v. Arun Yadav", client: "Arun Yadav", advocate: "Adv. Priya Nair", court: "Allahabad High Court", type: "Criminal", stage: "Arguments", status: "active", nextHearing: "2026-04-20", lastPurpose: "Defense arguments", filingDate: "2024-08-12" },
  { id: "11", caseNumber: "WP/2026/0034", cnr: "SCHC050000342026", title: "Environmental Assn. v. Union of India", client: "National Environmental Association", advocate: "Adv. Rajesh Menon", court: "Supreme Court of India", type: "Constitutional", stage: "Filing", status: "pending", nextHearing: "2026-05-10", lastPurpose: "Admission hearing", filingDate: "2026-01-15" },
  { id: "12", caseNumber: "CS/2025/1102", cnr: "TNCH040011022025", title: "Sundaram Finance v. Patel Brothers", client: "Sundaram Finance Ltd.", advocate: "Adv. Vikram Singh", court: "Madras High Court", type: "Civil", stage: "Pre-Trial", status: "active", nextHearing: "2026-05-05", lastPurpose: "Written statement filed", filingDate: "2025-03-20" },
];

export const MOCK_DEADLINES: Deadline[] = [
  { id: "d1", title: "Sharma Industries v. Tata Steel — Final Arguments", date: "2026-04-14", type: "hearing", caseId: "1", caseNumber: "CS/2024/1847", court: "Delhi High Court" },
  { id: "d2", title: "State v. Vikram Desai — Cross Examination PW-3", date: "2026-04-16", type: "hearing", caseId: "2", caseNumber: "CRL/2025/0392", court: "Bombay High Court" },
  { id: "d3", title: "File rejoinder — Citizens Forum v. BBMP", date: "2026-04-17", type: "filing", caseId: "3", caseNumber: "WP/2025/5521", court: "Karnataka High Court" },
  { id: "d4", title: "Citizens Forum v. BBMP — Compliance Hearing", date: "2026-04-18", type: "hearing", caseId: "3", caseNumber: "WP/2025/5521", court: "Karnataka High Court" },
  { id: "d5", title: "State v. Arun Yadav — Defense Arguments", date: "2026-04-20", type: "hearing", caseId: "10", caseNumber: "CRL/2024/2109", court: "Allahabad High Court" },
  { id: "d6", title: "Lakshmi Devi v. Suresh Kumar — Evidence", date: "2026-04-22", type: "hearing", caseId: "4", caseNumber: "FAM/2024/0088", court: "Madras High Court" },
  { id: "d7", title: "Limitation — ABC Exports appeal deadline", date: "2026-04-28", type: "limitation", caseId: "7", caseNumber: "TAX/2025/0773", description: "3-year limitation from assessment order" },
  { id: "d8", title: "Client meeting — Nexus Infra pre-hearing strategy", date: "2026-04-24", type: "meeting", caseId: "5", caseNumber: "ARB/2025/0211", description: "Discuss arbitration strategy before hearing" },
];

export const MOCK_OVERVIEW: OverviewStats = {
  totalCases: 12,
  activeCases: 8,
  pendingCases: 2,
  closedCases: 1,
  byType: { Civil: 4, Criminal: 2, Writ: 1, Family: 1, Arbitration: 1, Tax: 1, Labour: 1, Constitutional: 1, Other: 0 },
  byStage: { Filing: 1, "Pre-Trial": 3, Trial: 3, Arguments: 3, Reserved: 1, Disposed: 1, Appeal: 0 },
};

// Client sees only their cases (subset)
export const MOCK_CLIENT_CASES: Case[] = MOCK_CASES.filter((c) => c.client === "Sharma Industries Pvt. Ltd." || c.client === "Nexus Infrastructure Ltd." || c.client === "ABC Exports Pvt. Ltd.");
export const MOCK_CLIENT_HEARINGS: Deadline[] = MOCK_DEADLINES.filter((d) => ["1", "5", "7"].includes(d.caseId || ""));
