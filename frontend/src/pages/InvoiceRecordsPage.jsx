import React from 'react';
import InvoiceTable from '../components/InvoiceTable';
import { FilingExportButton } from '../components/GSTPanel';

export default function InvoiceRecordsPage() {
  return (
    <div className="h-full overflow-y-auto p-8 md:p-12 relative">
      <header className="mb-10">
        <h2 className="text-3xl font-light text-white mb-2">
          Invoice <span className="font-semibold text-primary-500">Records</span>
        </h2>
        <p className="text-slate-400">View and manage all processed invoices and GST data.</p>
      </header>

      <div className="mb-8">
        <FilingExportButton />
      </div>

      <div className="mb-8">
        <InvoiceTable />
      </div>
    </div>
  );
}
