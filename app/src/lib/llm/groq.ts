// Groq client — OpenAI-compatible /chat/completions. All three sub-agents go
// through here; only the model name differs (LLM implementation spec).

export const GROQ_MODELS = {
  watcher: "qwen/qwen3.6-27b",
  analytics: "qwen/qwen3.6-27b",
  automation: "openai/gpt-oss-120b",
} as const;

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqOptions {
  json?: boolean; // force a JSON object response
  temperature?: number;
  maxTokens?: number;
}

export async function groqChat(
  model: string,
  messages: GroqMessage[],
  opts: GroqOptions = {},
): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens ?? 2048,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq ${model} failed: ${res.status} ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message?.content ?? "";
}

/** groqChat + JSON.parse with a fallback for models that wrap JSON in prose. */
export async function groqJson<T>(
  model: string,
  messages: GroqMessage[],
  opts: Omit<GroqOptions, "json"> = {},
): Promise<T> {
  const raw = await groqChat(model, messages, { ...opts, json: true });
  try {
    return JSON.parse(raw) as T;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error(`Groq returned non-JSON: ${raw.slice(0, 200)}`);
  }
}
