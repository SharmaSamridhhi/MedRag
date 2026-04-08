import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

const API_URL = import.meta.env.VITE_API_URL;

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);
  const sessionIdRef = useRef(uuidv4());

  const sendMessage = async (query) => {
    if (!query.trim() || isStreaming) return;

    const userMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);

    const assistantMessage = {
      role: "assistant",
      content: "",
      citations: [],
      chunks_used: 0,
      loading: true,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    setIsStreaming(true);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch(`${API_URL}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          query,
          topK: 5,
          sessionId: sessionIdRef.current,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Stream request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6);
          try {
            const event = JSON.parse(jsonStr);

            if (event.type === "token") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + event.content,
                };
                return updated;
              });
            } else if (event.type === "citations") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...last,
                  citations: event.citations,
                  chunks_used: event.chunks_used,
                  loading: false,
                };
                return updated;
              });
            }
          } catch {
            // Malformed JSON — skip
          }
        }
      }
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("[Chat] Stream error:", error);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: "Something went wrong. Please try again.",
          loading: false,
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const clearSession = async () => {
    // Clear old session on the server BEFORE rotating the ID
    const oldSessionId = sessionIdRef.current;
    try {
      await fetch(`${API_URL}/chat/clear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId: oldSessionId }),
      });
    } catch (e) {
      console.error("Failed to clear session:", e);
    }
    setMessages([]);
    sessionIdRef.current = uuidv4();
  };

  return { messages, isStreaming, sendMessage, stopStreaming, clearSession };
}
