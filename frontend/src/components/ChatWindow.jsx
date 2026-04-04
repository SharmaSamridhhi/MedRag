import { useState, useRef, useEffect } from "react";
import { useChat } from "../hooks/useChat";

export default function ChatWindow() {
  const { messages, isStreaming, sendMessage, stopStreaming } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h2>MedRag Chat</h2>

      {/* Message list */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 16,
          height: 480,
          overflowY: "auto",
          marginBottom: 16,
          background: "#fafafa",
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#999" }}>
            Ask a question about your uploaded documents.
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: 16,
              textAlign: msg.role === "user" ? "right" : "left",
            }}
          >
            <div
              style={{
                display: "inline-block",
                maxWidth: "80%",
                padding: "10px 14px",
                borderRadius: 12,
                background: msg.role === "user" ? "#0070f3" : "#fff",
                color: msg.role === "user" ? "#fff" : "#111",
                border: msg.role === "assistant" ? "1px solid #eee" : "none",
                textAlign: "left",
              }}
            >
              {/* Message content — renders progressively as tokens arrive */}
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {msg.content}
                {/* Blinking cursor while streaming */}
                {msg.loading && (
                  <span style={{ animation: "blink 1s infinite" }}>▌</span>
                )}
              </p>

              {/* Citations shown after stream completes */}
              {!msg.loading && msg.citations?.length > 0 && (
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 8,
                    borderTop: "1px solid #eee",
                    fontSize: 12,
                    color: "#555",
                  }}
                >
                  <strong>Sources:</strong>
                  {msg.citations.map((c, j) => (
                    <div key={j}>
                      Source {c.sourceNumber} — Document #{c.documentId}, p.
                      {c.pageNumber}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Ask about your documents...'
          disabled={isStreaming}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #ddd",
            fontSize: 14,
          }}
        />
        {isStreaming ? (
          <button
            type='button'
            onClick={stopStreaming}
            style={{
              padding: "10px 20px",
              background: "#e00",
              color: "#fff",
              border: "none",
              borderRadius: 8,
            }}
          >
            Stop
          </button>
        ) : (
          <button
            type='submit'
            style={{
              padding: "10px 20px",
              background: "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: 8,
            }}
          >
            Send
          </button>
        )}
      </form>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
      `}</style>
    </div>
  );
}
