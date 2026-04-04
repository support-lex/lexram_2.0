export interface TrackedCase {
  id: string;
  cnr_number?: string;
  case_name?: string;
  state?: string;
  district?: string;
  establishment?: string;
  case_type?: string;
  case_number?: string;
  year?: string;
  last_updated?: string;
  status?: {
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
    act?: string;
    section?: string;
    documents?: Array<{ title: string; type: string; date: string; url: string }>;
    case_history?: Array<{ label: string; value: string }>;
    ia_status?: Array<{ ia_number: string; ia_status: string; ia_date?: string }> | string[];
    hearings?: Array<{
      date: string;
      stage: string;
      purpose: string;
      business_on_date: string;
      detailed_business: string;
      order_date?: string;
      order_details?: string;
      next_hearing_date?: string;
      judge_name?: string;
      court?: string;
    }>;
    orders?: Array<{ text: string; date: string }>;
    parties?: string[];
  };
  notification_enabled: boolean;
  created_at: string;
}

export interface SearchResult {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  job_id?: string;
  error?: string;
}
