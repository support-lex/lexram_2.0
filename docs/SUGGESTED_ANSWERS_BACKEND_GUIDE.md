# Suggested Answers — Backend Integration Guide

**Audience:** LexRam Legal Research API team.
**Goal:** Let the assistant ask the user a clarifying question and surface clickable reply options ("suggested answers") in the chat UI.
**Status:** Frontend is live on https://lexram-2-0-ui.vercel.app (testing). Until the backend emits the new fields, suggestions appear only inside the in-app demo.
**Frontend version:** `app/dashboard/research-2` (the production `/dashboard/research-2` route).

---

## 1. What it looks like

When the assistant needs more information before producing a useful answer, it returns its question as normal prose **plus** a `suggestedAnswers` array describing the choices the user can click. The frontend renders those choices in one of four visual treatments, picked by the `suggestedAnswersVariant` field.

| Variant     | When to use                                                              | Where it renders                                   |
|-------------|--------------------------------------------------------------------------|----------------------------------------------------|
| `inline`    | Short pill chips, 2–4 simple options.                                    | Inside the AI bubble, small pills.                 |
| `popup`     | Important clarifying question that should grab attention.                | Bottom sheet that slides up above the chat input.  |
| `list`      | Each option has a longer description / trade-off.                        | Vertical cards inside the AI bubble.               |
| `buttons`   | Binary or near-binary choice (yes/no, confirm/cancel).                   | Large primary/secondary buttons in the AI bubble.  |

If the variant is omitted, the frontend treats it as `inline`.

---

## 2. Response contract

The assistant payload is the same JSON shape the backend already returns from `/legal-api/research/query` (or whichever endpoint streams the final answer). Three optional fields are added at the **top level of the answer object** (alongside `streamText`, `authorities`, `workflowSteps`, etc.).

```jsonc
{
  // existing fields
  "streamText": "What is the approximate value of the contract? This decides...",
  "shortAnswer": "Clarifying contract value.",
  "reasoning": "",
  "authorityStrength": "Strong",
  "divergenceStatus": "Aligned",

  // ─── new fields ──────────────────────────────────────────────────────────
  "suggestedAnswers": [
    "Below ₹3 lakh",
    "Between ₹3L and ₹10L",
    "Between ₹10L and ₹50L",
    "Above ₹50L (commercial court)"
  ],
  "suggestedAnswersHeading": "Pick a range",       // optional
  "suggestedAnswersVariant": "popup"               // optional, default "inline"
}
```

### Field reference

| Field                     | Type                                              | Required | Notes |
|---------------------------|---------------------------------------------------|----------|-------|
| `suggestedAnswers`        | `string[]`                                        | yes (when offering choices) | Each item is what the UI sends back as the user's next message when clicked. Strings are trimmed and empty entries are dropped on the frontend. Max **6** items — extras are sliced off. |
| `suggestedAnswersHeading` | `string`                                          | no       | Short label rendered above the chip row (e.g. "Pick a range", "Notice styles"). Falls back to "Suggested answers" / "Pick a reply" depending on variant. |
| `suggestedAnswersVariant` | `"inline" \| "popup" \| "list" \| "buttons"`      | no       | Default `inline`. Unknown values are ignored (treated as default). |

### Item formatting

For the **`list`** variant specifically, the frontend splits each option on the em-dash sequence ` — ` (space + em-dash + space) into a **title** and **detail** line. Use this when you want the card to show a primary label and a short trade-off:

```json
"suggestedAnswers": [
  "Standard 15-day notice — formal, neutral tone, single demand",
  "Final notice — assertive tone, threat of immediate civil action",
  "Conciliatory notice — invites settlement before legal escalation"
]
```

The split is purely cosmetic. The **full string** (including the detail after the em-dash) is what the frontend sends back as the user's reply.

The **`popup`** variant also splits on ` — ` to render a secondary line beneath each numbered option, with the same "the full string is what gets sent" semantics. For `inline` and `buttons`, the whole string is used verbatim.

---

## 3. When to emit suggested answers

Emit `suggestedAnswers` when **all** of the following are true:

1. The model's `streamText` is asking the user a question (it ends with `?`, contains "could you", "what is", "which", etc.), and
2. Producing a meaningful answer without that information would either be wrong or generic, and
3. The set of useful answers is **small and enumerable** (typically 2–6 distinct options).

Do **not** emit `suggestedAnswers` when:

- The answer is already complete and you're suggesting follow-up *prompts the user might ask next* — use `nextQuestions` for that. They're rendered as a separate row labeled "CONTINUE WITH" / heading from `nextQuestionsHeading`, with a different styling and click behavior.
- The set of valid answers is open-ended (e.g. "What is the contract date?").

### Picking the variant

| If…                                                                 | Use         |
|----------------------------------------------------------------------|-------------|
| 2–4 short, similar-weight options                                    | `inline`    |
| You want the question to feel like a system prompt the user must act on | `popup`  |
| Options need a one-line trade-off or description                     | `list`      |
| Yes/no or confirm/cancel                                             | `buttons`   |

A reasonable default in prompts: tell the model to emit `inline` unless the options carry meaningful detail (`list`), are binary (`buttons`), or are the *primary* gating decision for the rest of the conversation (`popup`).

---

## 4. End-to-end example

### Round 1 — assistant asks a clarifying question

Backend response (one chunk of the streaming JSON):

```json
{
  "streamText": "What is the **approximate value** of the contract? This decides court jurisdiction and shapes the urgency framing of the notice.",
  "shortAnswer": "Clarifying the contract value.",
  "reasoning": "",
  "authorityStrength": "Strong",
  "divergenceStatus": "Aligned",
  "suggestedAnswersHeading": "Pick a range",
  "suggestedAnswersVariant": "popup",
  "suggestedAnswers": [
    "Below ₹3 lakh",
    "Between ₹3L and ₹10L",
    "Between ₹10L and ₹50L",
    "Above ₹50L (commercial court)"
  ]
}
```

UI behavior:

- The AI bubble renders the `streamText` as usual.
- A card slides up from beneath the chat input (Claude Code permission-dialog style) showing the four numbered options. Pressing keys `1`–`4` picks an option; `Esc` dismisses the card.

### Round 2 — user clicks an option

The frontend sends the clicked option text as the next user message, **verbatim**, through the existing query endpoint. There is no special wire format; from the backend's perspective it is just another message in the conversation:

```
POST /legal-api/research/query
{ "query": "Between ₹10L and ₹50L", "session_id": "…" }
```

The backend must use conversation history to understand this is the answer to its previous clarifying question.

### Round 3 — final rich answer

Once the backend has enough information, return the regular full answer (with `authorities`, `workflowSteps`, `draftReady`, `uiBlocks`, etc.) and **omit** `suggestedAnswers`. The popup disappears automatically because the most recent AI message no longer carries the field.

---

## 5. Multiple clarifications in sequence

Multiple consecutive clarifying turns are fine — and useful when the question has more than one branching dimension. The demo conversation walks through three in a row (contract value → notice style → include timeline & authorities?), each with a different variant. Sequence them from "most decisive" to "fine-tuning."

The frontend pauses for the user's reply between every clarifying turn; there is no "send all answers together" mode.

---

## 6. Constraints and edge cases

- **Length:** Keep each option under ~80 characters. The `list` variant tolerates longer strings (it wraps), but `inline` and `popup` truncate visually on small viewports.
- **Count:** Hard limit of 6 items on the frontend. If more are returned, the trailing entries are dropped.
- **Empty array:** `"suggestedAnswers": []` is treated as "no suggestions" — same as omitting the field entirely.
- **Unknown variant:** Falls back to the inline pill style.
- **Streaming:** The fields are read from the final/normalized answer payload, not per-chunk. Emit them in the terminal JSON object once you've decided which clarification is needed; partial arrays during streaming are not surfaced.
- **i18n:** No translation is performed. Whatever language the strings are in is what the user sees and what gets echoed back.

---

## 7. Frontend code references

For backend folks who want to verify the contract end-to-end:

- Type definition — [app/dashboard/research-2/types.ts](../app/dashboard/research-2/types.ts) (look for `suggestedAnswers`, `suggestedAnswersHeading`, `suggestedAnswersVariant` on `LegalAnswer`).
- Normalizer (where backend JSON is read) — [app/dashboard/research-2/hooks/use-research-chat.ts](../app/dashboard/research-2/hooks/use-research-chat.ts) — the bottom of `normalizeAnswer()`.
- In-bubble rendering (inline / list / buttons) — [app/dashboard/research-2/components/MessageBubble.tsx](../app/dashboard/research-2/components/MessageBubble.tsx).
- Bottom-sheet popup (popup variant) — [app/dashboard/research-2/components/SuggestionsPopup.tsx](../app/dashboard/research-2/components/SuggestionsPopup.tsx).
- Demo script for manual QA — [app/dashboard/research-2/demo-conversation.json](../app/dashboard/research-2/demo-conversation.json). Trigger via "Try a demo conversation" on the empty state.

---

## 8. Backend acceptance checklist

Backend implementation can be considered complete when:

- [ ] Prompt is updated to instruct the model to emit a clarifying question with `suggestedAnswers` instead of guessing whenever a small enumerable set of branches exists.
- [ ] `suggestedAnswers`, `suggestedAnswersHeading`, and `suggestedAnswersVariant` are passed through to the final answer JSON unchanged (no escaping, no string-encoded JSON).
- [ ] Field is omitted (not `null`, not `[]`) when the assistant is delivering a final answer rather than asking a question.
- [ ] Each option string is a complete sentence/phrase the user would naturally say back — not a slug, not an enum ID.
- [ ] Conversation history correctly attributes the user's next message as the answer to the prior clarifying question.
- [ ] Verified against the demo at `/dashboard/research-2` → "Try a demo conversation" — same JSON shape produces the same UI behavior.

---

## 9. Open questions for the backend team

These are not blockers but worth thinking about before shipping at scale:

1. **Telemetry**: do we want to log which option the user picked vs. typed a custom reply? Useful for tuning the prompt over time.
2. **Caching**: when the same clarifying question recurs across sessions, do we cache `suggestedAnswers` server-side?
3. **Validation**: if the user types a custom reply that doesn't match any chip, should the next turn re-ask, or should the model gracefully continue with whatever was typed? (Today: gracefully continue.)
