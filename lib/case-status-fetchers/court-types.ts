export interface CourtType {
  code: string;
  name: string;
}

export async function getCourtTypes(): Promise<CourtType[]> {
  const res = await fetch('/api/court-types');
  return res.json();
}
