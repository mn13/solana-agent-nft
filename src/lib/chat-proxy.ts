export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function forwardToAgent(params: {
  messages: ChatMessage[];
  agentEndpoint: string;
  agentType: "openai" | "webhook";
}): Promise<string> {
  const { messages, agentEndpoint, agentType } = params;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    if (agentType === "openai") {
      const url = agentEndpoint.endsWith("/v1/chat/completions")
        ? agentEndpoint
        : `${agentEndpoint.replace(/\/$/, "")}/v1/chat/completions`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "default", messages }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Agent returned ${res.status}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "No response from agent";
    } else {
      const lastMessage = messages[messages.length - 1]?.content ?? "";
      const res = await fetch(agentEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: lastMessage, history: messages }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Agent returned ${res.status}`);
      }

      const data = await res.json();
      return (
        data.reply ?? data.message ?? data.content ?? JSON.stringify(data)
      );
    }
  } finally {
    clearTimeout(timeout);
  }
}
