export interface Act {
  id: string;
  name: string;
  year: number;
  description?: string;
  content?: unknown;
  source_url?: string;
  indiacode_act_id?: string;
  sync_status: 'pending' | 'syncing' | 'synced' | 'error';
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
  domain?: string;
  act_number?: string;
  ministry?: string;
  indiacode_id?: string;
  short_name?: string;
  full_name?: string;
  preamble?: string;
  objectives?: string;
  indiacode_url?: string;
  handle_id?: string;
  chapter_count?: number;
  sections_count?: number;
}

export interface Section {
  id: string;
  category_id: string;
  number: string;
  heading: string;
  description: string;
  detailed_content?: string;
  tags?: string[];
  related_sections?: string[];
  section?: string;
  detailed_analysis?: string;
  exceptions?: string[];
  procedure?: string;
  content?: string;
  full_text?: string;
  section_url?: string;
  indiacode_section_id?: string;
  amendments?: unknown;
  footnotes?: string;
  headnote?: string;
  marginal_note?: string;
  state_amendments?: unknown;
  amendment_text?: string;
  amendment_date?: string;
  raw_html?: string;
  section_number?: string;
  ai_commentary?: string;
  ai_summary?: string;
  commencement_date?: string;
  enforcement_status?: string;
}

export interface Chapter {
  id: string;
  act_id: string;
  name: string;
  order: number;
  sections: Section[];
  category_id?: string;
  section?: string;
  type?: string;
  metadata?: Record<string, unknown>;
  parent_category_id?: string;
  title?: string;
}

export interface Law extends Act {
  chapters: Chapter[];
  act?: string;
  applicability?: string;
  introduction?: string;
  procedural_note?: string;
  status?: string;
}

export interface Circular {
  id: number;
  circular_number: string;
  title: string;
  issue_date: string;
  ministry?: string;
  authority?: string;
  subject?: string;
  summary?: string;
  status?: string;
  url?: string;
  file_url?: string;
}

export interface Amendment {
  id: number;
  act_id?: string;
  title: string;
  amendment_number?: string;
  enacted_date: string;
  effective_date?: string;
  summary?: string;
  ministry?: string;
  status?: string;
}

export interface SubLegislation {
  id: number;
  title: string;
  parent_act?: string;
  type: 'rule' | 'regulation' | 'notification' | 'order';
  issue_date: string;
  ministry?: string;
  summary?: string;
}

export interface Schedule {
  id: number;
  act_id?: string;
  schedule_number: string;
  title: string;
  description?: string;
}

export interface Domain {
  code: string;
  name: string;
  act_count: number;
  description?: string;
}

export interface Ministry {
  code: string;
  name: string;
  head?: string;
  total_acts?: number;
  total_circulars?: number;
}
