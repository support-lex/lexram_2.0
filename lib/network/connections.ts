"use client";

import { supabase } from "@/lib/supabase/client";
import type { Connection, ConnectionStatus, NetworkProfile } from "@/types/network";

export type ConnectionWithProfile = Connection & {
  other: Pick<NetworkProfile, "id" | "display_name" | "headline" | "avatar_url"> | null;
};

async function hydrateProfiles(
  rows: Connection[],
  currentUserId: string,
): Promise<ConnectionWithProfile[]> {
  if (!rows.length) return [];
  const otherIds = Array.from(
    new Set(rows.map((r) => (r.requester_id === currentUserId ? r.addressee_id : r.requester_id))),
  );
  const { data: profiles } = await supabase()
    .from("network_profiles")
    .select("id, display_name, headline, avatar_url")
    .in("id", otherIds);
  const map = new Map((profiles ?? []).map((p) => [p.id, p]));
  return rows.map((r) => {
    const otherId = r.requester_id === currentUserId ? r.addressee_id : r.requester_id;
    return { ...r, other: map.get(otherId) ?? null };
  });
}

export async function listIncomingInvitations(
  currentUserId: string,
): Promise<ConnectionWithProfile[]> {
  const { data, error } = await supabase()
    .from("network_connections")
    .select("*")
    .eq("addressee_id", currentUserId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return hydrateProfiles((data ?? []) as Connection[], currentUserId);
}

export async function listOutgoingInvitations(
  currentUserId: string,
): Promise<ConnectionWithProfile[]> {
  const { data, error } = await supabase()
    .from("network_connections")
    .select("*")
    .eq("requester_id", currentUserId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return hydrateProfiles((data ?? []) as Connection[], currentUserId);
}

export async function listAcceptedConnections(
  currentUserId: string,
): Promise<ConnectionWithProfile[]> {
  const { data, error } = await supabase()
    .from("network_connections")
    .select("*")
    .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
    .eq("status", "accepted")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return hydrateProfiles((data ?? []) as Connection[], currentUserId);
}

export async function getConnectionStatus(
  currentUserId: string,
  otherUserId: string,
): Promise<{ status: ConnectionStatus; direction: "in" | "out" } | null> {
  const { data, error } = await supabase()
    .from("network_connections")
    .select("*")
    .or(
      `and(requester_id.eq.${currentUserId},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${currentUserId})`,
    )
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  if (!data) return null;
  return {
    status: data.status,
    direction: data.requester_id === currentUserId ? "out" : "in",
  };
}

export async function sendInvitation(currentUserId: string, addresseeId: string): Promise<Connection> {
  const { data, error } = await supabase()
    .from("network_connections")
    .insert({ requester_id: currentUserId, addressee_id: addresseeId, status: "pending" })
    .select("*")
    .single();
  if (error) throw error;
  return data as Connection;
}

export async function acceptInvitation(connectionId: string): Promise<void> {
  const { error } = await supabase()
    .from("network_connections")
    .update({ status: "accepted" })
    .eq("id", connectionId);
  if (error) throw error;
}

export async function ignoreInvitation(connectionId: string): Promise<void> {
  const { error } = await supabase()
    .from("network_connections")
    .update({ status: "ignored" })
    .eq("id", connectionId);
  if (error) throw error;
}

export async function removeConnection(connectionId: string): Promise<void> {
  const { error } = await supabase().from("network_connections").delete().eq("id", connectionId);
  if (error) throw error;
}
