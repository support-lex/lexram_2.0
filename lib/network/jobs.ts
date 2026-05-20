"use client";

import { supabase } from "@/lib/supabase/client";
import type { JobApplication, JobLevel, JobType, NetworkJob } from "@/types/network";

export type JobFilters = {
  query?: string;
  location?: string;
  level?: JobLevel | "Any";
  jobType?: JobType | "Any";
  remoteOnly?: boolean;
  easyOnly?: boolean;
  salaryFloor?: number;
  postedWithinDays?: number;
};

export async function listJobs(
  filters: JobFilters,
  currentUserId: string | null,
): Promise<NetworkJob[]> {
  const sb = supabase();
  let q = sb.from("network_jobs").select("*").order("created_at", { ascending: false });

  if (filters.query?.trim()) {
    const term = filters.query.trim();
    q = q.or(`title.ilike.%${term}%,company.ilike.%${term}%`);
  }
  if (filters.location?.trim()) {
    q = q.ilike("location", `%${filters.location.trim()}%`);
  }
  if (filters.level && filters.level !== "Any") q = q.eq("level", filters.level);
  if (filters.jobType && filters.jobType !== "Any") q = q.eq("job_type", filters.jobType);
  if (filters.remoteOnly) q = q.eq("remote", true);
  if (filters.easyOnly) q = q.eq("easy_apply", true);
  if (filters.salaryFloor && filters.salaryFloor > 0) {
    q = q.gte("salary_high", filters.salaryFloor);
  }
  if (filters.postedWithinDays && Number.isFinite(filters.postedWithinDays)) {
    const cutoff = new Date(Date.now() - filters.postedWithinDays * 24 * 3600 * 1000).toISOString();
    q = q.gte("created_at", cutoff);
  }

  const { data, error } = await q;
  if (error) throw error;
  const jobs = (data ?? []) as NetworkJob[];

  if (currentUserId && jobs.length) {
    const ids = jobs.map((j) => j.id);
    const [{ data: saved }, { data: applied }] = await Promise.all([
      sb.from("network_saved_jobs").select("job_id").eq("user_id", currentUserId).in("job_id", ids),
      sb
        .from("network_job_applications")
        .select("job_id")
        .eq("applicant_id", currentUserId)
        .in("job_id", ids),
    ]);
    const savedSet = new Set((saved ?? []).map((s) => s.job_id));
    const appliedSet = new Set((applied ?? []).map((a) => a.job_id));
    return jobs.map((j) => ({
      ...j,
      saved_by_me: savedSet.has(j.id),
      applied_by_me: appliedSet.has(j.id),
    }));
  }
  return jobs;
}

export async function createJob(
  postedBy: string,
  job: Omit<
    NetworkJob,
    "id" | "posted_by" | "applicants_count" | "created_at" | "saved_by_me" | "applied_by_me"
  >,
): Promise<NetworkJob> {
  const { data, error } = await supabase()
    .from("network_jobs")
    .insert({ ...job, posted_by: postedBy })
    .select("*")
    .single();
  if (error) throw error;
  return data as NetworkJob;
}

export async function deleteJob(jobId: string): Promise<void> {
  const { error } = await supabase().from("network_jobs").delete().eq("id", jobId);
  if (error) throw error;
}

export async function saveJob(jobId: string, userId: string): Promise<void> {
  const { error } = await supabase()
    .from("network_saved_jobs")
    .insert({ job_id: jobId, user_id: userId });
  if (error && error.code !== "23505") throw error;
}

export async function unsaveJob(jobId: string, userId: string): Promise<void> {
  const { error } = await supabase()
    .from("network_saved_jobs")
    .delete()
    .eq("job_id", jobId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function applyToJob(
  jobId: string,
  applicantId: string,
  coverLetter?: string,
): Promise<JobApplication> {
  const { data, error } = await supabase()
    .from("network_job_applications")
    .insert({ job_id: jobId, applicant_id: applicantId, cover_letter: coverLetter ?? null })
    .select("*")
    .single();
  if (error) throw error;
  return data as JobApplication;
}

export async function listMyApplications(applicantId: string): Promise<JobApplication[]> {
  const { data, error } = await supabase()
    .from("network_job_applications")
    .select("*")
    .eq("applicant_id", applicantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as JobApplication[];
}
