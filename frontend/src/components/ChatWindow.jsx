import { useState, useRef, useEffect } from "react";
import { useChat } from "../hooks/useChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ChatWindow() {
  const { messages, isStreaming, sendMessage, stopStreaming, clearSession } =
    useChat();
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
    <div className='max-w-2xl mx-auto p-6 flex flex-col h-screen'>
      {/* Header */}
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-2xl font-semibold' style={{ color: "#6b9080" }}>
          MedRag Chat
        </h2>
        <Button variant='outline' size='sm' onClick={clearSession}>
          New Chat
        </Button>
      </div>

      {/* Message list */}
      <Card className='flex-1 overflow-y-auto p-4 mb-4 bg-white'>
        {messages.length === 0 && (
          <p className='text-sm text-gray-400'>
            Ask a question about your uploaded documents.
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-4 flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className='max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed'
              style={
                msg.role === "user"
                  ? { backgroundColor: "#6b9080", color: "#fff" }
                  : {
                      backgroundColor: "#f6fff8",
                      border: "1px solid #cce3de",
                      color: "#1a1a1a",
                    }
              }
            >
              <p className='whitespace-pre-wrap m-0'>
                {msg.content}
                {msg.loading && <span className='animate-pulse ml-0.5'>▌</span>}
              </p>

              {!msg.loading && msg.citations?.length > 0 && (
                <div className='mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500'>
                  <p className='font-semibold mb-1'>Sources:</p>
                  {msg.citations.map((c, j) => (
                    <div key={j} className='mb-0.5'>
                      <Badge variant='secondary' className='text-xs mr-1'>
                        Source {c.sourceNumber}
                      </Badge>
                      Document #{c.documentId}, p.{c.pageNumber}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </Card>

      {/* Input form */}
      <form onSubmit={handleSubmit} className='flex gap-2'>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Ask about your documents...'
          disabled={isStreaming}
          className='flex-1'
        />
        {isStreaming ? (
          <Button type='button' onClick={stopStreaming} variant='destructive'>
            Stop
          </Button>
        ) : (
          <Button
            type='submit'
            style={{ backgroundColor: "#6b9080", color: "#fff" }}
          >
            Send
          </Button>
        )}
      </form>
    </div>
  );
}
