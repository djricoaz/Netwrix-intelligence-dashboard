import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Loader, Sparkles } from "lucide-react";
import api from "../services/api";
import clsx from "clsx";

const QUICK_QUESTIONS = [
  "Who are the riskiest users this week?",
  "What sensitive data is most exposed on file servers?",
  "Predict our breach probability in 3 months",
  "Which GPO changes are most critical?",
  "Summarize Exchange DLP violations this month",
  "Which SharePoint sites have the most external sharing?",
];

export default function AiChat() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm your Netwrix Intelligence AI. Ask me anything about your security posture, user risk, sensitive data, or breach predictions." }
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (question) => {
    const q = question || input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages(m => [...m, { role: "user", content: q }]);
    setLoading(true);
    try {
      const { data } = await api.post("/ai/query", { question: q });
      setMessages(m => [...m, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "AI is unavailable. Check that Ollama is running." }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600/20 border border-blue-600/30 rounded-lg flex items-center justify-center">
          <Bot size={16} className="text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">AI Security Assistant</p>
          <p className="text-[10px] text-gray-500">Powered by Ollama llama3.2 · Fully local · No data leaves your network</p>
        </div>
      </div>

      {/* Quick questions */}
      <div className="px-6 pt-4 flex flex-wrap gap-2">
        {QUICK_QUESTIONS.map(q => (
          <button key={q} onClick={() => send(q)}
            className="text-[10px] px-3 py-1.5 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors flex items-center gap-1"
          >
            <Sparkles size={9} />
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={clsx("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
            <div className={clsx("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
              msg.role === "user" ? "bg-blue-600" : "bg-gray-700"
            )}>
              {msg.role === "user" ? <User size={13} /> : <Bot size={13} />}
            </div>
            <div className={clsx("max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed",
              msg.role === "user"
                ? "bg-blue-600/20 border border-blue-600/30 text-blue-100 rounded-tr-none"
                : "bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-none"
            )}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center">
              <Bot size={13} />
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl rounded-tl-none px-4 py-3">
              <Loader size={14} className="animate-spin text-gray-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-800">
        <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about users, sensitive data, breach risk, predictions..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button type="submit" disabled={!input.trim() || loading}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
