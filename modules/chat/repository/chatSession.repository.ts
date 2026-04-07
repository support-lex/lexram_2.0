// Repository for the public.chat_sessions table.
// RLS guarantees: users can only see/modify rows where user_id = auth.uid().

import { supabase } from '@/lib/supabase/client';
import type { Message, ResearchSession } from '@/app/dashboard/research-3/types';

export interface ChatSessionRow {
  id: string;
  user_id: string;
  title: string;
  messages: Message[];
  matter_id: string | null;
  created_at: string;
  updated_at: string;
}

function rowToSession(row: ChatSessionRow): ResearchSession {
  return {
    id: row.id,
    title: row.title,
    messages: Array.isArray(row.messages) ? row.messages : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    matterId: row.matter_id ?? undefined,
  };
}

export const chatSessionRepository = {
  /** Fetch all sessions for the current user, newest first. */
  async list(): Promise<ResearchSession[]> {
    const { data, error } = await supabase()
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[chatSessionRepository.list]', error);
      return [];
    }
    return (data as ChatSessionRow[]).map(rowToSession);
  },

  /** Insert a brand-new session. Returns the created row's id. */
  async create(input: {
    title: string;
    messages: Message[];
    matter_id?: string | null;
  }): Promise<ResearchSession | null> {
    const { data: userData } = await supabase().auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      console.warn('[chatSessionRepository.create] no session — skipping');
      return null;
    }

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
      console.error('[chatSessionRepository.create]', error);
      return null;
    }
    return rowToSession(data as ChatSessionRow);
  },

  /** Replace the messages array of an existing session. updated_at auto-bumps via trigger. */
  async updateMessages(id: string, messages: Message[]): Promise<void> {
    const { error } = await supabase()
      .from('chat_sessions')
      .update({ messages })
      .eq('id', id);
    if (error) console.error('[chatSessionRepository.updateMessages]', error);
  },

  /** Rename a session (used after AI title generation). */
  async updateTitle(id: string, title: string): Promise<void> {
    const { error } = await supabase()
      .from('chat_sessions')
      .update({ title })
      .eq('id', id);
    if (error) console.error('[chatSessionRepository.updateTitle]', error);
  },

  /** Hard-delete a session. RLS prevents deleting other users' rows. */
  async remove(id: string): Promise<boolean> {
    const { error } = await supabase()
      .from('chat_sessions')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('[chatSessionRepository.remove]', error);
      return false;
    }
    return true;
  },
};
