import React from 'react';
import AIAdvisor from '../components/AIAdvisor';

export default function AdvisorPage() {
  return (
    <div className="h-full p-8 md:p-12 overflow-y-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-light text-white mb-2">
          AI <span className="font-semibold text-primary-500">Advisor</span>
        </h2>
        <p className="text-slate-400">
          Chat with FinAi — your intelligent financial assistant powered by RAG & Gemini.
        </p>
      </header>
      <div className="max-w-4xl mx-auto">
        <AIAdvisor />
      </div>
    </div>
  );
}
