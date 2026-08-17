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
  type LexRamSession,
} from '@/modules/legal/repository/session.repository';
import { getStoredData, setStoredData, STORAGE_KEYS } from '@/lib/storage';
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

// ─── Backend-history → frontend Message[] recovery ──────────────────────────
// The LexRam backend keeps the full conversation at GET /sessions/{id}/history
// as plain { role, content } turns. When the Supabase mirror is empty (a save
// failed, or an older session), we rebuild the thread from there so drafted
// petitions etc. are never truly lost. The content is markdown; we classify
// assistant turns into a draft/plan/prose block with the same lightweight
// heuristics the live stream uses as its fallback.
function histGenId(): string {
  return `hist-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function histLooksLikeDraft(text: string): boolean {
  if (!text) return false;
  const head = text.slice(0, 900);
  return /\b(IN THE (HON(')?BLE )?(COURT|HIGH COURT|SESSIONS|TRIBUNAL|FORUM)|BEFORE THE (HON(')?BLE )?(COURT|JUDGE|MAGISTRATE)|RESPECTFULLY SHOWETH|MOST RESPECTFULLY SHOWETH|MEMORANDUM OF|PETITION (FOR|UNDER))\b/i.test(head);
}
function histLooksLikePlan(text: string): boolean {
  if (!text) return false;
  // Never classify as a plan when the text reads like a clarifying question.
  // Clarifying questions often contain phrases such as "one critical question"
  // or "could you please …" and can mention "proceed with drafting" /
  // "proposed structure" in passing — the old broad regex misidentified them
  // as plan responses, causing them to render with a "Proceed" button instead
  // of as a chat message with suggested-answer chips.
  const looksLikeQuestion =
    /\bone critical question\b|\bneed(?:s)? to (?:clarify|ask|know)\b|\bcould you (?:please |kindly )?\b/i.test(text);
  if (looksLikeQuestion) return false;
  // Strong signal: text STARTS with an explicit "Drafting Plan" heading.
  if (/^[\s*#>-]*(?:Drafting Plan|Draft Plan)\b/im.test(text)) return true;
  // "Here is the plan" style opening (common backend preamble).
  if (/^[\s\S]{0,100}\bHere(?:'s| is) (?:the |a |my )?(?:drafting |draft )?plan\b/i.test(text)) return true;
  // Weaker: "proposed structure" only when used as a section heading
  // (colon or newline + list immediately after), not a bare prose mention.
  if (/\bproposed structure\s*:/i.test(text)) return true;
  return false;
}
export function mapHistoryToMessages(
  hist: { role: string; content: string }[]
): Message[] {
  const out: Message[] = [];
  for (const h of hist) {
    const content = String(h?.content ?? '');
    if (!content.trim()) continue;
    const ts = new Date().toISOString();
    if (h?.role !== 'assistant') {
      out.push({ id: histGenId(), role: 'user', content, timestamp: ts });
      continue;
    }
    const base = {
      shortAnswer: '',
      reasoning: '',
      authorityStrength: 'Moderate' as const,
      divergenceStatus: 'Split' as const,
    };
    let response;
    if (histLooksLikePlan(content)) {
      response = { ...base, streamText: '', uiBlocks: [{ type: 'plan' as const, data: content }] };
    } else if (histLooksLikeDraft(content)) {
      response = { ...base, streamText: '', draftReady: content, uiBlocks: [{ type: 'draft' as const, data: content }] };
    } else {
      response = { ...base, streamText: content };
    }
    // Mark as reconstructed from plain-text history. The session hook uses this
    // flag to detect that these messages are lossy (no suggestedAnswers, no
    // authoritative uiBlocks) and should be upgraded with richer Supabase data
    // if it arrives later (e.g. when refresh() completes after the history
    // fallback has already painted something on screen).
    const msg = { id: histGenId(), role: 'ai' as const, content: '', timestamp: ts, response };
    (msg as any)._reconstructed = true;
    out.push(msg);
  }
  return out;
}

function lexramToSession(s: LexRamSession, messages: Message[] = []): ResearchSession {
  const id = lexramSessionId(s);
  const now = new Date().toISOString();
  return {
    id,
    title: String(s.title ?? 'New Conversation'),
    messages,
    createdAt: String(s.created_at ?? now),
    updatedAt: String(s.updated_at ?? s.created_at ?? now),
    matterId: undefined,
    // Map case_id from the backend so CasesPanel can filter sessions by case
    // without depending solely on the localStorage SESSION_CASES cache.
    caseId: typeof s.case_id === 'string' ? s.case_id : undefined,
  };
}

export const chatSessionRepository = {
  // ── List sessions ──────────────────────────────────────────────────────────
  // Source of truth = LexRam. Messages are enriched from Supabase by id.
  //
  // Both fetches are issued in parallel — RLS scopes the Supabase rows to the
  // current user, so we can pull the whole set and intersect against the ids
  // LexRam returns. Saves ~200–400 ms on every list call vs. awaiting LexRam
  // first and only then issuing the .in('id', ids) query.
  async list(): Promise<ResearchSession[]> {
    try {
      const lexramP = lexramSessionRepository.list();
      const supabaseP = supabase()
        .from('chat_sessions')
        .select('id, messages');

      const [lexramSessions, supabaseRes] = await Promise.all([lexramP, supabaseP]);

      let messagesById = new Map<string, Message[]>();
      if (supabaseRes.error) {
        console.warn(
          '[chatSessionRepository.list] supabase enrich failed',
          supabaseRes.error
        );
      } else if (supabaseRes.data) {
        messagesById = new Map(
          supabaseRes.data.map((r) => [r.id as string, (r.messages as Message[]) || []])
        );
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

  // ── Recover a session's messages from the backend history ─────────────────
  // Used when the Supabase mirror has no messages for a session (failed save,
  // legacy row). Returns [] on any failure so callers can fall back silently.
  async getMessagesFromBackend(id: string): Promise<Message[]> {
    try {
      const hist = await lexramSessionRepository.history(id);
      return mapHistoryToMessages(hist);
    } catch (err) {
      console.warn('[chatSessionRepository.getMessagesFromBackend] failed', err);
      return [];
    }
  },

  // ── Create a new session ──────────────────────────────────────────────────
  // Creates the session in LexRam first, then mirrors the row in Supabase
  // (with the LexRam id as the primary key) so messages can be persisted.
  // When `case_id` is provided, it's sent to POST /sessions so the row is
  // linked to the case at creation time (no follow-up PATCH /sessions/{id}/case).
  async create(input: {
    title: string;
    messages: Message[];
    matter_id?: string | null;
    case_id?: string | null;
  }): Promise<ResearchSession | null> {
    try {
      const lexramSession = await lexramSessionRepository.create(
        input.title || 'New Conversation',
        { case_id: input.case_id ?? null }
      );
      const id = lexramSessionId(lexramSession);
      if (!id) throw new Error('LexRam returned no session id');

      // Mirror in Supabase so messages can be persisted later.
      //
      // Bounded: getUser() takes Supabase's cross-tab auth lock and can hang on
      // a dead post-sleep socket. This runs on the ensureSession() critical path
      // *after* the LexRam session already exists, so a hang here strands the
      // chat on "Working…" for a turn that had otherwise succeeded. The mirror
      // is best-effort (its own failure is already only a console.warn below),
      // so on timeout we skip it rather than block the send.
      const userData = await Promise.race([
        supabase().auth.getUser().then((r) => r.data),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);
      const userId = userData?.user?.id;
      if (userId) {
        // Bounded for the same reason as getUser() above: postgrest-js issues a
        // plain fetch() with no timeout, so a stalled socket here would hang
        // ensureSession() and strand the chat on "Working…" even though the
        // session itself was created fine. Timing out just skips the mirror.
        const mirror = await Promise.race([
          supabase()
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
            )
            .then((r) => ({ error: r.error as unknown })),
          new Promise<{ error: unknown }>((resolve) =>
            setTimeout(() => resolve({ error: 'timeout' }), 5000),
          ),
        ]);
        if (mirror.error) {
          console.warn('[chatSessionRepository.create] supabase mirror failed', mirror.error);
        }
      }

      // Seed the SESSION_CASES localStorage cache so CasesPanel can filter the
      // freshly-created session by its case immediately, without waiting for
      // the next /sessions list refresh.
      const resolvedCaseId =
        (typeof lexramSession.case_id === 'string' ? lexramSession.case_id : null) ??
        input.case_id ??
        null;
      if (resolvedCaseId) {
        const map = getStoredData<Record<string, string>>(STORAGE_KEYS.SESSION_CASES, {});
        map[id] = resolvedCaseId;
        setStoredData(STORAGE_KEYS.SESSION_CASES, map);
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
    // .select() lets us detect a 0-row update — which happens when the Supabase
    // mirror row was never created (e.g. the create-time upsert failed). A bare
    // .update().eq() in that case silently affects nothing, so the messages
    // (including generated drafts) are NEVER persisted and vanish on reload.
    const { data, error } = await supabase()
      .from('chat_sessions')
      .update({ messages })
      .eq('id', id)
      .select('id');
    if (error) {
      console.error('[chatSessionRepository.updateMessages]', error);
      return;
    }
    if (data && data.length > 0) return;

    // No row was updated — the mirror is missing. Create it now so the messages
    // actually persist. `title` is only applied on insert (the row didn't
    // exist), so this can't clobber an existing title.
    const { data: userData } = await supabase().auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    const { error: upsertErr } = await supabase()
      .from('chat_sessions')
      .upsert({ id, user_id: userId, title: 'New Chat', messages }, { onConflict: 'id' });
    if (upsertErr) {
      console.error('[chatSessionRepository.updateMessages] mirror recreate failed', upsertErr);
    }
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
