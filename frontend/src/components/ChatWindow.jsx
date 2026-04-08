import { useState, useRef, useEffect } from "react";
import { useChat } from "../hooks/useChat";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/pages/DashboardLayout";
import { Send, Square, X, FileText, ChevronRight } from "lucide-react";

const EXAMPLE_QUESTIONS = {
  doctor: [
    "Summarize recent cardiology guidelines",
    "What are contraindications for ARNIs?",
    "Explain HFrEF treatment protocols",
  ],
  nurse: [
    "What are standard post-op vitals checks?",
    "Summarize medication reconciliation steps",
    "Infection control protocols for ICU",
  ],
  patient: [
    "What does my diagnosis mean?",
    "Explain my medication side effects",
    "What questions should I ask my doctor?",
  ],
  researcher: [
    "Summarize clinical trial outcomes",
    "What does the evidence say about SGLT2 inhibitors?",
    "Compare study methodologies",
  ],
};

function CitationPanel({ citation, onClose }) {
  if (!citation) return null;
  return (
    <div
      className='w-80 shrink-0 h-full flex flex-col border-l overflow-hidden'
      style={{ borderColor: "#cce3de", backgroundColor: "#f6fff8" }}
    >
      {/* Header */}
      <div
        className='flex items-center justify-between px-4 py-3 border-b shrink-0'
        style={{ borderColor: "#cce3de", backgroundColor: "#eaf4f4" }}
      >
        <div>
          <p
            className='text-[10px] font-semibold tracking-widest uppercase'
            style={{ color: "#6b9080" }}
          >
            Source Verification
          </p>
          <p
            className='text-sm font-semibold mt-0.5'
            style={{ color: "#1a2e25" }}
          >
            Evidence Citation
          </p>
        </div>
        <button
          onClick={onClose}
          className='p-1.5 rounded-lg transition-colors hover:bg-white/60'
          style={{ color: "#6b9080" }}
        >
          <X className='w-4 h-4' />
        </button>
      </div>

      {/* Document info */}
      <div className='px-4 py-3 border-b' style={{ borderColor: "#eaf4f4" }}>
        <div
          className='flex items-start gap-3 p-3 rounded-xl'
          style={{ backgroundColor: "#eaf4f4", border: "1px solid #cce3de" }}
        >
          <div
            className='w-8 h-8 rounded-lg flex items-center justify-center shrink-0'
            style={{ backgroundColor: "#fde8e8" }}
          >
            <FileText className='w-4 h-4' style={{ color: "#c0392b" }} />
          </div>
          <div className='min-w-0'>
            <p
              className='text-xs font-semibold truncate'
              style={{ color: "#1a2e25" }}
            >
              Document #{citation.documentId}
            </p>
            <p className='text-[11px] mt-0.5' style={{ color: "#6b9080" }}>
              Page {citation.pageNumber} · Source {citation.sourceNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Chunk text */}
      <div className='flex-1 overflow-y-auto px-4 py-4'>
        <p
          className='text-[10px] font-semibold tracking-widest uppercase mb-3'
          style={{ color: "#6b9080" }}
        >
          Extracted Evidence Chunk
        </p>
        <div
          className='rounded-xl p-4 text-sm leading-relaxed'
          style={{
            backgroundColor: "white",
            border: "1px solid #cce3de",
            color: "#2d4a3e",
            fontStyle: "normal",
          }}
        >
          {citation.chunkText || "Chunk text not available."}
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow() {
  const { messages, isStreaming, sendMessage, stopStreaming, clearSession } =
    useChat();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [activeCitation, setActiveCitation] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const examples = EXAMPLE_QUESTIONS[user?.role] || EXAMPLE_QUESTIONS.doctor;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCitationClick = (citation) => {
    setActiveCitation((prev) =>
      prev?.sourceNumber === citation.sourceNumber &&
      prev?.documentId === citation.documentId
        ? null
        : citation,
    );
  };

  const handleNewChat = async () => {
    setActiveCitation(null);
    await clearSession();
  };

  return (
    <DashboardLayout>
      <div className='flex h-full overflow-hidden'>
        {/* Chat area */}
        <div className='flex-1 flex flex-col overflow-hidden'>
          {/* Messages */}
          <div className='flex-1 overflow-y-auto px-6 py-6 space-y-5'>
            {messages.length === 0 ? (
              /* Empty state */
              <div className='flex flex-col items-center justify-center h-full text-center px-8'>
                <div
                  className='w-14 h-14 rounded-2xl flex items-center justify-center mb-5'
                  style={{ backgroundColor: "#eaf4f4" }}
                >
                  <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                    <path d='M11 6h2v4h4v2h-4v4h-2v-4H7v-2h4z' fill='#6b9080' />
                    <path
                      d='M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z'
                      fill='#a4c3b2'
                    />
                  </svg>
                </div>
                <h2
                  className='text-2xl font-bold mb-2'
                  style={{ color: "#1a2e25" }}
                >
                  How can I assist your{" "}
                  <span style={{ color: "#6b9080" }}>diagnosis</span> today?
                </h2>
                <p
                  className='text-sm max-w-sm mb-8'
                  style={{ color: "#6b9080" }}
                >
                  Access secure, RAG-enabled clinical intelligence. Ask for
                  evidence-based summaries, research citations, or procedural
                  guidance.
                </p>
                <div className='flex flex-col gap-2 w-full max-w-sm'>
                  {examples.map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                        textareaRef.current?.focus();
                      }}
                      className='flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm transition-colors group'
                      style={{
                        backgroundColor: "white",
                        border: "1px solid #cce3de",
                        color: "#2d4a3e",
                      }}
                    >
                      <ChevronRight
                        className='w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5'
                        style={{ color: "#6b9080" }}
                      />
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div
                      className='w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mr-2.5 mt-0.5'
                      style={{ backgroundColor: "#eaf4f4" }}
                    >
                      <svg
                        width='14'
                        height='14'
                        viewBox='0 0 24 24'
                        fill='none'
                      >
                        <path
                          d='M11 6h2v4h4v2h-4v4h-2v-4H7v-2h4z'
                          fill='#6b9080'
                        />
                      </svg>
                    </div>
                  )}

                  <div className='max-w-[72%]'>
                    <div
                      className='px-4 py-3 rounded-2xl text-sm leading-relaxed'
                      style={
                        msg.role === "user"
                          ? {
                              backgroundColor: "#6b9080",
                              color: "white",
                              borderRadius: "18px 18px 4px 18px",
                            }
                          : {
                              backgroundColor: "white",
                              border: "1px solid #cce3de",
                              color: "#1a2e25",
                              borderRadius: "4px 18px 18px 18px",
                            }
                      }
                    >
                      {msg.loading ? (
                        <span
                          className='flex items-center gap-1.5'
                          style={{ color: "#6b9080" }}
                        >
                          <span
                            className='w-1.5 h-1.5 rounded-full animate-bounce'
                            style={{
                              backgroundColor: "#6b9080",
                              animationDelay: "0ms",
                            }}
                          />
                          <span
                            className='w-1.5 h-1.5 rounded-full animate-bounce'
                            style={{
                              backgroundColor: "#6b9080",
                              animationDelay: "150ms",
                            }}
                          />
                          <span
                            className='w-1.5 h-1.5 rounded-full animate-bounce'
                            style={{
                              backgroundColor: "#6b9080",
                              animationDelay: "300ms",
                            }}
                          />
                          <span className='text-xs ml-1'>
                            Synthesizing clinical evidence…
                          </span>
                        </span>
                      ) : (
                        <p className='whitespace-pre-wrap m-0'>{msg.content}</p>
                      )}
                    </div>

                    {/* Citations */}
                    {!msg.loading && msg.citations?.length > 0 && (
                      <div className='flex flex-wrap gap-1.5 mt-2 ml-1'>
                        {msg.citations.map((c, j) => (
                          <button
                            key={j}
                            onClick={() => handleCitationClick(c)}
                            className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors'
                            style={{
                              backgroundColor:
                                activeCitation?.sourceNumber ===
                                  c.sourceNumber &&
                                activeCitation?.documentId === c.documentId
                                  ? "#6b9080"
                                  : "#eaf4f4",
                              color:
                                activeCitation?.sourceNumber ===
                                  c.sourceNumber &&
                                activeCitation?.documentId === c.documentId
                                  ? "white"
                                  : "#2d4a3e",
                              border: "1px solid #cce3de",
                            }}
                          >
                            Source {c.sourceNumber} · p.{c.pageNumber}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Disclaimer */}
          <div className='px-6 pb-1 shrink-0'>
            <p className='text-center text-[11px]' style={{ color: "#a4c3b2" }}>
              MedRAG is an AI assistant for clinicians. Always verify findings
              with original source materials and clinical judgment.
            </p>
          </div>

          {/* Input area */}
          <div className='px-6 pb-5 pt-2 shrink-0'>
            <div
              className='flex items-end gap-3 rounded-2xl px-4 py-3'
              style={{ backgroundColor: "white", border: "1px solid #cce3de" }}
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder='Ask a clinical question about your documents…'
                disabled={isStreaming}
                className='flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed'
                style={{
                  color: "#1a2e25",
                  maxHeight: "120px",
                  overflowY: "auto",
                }}
              />
              {isStreaming ? (
                <button
                  onClick={stopStreaming}
                  className='w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors'
                  style={{ backgroundColor: "#fde8e8", color: "#c0392b" }}
                >
                  <Square className='w-4 h-4' />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim()}
                  className='w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors disabled:opacity-40'
                  style={{ backgroundColor: "#6b9080", color: "white" }}
                >
                  <Send className='w-4 h-4' />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Citation panel */}
        {activeCitation && (
          <CitationPanel
            citation={activeCitation}
            onClose={() => setActiveCitation(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
