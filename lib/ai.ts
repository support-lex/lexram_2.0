/**
 * Centralized AI utility for generating content using Zhipu (z.ai) API.
 * All AI calls in the app go through this module.
 * Requests are proxied through the server-side API route (/api/ai).
 * Supports both regular and streaming responses.
 */

const AI_API_URL = "/api/ai";
const STREAMING_TIMEOUT_MS = 120000; // 120 seconds for streaming
const NON_STREAMING_TIMEOUT_MS = 30000; // 30 seconds for non-streaming
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Initial delay, exponentially backed off

interface AIRequestOptions {
    systemPrompt?: string;
    prompt: string;
    jsonMode?: boolean;
    fileData?: {
        base64?: string;
        text?: string;
        mimeType: string;
    };
    temperature?: number;
    stream?: boolean;
    onChunk?: (chunk: string) => void;
    signal?: AbortSignal;
}

interface AIResponse {
    text: string;
}

interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }

export async function generateContent(options: AIRequestOptions): Promise<AIResponse> {
    const messages: ChatMessage[] = [];

    if (options.systemPrompt) {
        messages.push({ role: "system", content: options.systemPrompt });
    }

    if (options.fileData) {
        let contentPayload = options.fileData.text;

        if (!contentPayload && options.fileData.base64) {
            contentPayload = options.fileData.base64.length > 20000
                ? options.fileData.base64.substring(0, 20000) + '...[TRUNCATED BY SYSTEM TO PREVENT 500 NETWORK ERROR]'
                : options.fileData.base64;
        }

        messages.push({
            role: "user",
            content: `[Attached Document Content]\n${contentPayload}\n\n[End Document Content]\n\nQuestion: ${options.prompt}`
        });
    } else {
        messages.push({ role: "user", content: options.prompt });
    }

    const body: Record<string, any> = {
        model: "glm-5",
        messages,
        temperature: options.temperature ?? 0.7,
    };

    if (options.jsonMode) {
        body.response_format = { type: "json_object" };
    }

    if (options.stream) {
        body.stream = true;
    }

    if (options.stream && options.onChunk) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), STREAMING_TIMEOUT_MS);
        // Allow caller to abort (e.g. user clicks Stop)
        options.signal?.addEventListener('abort', () => { clearTimeout(timeoutId); controller.abort(); });

        try {
            const response = await fetch(AI_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                const statusMessage = getStatusMessage(response.status);
                throw new Error(`AI API error (${response.status}): ${statusMessage} - ${errorText}`);
            }

            if (!response.body) {
                throw new Error("No response body received from the AI.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data:')) continue;

                    const data = trimmed.slice(5).trim();
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            fullText += content;
                            options.onChunk(content);
                        }
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }

            return { text: fullText };
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`Streaming request timeout after ${STREAMING_TIMEOUT_MS}ms`);
            }
            throw error;
        }
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), NON_STREAMING_TIMEOUT_MS);

            const response = await fetch(AI_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                const statusMessage = getStatusMessage(response.status);

                // Don't retry on client errors (4xx) except rate limit
                if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                    throw new Error(`AI API error (${response.status}): ${statusMessage} - ${errorText}`);
                }

                lastError = new Error(`AI API error (${response.status}): ${statusMessage} - ${errorText}`);

                // Only retry for server errors (5xx) and rate limiting (429)
                if (attempt < MAX_RETRIES - 1 && (response.status >= 500 || response.status === 429)) {
                    const delayMs = RETRY_DELAY_MS * Math.pow(2, attempt);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue;
                }

                throw lastError;
            }

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content;

            if (!text) {
                throw new Error("No response received from the AI.");
            }

            return { text };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Timeout errors should be retried
            if (lastError.message.includes('AbortError') || lastError.name === 'AbortError') {
                lastError = new Error(`Request timeout after ${NON_STREAMING_TIMEOUT_MS}ms`);
                if (attempt < MAX_RETRIES - 1) {
                    const delayMs = RETRY_DELAY_MS * Math.pow(2, attempt);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue;
                }
            }

            // Throw on last attempt or non-retryable errors
            if (attempt === MAX_RETRIES - 1 || !isRetryableError(lastError)) {
                throw lastError;
            }

            const delayMs = RETRY_DELAY_MS * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    throw lastError || new Error("Failed to get response from AI service after retries");
}

/**
 * Helper function to determine if an error is retryable
 */
function isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    // Retry on timeout, rate limit, and server errors
    return message.includes('timeout') || message.includes('rate limit') || message.includes('5');
}

/**
 * Helper function to get human-readable status messages
 */
function getStatusMessage(status: number): string {
    switch (status) {
        case 401:
            return "Unauthorized: Invalid API key";
        case 403:
            return "Forbidden: Access denied to AI service";
        case 429:
            return "Rate limit exceeded: Please try again later";
        case 500:
            return "AI service internal server error";
        case 502:
            return "AI service bad gateway";
        case 503:
            return "AI service unavailable";
        case 504:
            return "AI service gateway timeout";
        default:
            return `HTTP ${status} error`;
    }
}
