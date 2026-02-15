"use client";

import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatWindowProps {
  assetId: string;
  token: string | null;
}

export default function ChatWindow({ assetId, token }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ assetId, messages: newMessages }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: `Error: ${data.error || "Unknown error"}`,
          },
        ]);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {!token && (
        <div className="px-4 py-2 bg-yellow-900/30 text-yellow-200 text-sm text-center">
          Demo mode — connect wallet and sign in for authenticated access
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            Send a message to start chatting with this agent
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[80%] px-4 py-3 rounded-xl whitespace-pre-wrap ${
              msg.role === "user"
                ? "ml-auto bg-purple-600 text-white"
                : "mr-auto bg-[#1e1e1e] text-gray-200"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="mr-auto bg-[#1e1e1e] text-gray-400 px-4 py-3 rounded-xl italic">
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-[#2a2a2a] bg-[#141414] flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask the agent..."
          className="flex-1 px-4 py-3 rounded-lg border border-[#333] bg-[#1a1a1a] text-white text-sm outline-none focus:border-purple-500"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-5 py-3 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
