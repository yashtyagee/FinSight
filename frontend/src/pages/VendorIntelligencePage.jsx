import React from 'react';
import VendorIntelligence from '../components/VendorIntelligence';

export default function VendorIntelligencePage() {
  return (
    <div className="h-full overflow-y-auto p-8 md:p-12 relative">
      <header className="mb-10">
        <h2 className="text-3xl font-light text-white mb-2">
          Vendor <span className="font-semibold text-primary-500">Intelligence</span>
        </h2>
        <p className="text-slate-400">AI-powered vendor risk analysis and reliability scoring.</p>
      </header>

      <VendorIntelligence />
    </div>
  );
}
