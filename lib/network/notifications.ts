"use client";

import { supabase } from "@/lib/supabase/client";
import type { NetworkNotification } from "@/types/network";
import {
  isRealtimeUnavailable,
  markRealtimeUnavailable,
} from "@/lib/network/realtime-state";

export async function listNotifications(
  userId: string,
  opts?: { unreadOnly?: boolean; limit?: number },
): Promise<NetworkNotification[]> {
  const sb = supabase();
  let q = sb
    .from("network_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 50);
  if (opts?.unreadOnly) q = q.eq("unread", true);
  const { data, error } = await q;
  if (error) throw error;

  const rows = (data ?? []) as NetworkNotification[];
  const actorIds = Array.from(
    new Set(rows.map((r) => r.actor_id).filter((id): id is string => Boolean(id))),
  );
  if (!actorIds.length) return rows;

  const { data: profiles } = await sb
    .from("network_profiles")
    .select("id, display_name, headline, avatar_url")
    .in("id", actorIds);
  const map = new Map((profiles ?? []).map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, actor: r.actor_id ? map.get(r.actor_id) ?? undefined : undefined }));
}

export async function countUnread(userId: string): Promise<number> {
  const { count, error } = await supabase()
    .from("network_notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("unread", true);
  if (error) throw error;
  return count ?? 0;
}

export async function markRead(notificationId: string): Promise<void> {
  const { error } = await supabase()
    .from("network_notifications")
    .update({ unread: false })
    .eq("id", notificationId);
  if (error) throw error;
}

export async function markAllRead(userId: string): Promise<void> {
  const { error } = await supabase()
    .from("network_notifications")
    .update({ unread: false })
    .eq("user_id", userId)
    .eq("unread", true);
  if (error) throw error;
}

export function subscribeToNotifications(
  userId: string,
  onNew: (n: NetworkNotification) => void,
): () => void {
  if (isRealtimeUnavailable()) return () => {};
  const sb = supabase();
  const channel = sb
    .channel(`notifs:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "network_notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onNew(payload.new as NetworkNotification),
    )
    .subscribe((status) => {
      if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED"
      ) {
        markRealtimeUnavailable(status);
        try {
          sb.realtime.disconnect();
        } catch {
          /* ignore */
        }
      }
    });
  return () => {
    sb.removeChannel(channel);
  };
}
