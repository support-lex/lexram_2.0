// Calls the /api/chat/title endpoint to get an AI-generated title for a
// chat session based on its first user message. Always resolves — never
// throws — so callers can fall back to the truncated message text.

export async function generateChatTitle(firstMessage: string): Promise<string> {
  try {
    const res = await fetch('/api/chat/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: firstMessage }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { title?: string };
    return (data.title || '').trim() || firstMessage.slice(0, 60);
  } catch (err) {
    console.warn('[generateChatTitle] falling back', err);
    return firstMessage.slice(0, 60).trim() || 'New Conversation';
  }
}
