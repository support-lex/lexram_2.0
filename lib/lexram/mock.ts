import type {
  Act,
  Amendment,
  Chapter,
  Circular,
  Domain,
  Law,
  Ministry,
  Schedule,
  Section,
  SubLegislation,
} from './types';

const NOW = '2026-01-15T10:00:00Z';

export const MOCK_DOMAINS: Domain[] = [
  { code: 'family', name: 'Family Law', act_count: 12 },
  { code: 'criminal', name: 'Criminal Law', act_count: 18 },
  { code: 'labour', name: 'Labour Law', act_count: 22 },
  { code: 'civil', name: 'Civil Law', act_count: 15 },
  { code: 'banking', name: 'Banking Law', act_count: 9 },
  { code: 'constitutional', name: 'Constitutional Law', act_count: 6 },
  { code: 'corporate', name: 'Corporate Law', act_count: 14 },
  { code: 'tax', name: 'Tax Law', act_count: 11 },
  { code: 'ip', name: 'IP Law', act_count: 7 },
];

export const MOCK_MINISTRIES: Ministry[] = [
  { code: 'MCA', name: 'Corporate Affairs', total_acts: 14, total_circulars: 210 },
  { code: 'MOF', name: 'Finance', total_acts: 22, total_circulars: 450 },
  { code: 'MOL', name: 'Labour & Employment', total_acts: 18, total_circulars: 180 },
  { code: 'MHA', name: 'Home Affairs', total_acts: 21, total_circulars: 95 },
  { code: 'MEITY', name: 'Electronics & IT', total_acts: 6, total_circulars: 120 },
  { code: 'MOHFW', name: 'Health & Family Welfare', total_acts: 11, total_circulars: 140 },
];

export const MOCK_ACTS: Act[] = [
  {
    id: 'ca-2013',
    name: 'Companies Act, 2013',
    year: 2013,
    description: 'Regulates the incorporation, responsibilities, and dissolution of companies in India.',
    domain: 'Corporate Law',
    ministry: 'Corporate Affairs',
    act_number: '18 of 2013',
    short_name: 'Companies Act',
    full_name: 'The Companies Act, 2013',
    sync_status: 'synced',
    chapter_count: 29,
    sections_count: 470,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'it-2000',
    name: 'Information Technology Act, 2000',
    year: 2000,
    description: 'Governs digital transactions and cybercrime in India.',
    domain: 'IP Law',
    ministry: 'Electronics & IT',
    act_number: '21 of 2000',
    sync_status: 'synced',
    chapter_count: 13,
    sections_count: 94,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'bns-2023',
    name: 'Bharatiya Nyaya Sanhita, 2023',
    year: 2023,
    description: 'Replaces the Indian Penal Code, 1860. Main substantive criminal law.',
    domain: 'Criminal Law',
    ministry: 'Home Affairs',
    act_number: '45 of 2023',
    sync_status: 'synced',
    chapter_count: 20,
    sections_count: 358,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'ida-1947',
    name: 'Industrial Disputes Act, 1947',
    year: 1947,
    description: 'Provides machinery for investigation and settlement of industrial disputes.',
    domain: 'Labour Law',
    ministry: 'Labour & Employment',
    act_number: '14 of 1947',
    sync_status: 'synced',
    chapter_count: 7,
    sections_count: 40,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'hma-1955',
    name: 'Hindu Marriage Act, 1955',
    year: 1955,
    description: 'Codifies the law relating to marriage among Hindus.',
    domain: 'Family Law',
    ministry: 'Law & Justice',
    act_number: '25 of 1955',
    sync_status: 'synced',
    chapter_count: 6,
    sections_count: 29,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'ita-1961',
    name: 'Income-tax Act, 1961',
    year: 1961,
    description: 'Charging statute for levy and collection of income tax in India.',
    domain: 'Tax Law',
    ministry: 'Finance',
    act_number: '43 of 1961',
    sync_status: 'synced',
    chapter_count: 23,
    sections_count: 298,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'rbia-1934',
    name: 'Reserve Bank of India Act, 1934',
    year: 1934,
    description: 'Constitutes the Reserve Bank of India, the central banking institution.',
    domain: 'Banking Law',
    ministry: 'Finance',
    act_number: '2 of 1934',
    sync_status: 'syncing',
    chapter_count: 5,
    sections_count: 61,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'cpc-1908',
    name: 'Code of Civil Procedure, 1908',
    year: 1908,
    description: 'Consolidates the law relating to procedure in civil courts.',
    domain: 'Civil Law',
    ministry: 'Law & Justice',
    act_number: '5 of 1908',
    sync_status: 'synced',
    chapter_count: 12,
    sections_count: 158,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'dpdp-2023',
    name: 'Digital Personal Data Protection Act, 2023',
    year: 2023,
    description: 'Protects digital personal data and regulates its processing.',
    domain: 'IP Law',
    ministry: 'Electronics & IT',
    act_number: '22 of 2023',
    sync_status: 'pending',
    chapter_count: 9,
    sections_count: 44,
    created_at: NOW,
    updated_at: NOW,
  },
];

const EXAMPLE_SECTIONS: Section[] = [
  {
    id: 'sec-1',
    category_id: 'ch-1',
    number: '1',
    heading: 'Short title, extent, commencement and application',
    description: 'This Act may be called the Companies Act, 2013. It extends to the whole of India.',
    tags: ['preliminary', 'extent'],
  },
  {
    id: 'sec-2',
    category_id: 'ch-1',
    number: '2',
    heading: 'Definitions',
    description: 'In this Act, unless the context otherwise requires, the following definitions apply.',
    tags: ['definitions'],
  },
  {
    id: 'sec-3',
    category_id: 'ch-2',
    number: '3',
    heading: 'Formation of company',
    description: 'A company may be formed for any lawful purpose by any number of persons.',
    tags: ['formation', 'incorporation'],
  },
];

const EXAMPLE_CHAPTERS: Chapter[] = [
  {
    id: 'ch-1',
    act_id: 'ca-2013',
    name: 'Preliminary',
    title: 'Preliminary',
    order: 1,
    sections: EXAMPLE_SECTIONS.slice(0, 2),
  },
  {
    id: 'ch-2',
    act_id: 'ca-2013',
    name: 'Incorporation of Company and Matters Incidental Thereto',
    title: 'Incorporation of Company',
    order: 2,
    sections: EXAMPLE_SECTIONS.slice(2, 3),
  },
];

export function mockLaw(actId: string): Law {
  const base = MOCK_ACTS.find((a) => a.id === actId) ?? MOCK_ACTS[0];
  return {
    ...base,
    chapters: EXAMPLE_CHAPTERS,
    applicability: 'Applies to whole of India, including companies incorporated outside India but operating within.',
    introduction: 'An Act to consolidate and amend the law relating to companies.',
    procedural_note: 'Sections referenced herein are as per the official Gazette notification.',
    status: 'In force',
  };
}

export const MOCK_CIRCULARS: Circular[] = [
  { id: 1, circular_number: 'RBI/2025-26/12', title: 'Master Direction on Digital Lending', issue_date: '2025-11-02', ministry: 'Finance', authority: 'RBI', subject: 'Digital Lending Norms', status: 'Active' },
  { id: 2, circular_number: 'SEBI/HO/2025/45', title: 'Disclosure Requirements for ESG Funds', issue_date: '2025-10-18', ministry: 'Finance', authority: 'SEBI', subject: 'ESG Disclosure', status: 'Active' },
  { id: 3, circular_number: 'MCA/22/2025', title: 'Relaxation of CSR Reporting Requirements', issue_date: '2025-09-30', ministry: 'Corporate Affairs', authority: 'MCA', subject: 'CSR Compliance', status: 'Active' },
  { id: 4, circular_number: 'CBDT/15/2025', title: 'Clarification on TDS on Cryptocurrency', issue_date: '2025-08-22', ministry: 'Finance', authority: 'CBDT', subject: 'TDS Cryptocurrency', status: 'Active' },
  { id: 5, circular_number: 'MEITY/9/2025', title: 'Guidelines for Synthetic Media Disclosure', issue_date: '2025-07-11', ministry: 'Electronics & IT', authority: 'MeitY', subject: 'AI/Deepfake Rules', status: 'Draft' },
  { id: 6, circular_number: 'EPFO/4/2025', title: 'Higher Pension Option Window Extension', issue_date: '2025-06-05', ministry: 'Labour & Employment', authority: 'EPFO', subject: 'Pension Reform', status: 'Active' },
];

export const MOCK_AMENDMENTS: Amendment[] = [
  { id: 1, act_id: 'ca-2013', title: 'Companies (Amendment) Act, 2025', amendment_number: '18 of 2025', enacted_date: '2025-08-15', effective_date: '2025-10-01', summary: 'Clarifies beneficial ownership disclosure thresholds and CSR spend rules.', ministry: 'Corporate Affairs', status: 'In force' },
  { id: 2, act_id: 'ita-1961', title: 'Finance Act, 2025', amendment_number: '5 of 2025', enacted_date: '2025-04-01', effective_date: '2025-04-01', summary: 'Revises tax slabs and introduces new digital asset provisions.', ministry: 'Finance', status: 'In force' },
  { id: 3, act_id: 'it-2000', title: 'IT (Amendment) Act, 2024', amendment_number: '9 of 2024', enacted_date: '2024-12-20', effective_date: '2025-02-01', summary: 'Adds provisions for intermediary liability and takedown timelines.', ministry: 'Electronics & IT', status: 'In force' },
  { id: 4, act_id: 'bns-2023', title: 'BNS (Amendment) Bill, 2025', amendment_number: 'Pending', enacted_date: '2025-09-10', summary: 'Proposed amendments on organised crime definition.', ministry: 'Home Affairs', status: 'Pending' },
];

export const MOCK_SUB_LEGISLATION: SubLegislation[] = [
  { id: 1, title: 'Companies (Corporate Social Responsibility Policy) Rules', parent_act: 'Companies Act, 2013', type: 'rule', issue_date: '2014-02-27', ministry: 'Corporate Affairs', summary: 'Implementation rules for Section 135 CSR obligations.' },
  { id: 2, title: 'SEBI (LODR) Regulations', parent_act: 'SEBI Act, 1992', type: 'regulation', issue_date: '2015-09-02', ministry: 'Finance', summary: 'Listing obligations and disclosure requirements for listed entities.' },
  { id: 3, title: 'IT Intermediary Guidelines 2025', parent_act: 'IT Act, 2000', type: 'rule', issue_date: '2025-02-10', ministry: 'Electronics & IT', summary: 'Rules for social media intermediaries and significant platforms.' },
  { id: 4, title: 'Industrial Disputes (Central) Rules', parent_act: 'Industrial Disputes Act, 1947', type: 'rule', issue_date: '1957-07-10', ministry: 'Labour & Employment', summary: 'Procedural rules for dispute resolution machinery.' },
  { id: 5, title: 'Notification on e-Invoicing Threshold', parent_act: 'CGST Act, 2017', type: 'notification', issue_date: '2025-05-01', ministry: 'Finance', summary: 'Reduces e-invoicing threshold to INR 5 crore turnover.' },
];

export const MOCK_SCHEDULES: Schedule[] = [
  { id: 1, act_id: 'ca-2013', schedule_number: 'Schedule VII', title: 'CSR Activities', description: 'Activities that may be included by companies in their CSR policies.' },
  { id: 2, act_id: 'ca-2013', schedule_number: 'Schedule V', title: 'Managerial Remuneration', description: 'Conditions for appointment and remuneration of managerial personnel.' },
  { id: 3, act_id: 'ita-1961', schedule_number: 'First Schedule', title: 'Insurance Business', description: 'Rules for computation of profits of insurance business.' },
];

export interface PulsePoint {
  date: string;
  acts: number;
  circulars: number;
  amendments: number;
}

export const MOCK_PULSE: PulsePoint[] = Array.from({ length: 12 }).map((_, i) => ({
  date: new Date(2025, i, 1).toISOString().slice(0, 10),
  acts: Math.floor(Math.random() * 6) + 1,
  circulars: Math.floor(Math.random() * 30) + 10,
  amendments: Math.floor(Math.random() * 8) + 2,
}));
