import React, { useState, useRef, useEffect } from 'react';
import { getAIAdvice } from '../api/client';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

/**
 * Parses AI response text with basic markdown into formatted JSX.
 * Handles: **bold**, headers (#, ##, ###), bullet lists (- / *), numbered lists, and line breaks.
 */
function FormattedMessage({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let listBuffer = [];
  let listType = null; // 'ul' | 'ol'

  const flushList = () => {
    if (listBuffer.length === 0) return;
    if (listType === 'ol') {
      elements.push(
        <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1.5 my-2 text-slate-200">
          {listBuffer.map((item, i) => <li key={i} className="leading-relaxed">{parseBold(item)}</li>)}
        </ol>
      );
    } else {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-1.5 my-2 text-slate-200">
          {listBuffer.map((item, i) => (
            <li key={i} className="flex items-start gap-2 leading-relaxed">
              <span className="text-primary-400 mt-1 shrink-0">•</span>
              <span>{parseBold(item)}</span>
            </li>
          ))}
        </ul>
      );
    }
    listBuffer = [];
    listType = null;
  };

  const parseBold = (text) => {
    if (!text) return text;
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i} className="font-semibold text-white">{part}</strong> : part
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList();
      continue;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h5 key={`h5-${i}`} className="text-sm font-bold text-primary-400 uppercase tracking-wider mt-4 mb-1">
          {parseBold(trimmed.slice(4))}
        </h5>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${i}`} className="text-base font-bold text-white mt-4 mb-1">
          {parseBold(trimmed.slice(3))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="text-lg font-bold text-white mt-3 mb-1">
          {parseBold(trimmed.slice(2))}
        </h3>
      );
      continue;
    }

    // Bullet list
    if (/^[-*]\s/.test(trimmed)) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listBuffer.push(trimmed.replace(/^[-*]\s+/, ''));
      continue;
    }

    // Numbered list
    if (/^\d+[\.\)]\s/.test(trimmed)) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listBuffer.push(trimmed.replace(/^\d+[\.\)]\s+/, ''));
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-slate-200 leading-relaxed my-1">
        {parseBold(trimmed)}
      </p>
    );
  }

  flushList();
  return <div className="space-y-1">{elements}</div>;
}

export default function AIAdvisor() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am **FinAi**, your AI Financial Advisor. Based on your invoices and financial data, I can help you with spending analysis, vendor insights, GST calculations, and more.\n\n### How can I help you today?\n- Ask about **top expenses** or spending trends\n- Get **vendor analysis** and recommendations\n- Check **GST compliance** status\n- Request **cost optimization** insights' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const responseData = await getAIAdvice(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: responseData.data }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting to the financial database right now. Please try again in a moment.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel flex flex-col h-[600px] border border-primary-500/20 shadow-primary-500/5">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center gap-3 bg-surface/50 rounded-t-xl">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-primary-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-200">FinAi Advisor</h3>
          <p className="text-xs text-slate-400">Powered by FinAi • Gemini + RAG Pipeline</p>
        </div>
        <div className="ml-auto px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider">
          Online
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-cyan-400 flex items-center justify-center shrink-0 mt-1 shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`max-w-[80%] min-w-0 rounded-2xl px-4 py-3 text-sm leading-relaxed break-words ${
              msg.role === 'user' 
              ? 'bg-primary-600 text-white rounded-br-none' 
              : 'bg-surface border border-border text-slate-200 rounded-bl-none'
            }`}>
              {msg.role === 'assistant' ? (
                <FormattedMessage content={msg.content} />
              ) : (
                msg.content
              )}
            </div>
            {msg.role === 'user' && (
               <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-1">
               <User className="w-5 h-5 text-slate-300" />
             </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-cyan-400 flex items-center justify-center shrink-0 mt-1 shadow-md">
               <Sparkles className="w-4 h-4 text-white" />
             </div>
             <div className="bg-surface border border-border text-slate-400 rounded-2xl rounded-bl-none p-4 flex items-center gap-2">
               <Loader2 className="w-4 h-4 animate-spin" /> Analyzing your data...
             </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 border-t border-border/50 bg-background/50 rounded-b-xl flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask FinAi about expenses, vendors, GST..."
          className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
        />
        <button 
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white p-3 rounded-xl transition-colors shrink-0 shadow-lg shadow-primary-500/10"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
