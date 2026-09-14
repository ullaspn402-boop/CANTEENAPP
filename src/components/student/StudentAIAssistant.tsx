import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Sparkles, Send, X, Bot, User as UserIcon, RefreshCw, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  source?: 'gemini' | 'local_ml' | 'fallback';
  suggestions?: string[];
}

interface StudentAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentAIAssistant: React.FC<StudentAIAssistantProps> = ({ isOpen, onClose }) => {
  const { authHeaders, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hi ${user?.name?.split(' ')[0] || 'there'}! I'm your campus canteen assistant. Ask me anything about today's menu, lunch recommendations, vegetarian options, or pickup times!`,
      source: 'local_ml',
      suggestions: ['What do you recommend for lunch?', 'Fastest meal to pick up?', 'Show me vegetarian dishes'],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const sendMessage = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || loading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('You are asking questions a bit too quickly. Please wait a moment.');
        }
        throw new Error('AI assistant is temporarily busy. Showing general canteen help.');
      }

      const data = await res.json();
      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: data.answer || 'I am ready to help you with your order!',
        source: data.source,
        suggestions: data.suggestions || ['Check active order status', 'View today specials'],
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      // Graceful student-facing message (never crash or show raw errors!)
      const fallbackMsg: Message = {
        id: `fb_${Date.now()}`,
        sender: 'assistant',
        text: 'The AI assistant is temporarily resting or experiencing high traffic. For instant orders, browse the menu or visit Counter 1 for immediate assistance!',
        source: 'fallback',
        suggestions: ['View Menu', 'Track My Digital Token'],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-neutral-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Campus Canteen Assistant</h2>
              <span className="text-[10px] text-amber-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                Resilient Multi-Tier AI & FAQs
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-neutral-50/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-amber-600 text-white rounded-br-xs'
                    : 'bg-white text-neutral-800 border border-neutral-200 rounded-bl-xs shadow-2xs'
                }`}
              >
                {m.text}

                {m.source === 'fallback' && (
                  <div className="mt-1.5 pt-1.5 border-t border-neutral-100 text-[10px] text-amber-700 font-medium">
                    (Standard Canteen Help Mode)
                  </div>
                )}
              </div>

              {/* Suggestions */}
              {m.suggestions && m.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {m.suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(sug)}
                      className="px-2.5 py-1 rounded-full bg-white hover:bg-amber-50 border border-neutral-200 hover:border-amber-300 text-[11px] text-neutral-700 font-medium transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-neutral-500 italic p-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
              <span>Thinking...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-neutral-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about food, wait times, combos..."
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
