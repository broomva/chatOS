"use client";

import { useChat } from "@ai-sdk/react";
import { Button } from "@chatos/ui";
import { Send } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

export function Chat() {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLoading = status === "streaming" || status === "submitted";

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold">chatOS</h2>
              <p className="mt-2 text-muted-foreground">How can I help you today?</p>
            </div>
          </div>
        )}
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">
                  {message.parts.map((part) => {
                    if (part.type === "text") {
                      return part.text;
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              Error: {error.message}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a message..."
            className="flex-1 rounded-xl border bg-background px-4 py-3 text-sm outline-none ring-ring focus:ring-2"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
