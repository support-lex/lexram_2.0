"use client";

import { supabase } from "@/lib/supabase/client";
import type {
  NetworkProfile,
  ProfileEducation,
  ProfileExperience,
} from "@/types/network";

export async function getProfile(userId: string): Promise<NetworkProfile | null> {
  const { data, error } = await supabase()
    .from("network_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return (data ?? null) as NetworkProfile | null;
}

export async function ensureProfile(
  userId: string,
  fallbackDisplayName: string,
): Promise<NetworkProfile> {
  const existing = await getProfile(userId);
  if (existing) return existing;
  const { data, error } = await supabase()
    .from("network_profiles")
    .insert({ id: userId, display_name: fallbackDisplayName })
    .select("*")
    .single();
  if (error) throw error;
  return data as NetworkProfile;
}

export async function updateProfile(
  userId: string,
  patch: Partial<Omit<NetworkProfile, "id" | "created_at" | "updated_at" | "profile_views">>,
): Promise<NetworkProfile> {
  const { data, error } = await supabase()
    .from("network_profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data as NetworkProfile;
}

export async function listExperiences(userId: string): Promise<ProfileExperience[]> {
  const { data, error } = await supabase()
    .from("network_profile_experiences")
    .select("*")
    .eq("user_id", userId)
    .order("start_date", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as ProfileExperience[];
}

export async function addExperience(
  userId: string,
  exp: Omit<ProfileExperience, "id" | "user_id" | "created_at">,
): Promise<ProfileExperience> {
  const { data, error } = await supabase()
    .from("network_profile_experiences")
    .insert({ ...exp, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data as ProfileExperience;
}

export async function deleteExperience(id: string): Promise<void> {
  const { error } = await supabase().from("network_profile_experiences").delete().eq("id", id);
  if (error) throw error;
}

export async function listEducations(userId: string): Promise<ProfileEducation[]> {
  const { data, error } = await supabase()
    .from("network_profile_educations")
    .select("*")
    .eq("user_id", userId)
    .order("end_year", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as ProfileEducation[];
}

export async function addEducation(
  userId: string,
  edu: Omit<ProfileEducation, "id" | "user_id" | "created_at">,
): Promise<ProfileEducation> {
  const { data, error } = await supabase()
    .from("network_profile_educations")
    .insert({ ...edu, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data as ProfileEducation;
}

export async function deleteEducation(id: string): Promise<void> {
  const { error } = await supabase().from("network_profile_educations").delete().eq("id", id);
  if (error) throw error;
}

export async function searchProfiles(
  query: string,
  limit = 20,
): Promise<NetworkProfile[]> {
  const sb = supabase();
  let q = sb.from("network_profiles").select("*").limit(limit);
  if (query.trim()) {
    q = q.or(`display_name.ilike.%${query}%,headline.ilike.%${query}%`);
  } else {
    q = q.order("created_at", { ascending: false });
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as NetworkProfile[];
}

export async function suggestProfiles(
  currentUserId: string,
  limit = 8,
): Promise<NetworkProfile[]> {
  // Exclude self + any user already connected/pending with current user.
  const sb = supabase();
  const { data: links } = await sb
    .from("network_connections")
    .select("requester_id, addressee_id")
    .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`);
  const excluded = new Set<string>([currentUserId]);
  (links ?? []).forEach((l: { requester_id: string; addressee_id: string }) => {
    excluded.add(l.requester_id);
    excluded.add(l.addressee_id);
  });

  const { data, error } = await sb
    .from("network_profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.max(limit + excluded.size, limit));
  if (error) throw error;
  return ((data ?? []) as NetworkProfile[])
    .filter((p) => !excluded.has(p.id))
    .slice(0, limit);
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const sb = supabase();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await sb.storage.from("network-avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;
  const { data } = sb.storage.from("network-avatars").getPublicUrl(path);
  await updateProfile(userId, { avatar_url: data.publicUrl });
  return data.publicUrl;
}
