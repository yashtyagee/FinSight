import React from 'react';
import InvoiceUpload from '../components/InvoiceUpload';

export default function Home() {
  return (
    <div className="min-h-full p-8 md:p-12">
      <header className="mb-10">
        <h2 className="text-3xl font-light text-white mb-2">
          New <span className="font-semibold text-primary-500">Invoice</span>
        </h2>
        <p className="text-slate-400">Let our AI instantly extract and categorize your financial data.</p>
      </header>
      
      <div className="max-w-3xl mx-auto">
        <InvoiceUpload />
      </div>
    </div>
  );
}
