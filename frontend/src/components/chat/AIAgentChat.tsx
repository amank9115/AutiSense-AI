import { useState } from "react"

const cannedReplies: Record<string, string> = {
  autism: "Autism is a spectrum of neurodevelopmental differences. Early support focuses on communication, social connection, and adaptive skills.",
  therapy: "Structured play, speech support, and occupational exercises are common. Consistency and family collaboration matter most.",
  platform: "Use live screening for initial signals, then review trends in reports and share with clinicians for formal assessment pathways.",
}

const AIAgentChat = () => {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([
    { from: "ai", text: "Hello, I am your Care AI assistant. Ask about autism support, therapy, or platform guidance." },
  ])

  const sendMessage = () => {
    if (!input.trim()) return
    const lower = input.toLowerCase()
    const answer =
      Object.entries(cannedReplies).find(([keyword]) => lower.includes(keyword))?.[1] ??
      "I can help with autism basics, therapy plans, and platform workflows."

    setMessages((current) => [...current, { from: "user", text: input }, { from: "ai", text: answer }])
    setInput("")
  }

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-900/60">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-100">AI Support Agent</h3>
      <div className="mt-3 h-56 space-y-2 overflow-y-auto rounded-xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-950/60">
        {messages.map((message, index) => (
          <div
            key={`${message.from}-${index}`}
            className={`max-w-[88%] rounded-lg px-3 py-2 text-xs ${
              message.from === "user"
                ? "ml-auto bg-sky-500 text-white"
                : "bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onInputKeyDown}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
          placeholder="Ask the assistant..."
        />
        <button onClick={sendMessage} className="rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white">
          Send
        </button>
      </div>
    </div>
  )
}

export default AIAgentChat
