"use client";

import { supabase } from "@/lib/supabase/client";
import type { NetworkMessage, NetworkProfile, Thread } from "@/types/network";
import {
  isRealtimeUnavailable,
  markRealtimeUnavailable,
} from "@/lib/network/realtime-state";

type ThreadRow = {
  id: string;
  created_at: string;
  last_message_at: string;
};

export async function listThreads(currentUserId: string): Promise<Thread[]> {
  const sb = supabase();

  const { data: parts, error: pErr } = await sb
    .from("network_thread_participants")
    .select("thread_id, last_read_at")
    .eq("user_id", currentUserId);
  if (pErr) throw pErr;

  const threadIds = (parts ?? []).map((p: { thread_id: string }) => p.thread_id);
  if (!threadIds.length) return [];

  const [{ data: threads, error: tErr }, { data: allParts, error: apErr }] = await Promise.all([
    sb.from("network_threads").select("*").in("id", threadIds).order("last_message_at", { ascending: false }),
    sb
      .from("network_thread_participants")
      .select("thread_id, user_id")
      .in("thread_id", threadIds),
  ]);
  if (tErr) throw tErr;
  if (apErr) throw apErr;

  const otherIds = Array.from(
    new Set(
      (allParts ?? [])
        .filter((p: { user_id: string }) => p.user_id !== currentUserId)
        .map((p: { user_id: string }) => p.user_id),
    ),
  );

  const { data: profiles } = await sb
    .from("network_profiles")
    .select("id, display_name, headline, avatar_url")
    .in("id", otherIds);
  const profileMap = new Map<string, Pick<NetworkProfile, "id" | "display_name" | "headline" | "avatar_url">>(
    (profiles ?? []).map((p) => [p.id, p]),
  );

  const participantsByThread = new Map<string, string[]>();
  (allParts ?? []).forEach((p: { thread_id: string; user_id: string }) => {
    if (!participantsByThread.has(p.thread_id)) participantsByThread.set(p.thread_id, []);
    participantsByThread.get(p.thread_id)!.push(p.user_id);
  });

  const lastReadMap = new Map(
    (parts ?? []).map((p: { thread_id: string; last_read_at: string }) => [p.thread_id, p.last_read_at]),
  );

  // Fetch last messages + unread counts.
  const { data: lastMessages } = await sb
    .from("network_messages")
    .select("*")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: false });

  const lastByThread = new Map<string, NetworkMessage>();
  (lastMessages ?? []).forEach((m: NetworkMessage) => {
    if (!lastByThread.has(m.thread_id)) lastByThread.set(m.thread_id, m);
  });

  const unreadByThread = new Map<string, number>();
  (lastMessages ?? []).forEach((m: NetworkMessage) => {
    if (m.sender_id === currentUserId) return;
    const lastRead = lastReadMap.get(m.thread_id);
    if (lastRead && new Date(m.created_at) <= new Date(lastRead)) return;
    unreadByThread.set(m.thread_id, (unreadByThread.get(m.thread_id) ?? 0) + 1);
  });

  return (threads ?? []).map((t: ThreadRow) => {
    const ids = (participantsByThread.get(t.id) ?? []).filter((id) => id !== currentUserId);
    return {
      ...t,
      participants: ids
        .map((id) => profileMap.get(id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p)),
      last_message: lastByThread.get(t.id),
      unread_count: unreadByThread.get(t.id) ?? 0,
    };
  });
}

export async function listMessages(threadId: string): Promise<NetworkMessage[]> {
  const { data, error } = await supabase()
    .from("network_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as NetworkMessage[];
}

export async function sendMessage(
  threadId: string,
  senderId: string,
  body: string,
): Promise<NetworkMessage> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Empty message");
  const { data, error } = await supabase()
    .from("network_messages")
    .insert({ thread_id: threadId, sender_id: senderId, body: trimmed })
    .select("*")
    .single();
  if (error) throw error;
  return data as NetworkMessage;
}

export async function getOrCreateDirectThread(
  currentUserId: string,
  otherUserId: string,
): Promise<string> {
  const sb = supabase();
  // Find existing 2-person thread containing both users.
  const { data: mine } = await sb
    .from("network_thread_participants")
    .select("thread_id")
    .eq("user_id", currentUserId);
  const myThreadIds = (mine ?? []).map((p: { thread_id: string }) => p.thread_id);
  if (myThreadIds.length) {
    const { data: shared } = await sb
      .from("network_thread_participants")
      .select("thread_id")
      .eq("user_id", otherUserId)
      .in("thread_id", myThreadIds);
    const shortlist = (shared ?? []).map((s: { thread_id: string }) => s.thread_id);
    if (shortlist.length) {
      // Confirm it is a 2-person thread.
      const { data: counts } = await sb
        .from("network_thread_participants")
        .select("thread_id, user_id")
        .in("thread_id", shortlist);
      const grouped = new Map<string, number>();
      (counts ?? []).forEach((c: { thread_id: string }) =>
        grouped.set(c.thread_id, (grouped.get(c.thread_id) ?? 0) + 1),
      );
      const two = shortlist.find((id) => grouped.get(id) === 2);
      if (two) return two;
    }
  }

  // Create new thread + add both participants.
  const { data: thread, error: tErr } = await sb.from("network_threads").insert({}).select("id").single();
  if (tErr) throw tErr;
  const { error: pErr } = await sb.from("network_thread_participants").insert([
    { thread_id: thread.id, user_id: currentUserId },
    { thread_id: thread.id, user_id: otherUserId },
  ]);
  if (pErr) throw pErr;
  return thread.id;
}

export async function markThreadRead(threadId: string, userId: string): Promise<void> {
  const { error } = await supabase()
    .from("network_thread_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .eq("user_id", userId);
  if (error) throw error;
}

export function subscribeToThread(
  threadId: string,
  onMessage: (msg: NetworkMessage) => void,
): () => void {
  if (isRealtimeUnavailable()) return () => {};
  const sb = supabase();
  const channel = sb
    .channel(`thread:${threadId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "network_messages",
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => onMessage(payload.new as NetworkMessage),
    )
    .subscribe((status) => {
      if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED"
      ) {
        markRealtimeUnavailable(status);
        // Tear down the underlying socket so the supabase-js Realtime client
        // stops the endless WebSocket reconnect loop.
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

export function subscribeToInbox(
  userId: string,
  onAnyMessage: (msg: NetworkMessage) => void,
): () => void {
  if (isRealtimeUnavailable()) return () => {};
  const sb = supabase();
  const channel = sb
    .channel(`inbox:${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "network_messages" },
      (payload) => {
        const msg = payload.new as NetworkMessage;
        if (msg.sender_id !== userId) onAnyMessage(msg);
      },
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
