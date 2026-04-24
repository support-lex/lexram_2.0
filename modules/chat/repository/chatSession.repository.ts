// Hybrid chat-session repository.
//
// • LexRam Legal Research backend (HTTP) is the source-of-truth for the
//   list of sessions and their lifecycle (create / rename / delete).
// • Supabase `public.chat_sessions` is used as message storage only — keyed
//   by the LexRam session id, since the LexRam API has no endpoint to PUT
//   the full message array of a session.
//
// If LexRam is unreachable (auth not yet migrated, network down, etc.) we
// fall back to Supabase-only operation so the user can still chat. Every
// fallback path logs a warning so it's visible in DevTools.

import { supabase } from '@/lib/supabase/client';
import {
  lexramSessionRepository,
  lexramSessionId,
  type LexramSession,
} from '@/modules/legal/repository/session.repository';
import type { Message, ResearchSession } from '@/app/dashboard/research-3/types';

interface SupabaseSessionRow {
  id: string;
  user_id: string;
  title: string;
  messages: Message[];
  matter_id: string | null;
  created_at: string;
  updated_at: string;
}

function rowToSession(row: SupabaseSessionRow): ResearchSession {
  return {
    id: row.id,
    title: row.title,
    messages: Array.isArray(row.messages) ? row.messages : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    matterId: row.matter_id ?? undefined,
  };
}

function lexramToSession(s: LexramSession, messages: Message[] = []): ResearchSession {
  const id = lexramSessionId(s);
  const now = new Date().toISOString();
  return {
    id,
    title: String(s.title ?? 'New Conversation'),
    messages,
    createdAt: String(s.created_at ?? now),
    updatedAt: String(s.updated_at ?? s.created_at ?? now),
    matterId: undefined,
  };
}

export const chatSessionRepository = {
  // ── List sessions ──────────────────────────────────────────────────────────
  // Source of truth = LexRam. Messages are enriched from Supabase by id.
  async list(): Promise<ResearchSession[]> {
    try {
      const lexramSessions = await lexramSessionRepository.list();
      const ids = lexramSessions.map(lexramSessionId).filter(Boolean);

      // Fetch all matching message rows from Supabase in one shot.
      let messagesById = new Map<string, Message[]>();
      if (ids.length > 0) {
        const { data, error } = await supabase()
          .from('chat_sessions')
          .select('id, messages')
          .in('id', ids);
        if (error) {
          console.warn('[chatSessionRepository.list] supabase enrich failed', error);
        } else if (data) {
          messagesById = new Map(
            data.map((r) => [r.id as string, (r.messages as Message[]) || []])
          );
        }
      }

      return lexramSessions.map((s) => {
        const id = lexramSessionId(s);
        return lexramToSession(s, messagesById.get(id) ?? []);
      });
    } catch (err) {
      console.warn(
        '[chatSessionRepository.list] LexRam unreachable, falling back to Supabase',
        err
      );
      return listFromSupabaseFallback();
    }
  },

  // ── Create a new session ──────────────────────────────────────────────────
  // Creates the session in LexRam first, then mirrors the row in Supabase
  // (with the LexRam id as the primary key) so messages can be persisted.
  async create(input: {
    title: string;
    messages: Message[];
    matter_id?: string | null;
  }): Promise<ResearchSession | null> {
    try {
      const lexramSession = await lexramSessionRepository.create(
        input.title || 'New Conversation'
      );
      const id = lexramSessionId(lexramSession);
      if (!id) throw new Error('LexRam returned no session id');

      // Mirror in Supabase so messages can be persisted later.
      const { data: userData } = await supabase().auth.getUser();
      const userId = userData.user?.id;
      if (userId) {
        const { error } = await supabase()
          .from('chat_sessions')
          .upsert(
            {
              id,
              user_id: userId,
              title: lexramSession.title ?? input.title,
              messages: input.messages,
              matter_id: input.matter_id ?? null,
            },
            { onConflict: 'id' }
          );
        if (error) {
          console.warn('[chatSessionRepository.create] supabase mirror failed', error);
        }
      }

      return lexramToSession(lexramSession, input.messages);
    } catch (err) {
      console.warn(
        '[chatSessionRepository.create] LexRam unreachable, falling back to Supabase',
        err
      );
      return createInSupabaseFallback(input);
    }
  },

  // ── Replace the messages array of an existing session ─────────────────────
  // LexRam has no PUT-messages endpoint, so this is always Supabase-only.
  async updateMessages(id: string, messages: Message[]): Promise<void> {
    const { error } = await supabase()
      .from('chat_sessions')
      .update({ messages })
      .eq('id', id);
    if (error) console.error('[chatSessionRepository.updateMessages]', error);
  },

  // ── Rename a session (LexRam + Supabase mirror) ───────────────────────────
  async updateTitle(id: string, title: string): Promise<void> {
    try {
      await lexramSessionRepository.rename(id, title);
    } catch (err) {
      console.warn('[chatSessionRepository.updateTitle] LexRam rename failed', err);
    }
    const { error } = await supabase()
      .from('chat_sessions')
      .update({ title })
      .eq('id', id);
    if (error) console.error('[chatSessionRepository.updateTitle] supabase', error);
  },

  // ── Hard delete (LexRam + Supabase mirror) ─────────────────────────────────
  async remove(id: string): Promise<boolean> {
    let lexramOk = true;
    try {
      await lexramSessionRepository.remove(id);
    } catch (err) {
      console.warn('[chatSessionRepository.remove] LexRam delete failed', err);
      lexramOk = false;
    }
    const { error } = await supabase().from('chat_sessions').delete().eq('id', id);
    if (error) {
      console.error('[chatSessionRepository.remove] supabase', error);
      return lexramOk;
    }
    return true;
  },
};

// ─── Supabase-only fallbacks ──────────────────────────────────────────────────

async function listFromSupabaseFallback(): Promise<ResearchSession[]> {
  const { data, error } = await supabase()
    .from('chat_sessions')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) {
    console.error('[chatSessionRepository.list] supabase fallback failed', error);
    return [];
  }
  return (data as SupabaseSessionRow[]).map(rowToSession);
}

async function createInSupabaseFallback(input: {
  title: string;
  messages: Message[];
  matter_id?: string | null;
}): Promise<ResearchSession | null> {
  const { data: userData } = await supabase().auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase()
    .from('chat_sessions')
    .insert({
      user_id: userId,
      title: input.title,
      messages: input.messages,
      matter_id: input.matter_id ?? null,
    })
    .select()
    .single();
  if (error) {
    console.error('[chatSessionRepository.create] supabase fallback failed', error);
    return null;
  }
  return rowToSession(data as SupabaseSessionRow);
}
