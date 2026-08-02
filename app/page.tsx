"use client";

import { FormEvent, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Role = "user" | "assistant";

type ChatMessage = {
  role: Role;
  content: string;
};

const INTRO_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "**POLITIS-IT v5.0** è pronto. Descrivi lo scenario di partenza che vuoi simulare " +
    "(es. *\"Governo di centrodestra, Settimana 1, maggio 2026\"*) oppure scrivi semplicemente " +
    "**\"Inizia la simulazione\"** per far generare al motore la Settimana 1 con un assetto di default.",
};

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO_MESSAGE]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;

    setError(null);
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);
    scrollToBottom();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text();
        throw new Error(errText || `Richiesta fallita (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: accumulated };
          return updated;
        });
        scrollToBottom();
      }
    } catch (err) {
      setError((err as Error).message);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <main className="page">
      <header className="header">
        <h1>🏛️ POLITIS-IT</h1>
        <p>Motore di simulazione politica italiana &amp; internazionale — v5.0</p>
      </header>

      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <div className="bubble-role">{m.role === "user" ? "Tu" : "POLITIS-IT"}</div>
            <div className="bubble-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {m.content || (isStreaming && i === messages.length - 1 ? "…" : "")}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <div className="error">Errore: {error}</div>}

      <form className="composer" onSubmit={sendMessage}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Scrivi la tua decisione strategica per la settimana..."
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(e);
            }
          }}
        />
        <button type="submit" disabled={isStreaming || !input.trim()}>
          {isStreaming ? "Simulazione in corso…" : "Invia"}
        </button>
      </form>
    </main>
  );
}
