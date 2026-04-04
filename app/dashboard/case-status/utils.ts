// ── CNR validation ───────────────────────────────────────────────────────────

export const isValidCNR = (cnr: string): boolean => {
  const trimmed = cnr.trim();
  return /^[A-Z0-9]{16}$/i.test(trimmed);
};

export const validateCNRs = (cnrs: string[]): { valid: string[]; invalid: string[] } => {
  const valid: string[] = [];
  const invalid: string[] = [];
  cnrs.forEach(cnr => {
    if (isValidCNR(cnr)) {
      valid.push(cnr.trim().toUpperCase());
    } else {
      invalid.push(cnr.trim());
    }
  });
  return { valid, invalid };
};

// ── Mock hearing data generator ───────────────────────────────────────────────

export const generateDetailedHearings = (cnr: string): Array<{
  date: string;
  stage: string;
  purpose: string;
  business_on_date: string;
  detailed_business: string;
  order_date?: string;
  order_details?: string;
}> => {
  const caseNum = cnr.slice(6, 12);
  const year = cnr.slice(12, 16);

  return [
    {
      date: "01-03-2025",
      stage: "Arguments - Defendant",
      purpose: "Hearing",
      business_on_date: "Arguments heard - Defendant side commenced",
      detailed_business: `Case No. ${caseNum} of ${year}. The defendant and his counsel are present. The plaintiff side arguments were concluded on the previous date. The defendant side arguments commenced today and are partially heard. Arguments to continue on the next date. Matter adjourned.`,
      order_date: "01-03-2025",
      order_details: "Arguments partially heard. Matter listed for continuation on 15.03.2025.",
    },
    {
      date: "15-02-2025",
      stage: "Arguments - Plaintiff",
      purpose: "Hearing",
      business_on_date: "Arguments concluded - Plaintiff side completed",
      detailed_business: `Case No. ${caseNum} of ${year}. Both parties present. The plaintiff counsel argues on points 1 to 5 of the issues framed. Arguments on behalf of plaintiff concluded. Defendant counsel to argue on next date.`,
      order_date: "15-02-2025",
      order_details: "Plaintiff arguments concluded. Defendant arguments to commence on next date.",
    },
    {
      date: "01-02-2025",
      stage: "Framing of Issues",
      purpose: "Hearing",
      business_on_date: "Issues 1-4 framed and recorded",
      detailed_business: `Case No. ${caseNum} of ${year}. Both parties present. Issues 1 to 4 framed and recorded. Issues: 1. Whether plaintiff is entitled to relief? 2. Whether defendant caused loss? 3. Quantum of damages? 4. Costs? Arguments to commence from next date.`,
      order_date: "01-02-2025",
      order_details: "Issues 1 to 4 framed. Arguments fixed for 15.02.2025.",
    },
    {
      date: "15-01-2025",
      stage: "Written Statement",
      purpose: "Hearing",
      business_on_date: "WS and replication taken on record",
      detailed_business: `Case No. ${caseNum} of ${year}. Written statement filed by defendant. Replication filed by plaintiff. Both documents taken on record. Parties directed to file issues within two weeks.`,
      order_date: "15-01-2025",
      order_details: "WS and replication on record. Issues to be framed on next date.",
    },
    {
      date: "02-12-2024",
      stage: "Service of Summons",
      purpose: "Hearing",
      business_on_date: "Summons served on defendant",
      detailed_business: `Case No. ${caseNum} of ${year}. Return of summons filed. Defendant served. Time granted for filing written statement.`,
    },
    {
      date: "15-11-2024",
      stage: "Service of Summons",
      purpose: "Hearing",
      business_on_date: "Summons ordered - Ex-parte allowed",
      detailed_business: `Case No. ${caseNum} of ${year}. Plaintiff present. Ex-parte evidence allowed if defendant fails to appear. Summons to be served through process server.`,
    },
  ];
};

// ── Status color helper ───────────────────────────────────────────────────────

export const getStatusColor = (status: string): string => {
  const s = status.toLowerCase();
  if (s.includes('pending') || s.includes('active'))
    return 'text-amber-600 bg-amber-500/10 ring-1 ring-amber-500/20';
  if (s.includes('disposed') || s.includes('closed'))
    return 'text-emerald-600 bg-emerald-500/10 ring-1 ring-emerald-500/20';
  if (s.includes('adjourned'))
    return 'text-orange-600 bg-orange-500/10 ring-1 ring-orange-500/20';
  return 'text-blue-600 bg-blue-500/10 ring-1 ring-blue-500/20';
};

// ── Date helper ───────────────────────────────────────────────────────────────

export const isUpcomingHearing = (date: string): boolean => {
  if (!date) return false;
  const hearingDate = new Date(date);
  const today = new Date();
  const diffDays = Math.ceil(
    (hearingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays >= 0 && diffDays <= 7;
};

// ── CSV parsing ───────────────────────────────────────────────────────────────

export const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

export type CsvRow = {
  cnr_number: string;
  case_name?: string;
  state?: string;
  district?: string;
  establishment?: string;
  case_type?: string;
  case_number?: string;
  year?: string;
};

export const parseCSV = (text: string): CsvRow[] => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(',')
    .map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

  const colMap = {
    cnr: headers.findIndex(h => h.includes('cnr')),
    name: headers.findIndex(h => h.includes('name') && !h.includes('cnr')),
    state: headers.findIndex(h => h.includes('state')),
    district: headers.findIndex(h => h.includes('district')),
    establishment: headers.findIndex(
      h => h.includes('establishment') || h.includes('court')
    ),
    case_type: headers.findIndex(h => h.includes('type')),
    case_number: headers.findIndex(
      h => h.includes('number') && !h.includes('cnr')
    ),
    year: headers.findIndex(h => h.includes('year')),
  };

  const results: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const cnr = colMap.cnr >= 0 ? values[colMap.cnr]?.trim() : '';
    if (!cnr) continue;

    results.push({
      cnr_number: cnr.replace(/['"]/g, ''),
      case_name:
        colMap.name >= 0
          ? values[colMap.name]?.replace(/['"]/g, '')
          : undefined,
      state:
        colMap.state >= 0
          ? values[colMap.state]?.replace(/['"]/g, '')
          : undefined,
      district:
        colMap.district >= 0
          ? values[colMap.district]?.replace(/['"]/g, '')
          : undefined,
      establishment:
        colMap.establishment >= 0
          ? values[colMap.establishment]?.replace(/['"]/g, '')
          : undefined,
      case_type:
        colMap.case_type >= 0
          ? values[colMap.case_type]?.replace(/['"]/g, '')
          : undefined,
      case_number:
        colMap.case_number >= 0
          ? values[colMap.case_number]?.replace(/['"]/g, '')
          : undefined,
      year:
        colMap.year >= 0
          ? values[colMap.year]?.replace(/['"]/g, '')
          : undefined,
    });
  }

  return results;
};
