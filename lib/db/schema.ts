export interface CaseWithDetails {
  cnr_number: string;
  case_number: string;
  case_title: string;
  case_type?: string;
  filing_date: string;
  filing_number?: string;
  court_name: string;
  status: string;
  next_hearing_date: string;
  case_stage: string;
  petitioner: string;
  respondent: string;
  updated_at: string;
  state?: string;
  district?: string;
  establishment?: string;
  registration_date?: string;
  registration_number?: string;
  first_hearing_date?: string;
  decision_date?: string;
  disposal_date?: string;
  nature_of_disposal?: string;
  judge?: string;
  bench?: string;
  advocate?: string;
  petitioner_advocate?: string;
  respondent_advocate?: string;
  act?: string;
  section?: string;
  fir_number?: string;
  fir_year?: string;
  fir_ps?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hearings?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orders?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documents?: any[];
  case_history?: Array<{ label: string; value: string }>;
  ia_status?: Array<{ ia_number: string; ia_status: string; ia_date?: string }> | string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parties?: any[];
  // Allow additional fields from backend
  [key: string]: unknown;
}
