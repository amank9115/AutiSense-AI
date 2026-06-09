"use client";
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import { useAppStore } from "@/store";

const AIAgentChat = () => {
  const user = useAppStore(state => state.user);
  const token = useAppStore(state => state.token);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  
  const chat = useChat({
    api: `${API_BASE}/ai/chat/default-session`,
    headers: {
      Authorization: `Bearer ${token}`
    },
  } as any);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = chat as any;

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      // Vercel AI SDK handleSubmit expects a FormEvent, but we can simulate it or call it without args if supported
      // Or simply wrap in a form
    }
    };

    return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-900/60 flex flex-col h-full max-h-[400px]">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-100 mb-2 flex items-center justify-between">
        <span>AI Support Agent</span>
        {isLoading && <span className="text-xs text-sky-500 animate-pulse">Thinking...</span>}
      </h3>

      <div className="flex-1 overflow-y-auto space-y-3 rounded-xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-950/60">
        {messages.length === 0 && (
          <div className="text-center text-xs text-slate-400 mt-10">
            Hello{user?.name ? ` ${user.name}` : ''}! I am your Care AI assistant. Ask about autism support, therapy, or platform guidance.
          </div>
        )}
        {messages.map((message: any) => (
          <div
            key={message.id}
            className={`max-w-[88%] rounded-lg px-3 py-2 text-sm ${
              message.role === "user"
                ? "ml-auto bg-sky-500 text-white"
                : "bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-sm"
            }`}
          >
            {message.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => {
             if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
             }
          }}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          placeholder="Ask the assistant..."
          disabled={isLoading}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-all hover:bg-sky-600 active:scale-95"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default AIAgentChat;
