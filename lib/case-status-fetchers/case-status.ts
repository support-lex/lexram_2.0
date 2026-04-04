import type { SearchResult } from '@/app/dashboard/case-status/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function searchByCNR(cnr: string, opts?: any): Promise<SearchResult> {
  const res = await fetch('/api/case-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ search_type: 'cnr', cnr_number: cnr, ...opts }),
  });
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function searchByAdvocate(params: any): Promise<SearchResult> {
  const res = await fetch('/api/case-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ search_type: 'advocate', ...params }),
  });
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function searchByFiling(params: any): Promise<SearchResult> {
  const res = await fetch('/api/case-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ search_type: 'filing', ...params }),
  });
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function searchByParty(params: any): Promise<SearchResult> {
  const res = await fetch('/api/case-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ search_type: 'party', ...params }),
  });
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function searchByFIR(params: any): Promise<SearchResult> {
  const res = await fetch('/api/case-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ search_type: 'fir', ...params }),
  });
  return res.json();
}

export async function pollJob(jobId: string) {
  const res = await fetch(`/api/jobs/${jobId}`);
  return res.json();
}

export async function waitForJob(jobId: string, maxWait = 60000): Promise<SearchResult> {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const job = await pollJob(jobId);
    if (job.status === 'completed') return job.result;
    if (job.status === 'failed') return { success: false, error: job.error };
    await new Promise(r => setTimeout(r, 2000));
  }
  return { success: false, error: 'Timeout waiting for job' };
}
