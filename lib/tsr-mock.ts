// Fixture data for the TSR My Cases page. Used until the backend `/my-cases`
// endpoint ships (it currently 500s with "SUPABASE_JWT_SECRET missing"). The
// fixtures cover every UI state — multiple statuses, varying doc counts,
// some with reports + token_usage, some without, page_count nulls — so the
// page can be designed end-to-end without a working backend.
//
// When the backend is live, the My Cases page tries it first and falls back
// to this fixture if the call fails. Remove this file once the backend is
// stable.

import type { TsrCaseSummary } from "./tsr-api";

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const iso = (offsetDays: number) => new Date(now - offsetDays * DAY).toISOString();

export const MOCK_CASES: TsrCaseSummary[] = [
  {
    id:             "00000000-0000-4000-a000-000000000001",
    case_name:      "Rajesh Kumar",
    case_no:        "TSR/2026/0142",
    bank_name:      "Indian Bank — Anna Salai Branch",
    status:         "complete",
    progress:       100,
    status_message: "Scrutiny report ready for download.",
    token_usage:    { input_tokens: 142_840, output_tokens: 18_240, total_tokens: 161_080, model: "gemini-2.5-pro" },
    scrutiny_report:  { __mock: true },
    master_case_json: { property_address: "Plot 47, Adyar, Chennai 600020", parties: "Rajesh Kumar vs. Indian Bank" },
    active_queries:   [],
    created_at:     iso(2),
    document_count: 7,
    documents: [
      { id: "d1", filename: "sale_deed_2018.pdf",          storage_path: "gs://lexram-enterprise-docs/cases/01/sale_deed_2018.pdf",          mime_type: "application/pdf", file_size:  2_843_120, page_count: 24,  status: "processed", created_at: iso(2) },
      { id: "d2", filename: "encumbrance_certificate.pdf", storage_path: "gs://lexram-enterprise-docs/cases/01/encumbrance_certificate.pdf", mime_type: "application/pdf", file_size:  1_142_900, page_count:  8,  status: "processed", created_at: iso(2) },
      { id: "d3", filename: "patta_extract.pdf",           storage_path: "gs://lexram-enterprise-docs/cases/01/patta_extract.pdf",           mime_type: "application/pdf", file_size:    482_300, page_count:  2,  status: "processed", created_at: iso(2) },
      { id: "d4", filename: "approved_layout_plan.jpg",    storage_path: "gs://lexram-enterprise-docs/cases/01/approved_layout_plan.jpg",    mime_type: "image/jpeg",      file_size:  3_241_700, page_count:  1,  status: "processed", created_at: iso(2) },
      { id: "d5", filename: "mother_deed_1992.pdf",        storage_path: "gs://lexram-enterprise-docs/cases/01/mother_deed_1992.pdf",        mime_type: "application/pdf", file_size:  4_810_220, page_count: 41,  status: "processed", created_at: iso(2) },
      { id: "d6", filename: "khatha_certificate.pdf",      storage_path: "gs://lexram-enterprise-docs/cases/01/khatha_certificate.pdf",      mime_type: "application/pdf", file_size:    298_100, page_count:  3,  status: "processed", created_at: iso(2) },
      { id: "d7", filename: "noc_bank.pdf",                storage_path: "gs://lexram-enterprise-docs/cases/01/noc_bank.pdf",                mime_type: "application/pdf", file_size:    156_780, page_count:  2,  status: "processed", created_at: iso(2) },
    ],
  },
  {
    id:             "00000000-0000-4000-a000-000000000002",
    case_name:      "Lakshmi Estate",
    case_no:        "TSR/2026/0141",
    bank_name:      "State Bank of India — Mylapore",
    status:         "querying",
    progress:       68,
    status_message: "Gemini analysing 12 document(s)…",
    token_usage:    null,
    scrutiny_report:  null,
    master_case_json: { property_address: "Survey No. 218/3, Mylapore, Chennai 600004" },
    active_queries:   [],
    created_at:     iso(0),
    document_count: 12,
    documents: [
      { id: "d8",  filename: "sale_deed_lakshmi.pdf",  storage_path: "gs://…", mime_type: "application/pdf", file_size:  2_120_000, page_count: 18,   status: "processed",  created_at: iso(0) },
      { id: "d9",  filename: "ec_2014_2024.pdf",       storage_path: "gs://…", mime_type: "application/pdf", file_size:  1_580_300, page_count: 12,   status: "processed",  created_at: iso(0) },
      { id: "d10", filename: "gpa_signed.pdf",         storage_path: "gs://…", mime_type: "application/pdf", file_size:    984_200, page_count:  6,   status: "processed",  created_at: iso(0) },
      { id: "d11", filename: "scanned_court_order.jpg",storage_path: "gs://…", mime_type: "image/jpeg",      file_size:  2_840_100, page_count:  1,   status: "processed",  created_at: iso(0) },
      { id: "d12", filename: "tax_receipts_2020.pdf",  storage_path: "gs://…", mime_type: "application/pdf", file_size:    412_400, page_count:  4,   status: "processed",  created_at: iso(0) },
      { id: "d13", filename: "building_plan_2019.pdf", storage_path: "gs://…", mime_type: "application/pdf", file_size:  3_120_200, page_count: null, status: "processing", created_at: iso(0) },
      { id: "d14", filename: "completion_cert.pdf",    storage_path: "gs://…", mime_type: "application/pdf", file_size:    742_800, page_count:  3,   status: "processed",  created_at: iso(0) },
      { id: "d15", filename: "occupancy_cert.pdf",     storage_path: "gs://…", mime_type: "application/pdf", file_size:    518_300, page_count:  2,   status: "processed",  created_at: iso(0) },
      { id: "d16", filename: "sub_division_plan.pdf",  storage_path: "gs://…", mime_type: "application/pdf", file_size:  1_204_500, page_count:  5,   status: "processed",  created_at: iso(0) },
      { id: "d17", filename: "khatha_lakshmi.pdf",     storage_path: "gs://…", mime_type: "application/pdf", file_size:    198_700, page_count:  3,   status: "processed",  created_at: iso(0) },
      { id: "d18", filename: "patta_2023.pdf",         storage_path: "gs://…", mime_type: "application/pdf", file_size:    312_600, page_count:  2,   status: "processed",  created_at: iso(0) },
      { id: "d19", filename: "fmb_sketch.tiff",        storage_path: "gs://…", mime_type: "image/tiff",      file_size:  4_120_900, page_count:  1,   status: "processed",  created_at: iso(0) },
    ],
  },
  {
    id:             "00000000-0000-4000-a000-000000000003",
    case_name:      "ABC Properties LLP",
    case_no:        "TSR/2026/0138",
    bank_name:      "HDFC Bank — Nungambakkam",
    status:         "complete",
    progress:       100,
    status_message: "Scrutiny report ready.",
    token_usage:    { input_tokens: 84_120, output_tokens: 10_840, total_tokens: 94_960, model: "gemini-2.5-pro" },
    scrutiny_report:  { __mock: true },
    master_case_json: { parties: "ABC Properties LLP" },
    active_queries:   [],
    created_at:     iso(8),
    document_count: 4,
    documents: [
      { id: "d20", filename: "sale_deed_abc.pdf",     storage_path: "gs://…", mime_type: "application/pdf", file_size: 1_820_300, page_count: 16, status: "processed", created_at: iso(8) },
      { id: "d21", filename: "ec_abc.pdf",            storage_path: "gs://…", mime_type: "application/pdf", file_size:   942_100, page_count:  9, status: "processed", created_at: iso(8) },
      { id: "d22", filename: "noc_corporation.pdf",   storage_path: "gs://…", mime_type: "application/pdf", file_size:   218_400, page_count:  2, status: "processed", created_at: iso(8) },
      { id: "d23", filename: "approved_plan_abc.jpg", storage_path: "gs://…", mime_type: "image/jpeg",      file_size: 2_412_800, page_count:  1, status: "processed", created_at: iso(8) },
    ],
  },
  {
    id:             "00000000-0000-4000-a000-000000000004",
    case_name:      "Padmavathi Iyer",
    case_no:        "TSR/2026/0136",
    bank_name:      "Axis Bank — T. Nagar",
    status:         "error",
    progress:       42,
    status_message: "Gemini returned malformed JSON — please re-upload.",
    token_usage:    null,
    scrutiny_report:  null,
    master_case_json: {},
    active_queries:   [],
    created_at:     iso(14),
    document_count: 3,
    documents: [
      { id: "d24", filename: "sale_deed_padmavathi.pdf", storage_path: "gs://…", mime_type: "application/pdf", file_size: 2_104_700, page_count: null, status: "error",     created_at: iso(14) },
      { id: "d25", filename: "ec_padmavathi.pdf",        storage_path: "gs://…", mime_type: "application/pdf", file_size:   842_300, page_count: null, status: "processed", created_at: iso(14) },
      { id: "d26", filename: "scanned_patta.jpg",        storage_path: "gs://…", mime_type: "image/jpeg",      file_size: 1_840_200, page_count: null, status: "processed", created_at: iso(14) },
    ],
  },
  {
    id:             "00000000-0000-4000-a000-000000000005",
    case_name:      "Sundaram Finance — Branch Audit",
    case_no:        "TSR/2026/0130",
    bank_name:      "Sundaram Finance Ltd.",
    status:         "new",
    progress:       0,
    status_message: "Awaiting first document upload.",
    token_usage:    null,
    scrutiny_report:  null,
    master_case_json: {},
    active_queries:   [],
    created_at:     iso(21),
    document_count: 0,
    documents: [],
  },
];

/** Returns a defensive deep copy so the page never mutates the shared module-level array. */
export function getMockCases(): TsrCaseSummary[] {
  return JSON.parse(JSON.stringify(MOCK_CASES)) as TsrCaseSummary[];
}
