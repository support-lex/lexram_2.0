// Some upstream LLMs (MiniMax-M2.5 in particular) emit a <think>...</think>
// chain-of-thought block before the final answer. If the stream is truncated
// mid-reasoning the raw text can leak into the UI. This helper normalises
// any streamed answer into what the user should actually see.

export interface CleanedAnswer {
  visible: string;          // text safe to render in the UI
  reasoning: string | null; // stripped think content, for "Show reasoning"
  isThinking: boolean;      // true when an open <think> has no matching close yet
  truncated: boolean;       // true when we got only reasoning (no final answer)
}

const THINK_OPEN = /<think[^>]*>/i;
const THINK_CLOSE = /<\/think\s*>/i;

export function cleanAnswer(raw: string): CleanedAnswer {
  const text = raw ?? '';
  const openMatch = text.match(THINK_OPEN);
  const closeMatch = text.match(THINK_CLOSE);

  // Closed block → visible text is what's outside <think>...</think>.
  if (openMatch && closeMatch && closeMatch.index! > openMatch.index!) {
    const before = text.slice(0, openMatch.index!).trim();
    const after = text.slice(closeMatch.index! + closeMatch[0].length).trim();
    const reasoning = text
      .slice(openMatch.index! + openMatch[0].length, closeMatch.index!)
      .trim();
    const visible = [before, after].filter(Boolean).join('\n\n');
    return {
      visible,
      reasoning: reasoning || null,
      isThinking: false,
      truncated: visible.length === 0,
    };
  }

  // Open <think> with no close yet (streaming mid-reasoning).
  if (openMatch && !closeMatch) {
    const before = text.slice(0, openMatch.index!).trim();
    const reasoning = text.slice(openMatch.index! + openMatch[0].length).trim();
    return {
      visible: before,
      reasoning: reasoning || null,
      isThinking: true,
      truncated: before.length === 0,
    };
  }

  // Only a closing </think> — the opening was eaten but reasoning still leaked.
  if (!openMatch && closeMatch) {
    const after = text.slice(closeMatch.index! + closeMatch[0].length).trim();
    const reasoning = text.slice(0, closeMatch.index!).trim();
    return {
      visible: after,
      reasoning: reasoning || null,
      isThinking: false,
      truncated: after.length === 0,
    };
  }

  // No think markers. Still strip obvious scaffolding: if the text begins
  // with a meta-preamble like "We have context:" it's almost always reasoning
  // that leaked with its opening tag stripped. Drop everything up to the
  // first double newline followed by a line that looks like an answer.
  if (/^(we have context|we need to|let'?s|thus|the question)/i.test(text.trim())) {
    return {
      visible: '',
      reasoning: text.trim(),
      isThinking: false,
      truncated: true,
    };
  }

  return { visible: text, reasoning: null, isThinking: false, truncated: false };
}
