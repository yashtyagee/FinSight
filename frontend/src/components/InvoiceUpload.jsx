import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Eye, FileImage, FileText } from 'lucide-react';
import { uploadInvoice } from '../api/client';
import { GSTSummaryPanel } from './GSTPanel';

export default function InvoiceUpload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isPdf, setIsPdf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [gstResult, setGstResult] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles?.length) {
      const f = acceptedFiles[0];
      setFile(f);
      setIsPdf(f.type === 'application/pdf');
      setPreview(URL.createObjectURL(f));
      setError(null);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await uploadInvoice(file);
      setResult(data);
      setGstResult(data.gst || null);
    } catch (err) {
      if (err.response?.status === 409) {
        setResult(err.response.data);
        setGstResult(err.response.data.gst || null);
      } else {
        setError(err.response?.data?.message || err.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div 
        {...getRootProps()} 
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-12 transition-all duration-200 ease-in-out cursor-pointer flex flex-col items-center justify-center gap-4
          ${isDragActive ? 'border-primary-500 bg-primary-500/10' : 'border-border bg-surface/30 hover:bg-surface/60 hover:border-slate-500'}
        `}
      >
        <input {...getInputProps()} />
        <div className={`p-4 rounded-full ${isDragActive ? 'bg-primary-500/20' : 'bg-slate-800'}`}>
          <UploadCloud className={`w-10 h-10 ${isDragActive ? 'text-primary-400' : 'text-slate-400'}`} />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-slate-200">
            {isDragActive ? "Drop your invoice here" : "Drag & drop your invoice"}
          </p>
          <p className="text-sm text-slate-500 mt-1">JPEG, PNG or PDF — up to 10MB</p>
        </div>
        
        {file && (
          <div className="absolute bottom-4 inset-x-0 mx-auto w-max bg-background/90 px-4 py-2 rounded-full border border-border text-sm flex items-center gap-2 shadow-lg backdrop-blur">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            {file.name}
          </div>
        )}
      </div>

      {/* Preview Panel */}
      {preview && !result && (
        <div className="rounded-2xl overflow-hidden border border-border bg-surface/20 animate-in fade-in duration-300">
          <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-medium text-slate-300">Invoice Preview</span>
            <span className="ml-auto text-xs text-slate-500 flex items-center gap-1">
              {isPdf ? <FileText className="w-3 h-3 text-red-400" /> : <FileImage className="w-3 h-3" />}
              {file?.name}
            </span>
          </div>
          <div className="relative overflow-hidden flex items-center justify-center bg-checkerboard" style={{ height: isPdf ? '520px' : 'auto', maxHeight: isPdf ? '520px' : '384px' }}>
            {isPdf ? (
              <iframe
                src={preview}
                title="PDF Preview"
                className="w-full h-full border-0"
                style={{ minHeight: '520px' }}
              />
            ) : (
              <img
                src={preview}
                alt="Invoice preview"
                className="max-w-full object-contain"
                style={{ maxHeight: '384px' }}
              />
            )}
            {loading && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
                <p className="text-sm text-primary-300 font-medium">Extracting with AI...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        <button 
          onClick={handleUpload}
          disabled={!file || loading}
          className="bg-primary-600 hover:bg-primary-500 active:bg-primary-700 disabled:bg-slate-700 disabled:text-slate-500 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-primary-500/20 flex items-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {loading ? 'Processing via AI...' : 'Extract & Analyze'}
        </button>
      </div>

      {/* Results */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="glass-panel p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              {result.saved === false ? (
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              )}
              <div>
                <h3 className="text-xl font-semibold text-white leading-none">
                  {result.saved === false ? 'Duplicate Detected' : 'Extraction Successful'}
                </h3>
                <p className="text-sm text-slate-400 mt-1">{result.message}</p>
              </div>
            </div>
            {result.anomalies?.isAnomaly && (
              <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase rounded-lg">
                Anomaly Flagged
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <section>
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Core Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ResultItem label="Vendor" value={result.data.vendor} />
                <ResultItem label="Invoice No." value={result.data.invoice_number} />
                <ResultItem label="Date" value={result.data.date} />
                <ResultItem label="Category" value={result.data.category} highlight />
                <ResultItem label="GSTIN" value={result.data.gstin} />
                <ResultItem label="Email" value={result.data.email} />
                <ResultItem label="Amount" value={`₹${result.data.amount}`} highlight />
                <ResultItem label="Tax / GST" value={`₹${result.data.tax}`} />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <ResultItem label="Address" value={result.data.address} multiline />
                <ResultItem label="Payment Details" value={result.data.payment_details} multiline />
              </div>
            </section>

            {/* GST Classification Panel */}
            <GSTSummaryPanel gstData={gstResult} invoiceData={result.data} />

            {result.data.line_items?.length > 0 && (
              <section>
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Line Items</h4>
                <div className="overflow-hidden rounded-xl border border-border bg-surface/20">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Description</th>
                        <th className="px-4 py-3 font-semibold text-center">Qty</th>
                        <th className="px-4 py-3 font-semibold text-right">Unit Price</th>
                        <th className="px-4 py-3 font-semibold text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {result.data.line_items.map((item, idx) => (
                        <tr key={idx} className="text-slate-300 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">{item.description}</td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">₹{item.unit_price}</td>
                          <td className="px-4 py-3 text-right text-white font-medium">₹{item.subtotal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {result.anomalies?.isAnomaly && (
              <section className="p-4 rounded-xl border border-red-500/30 bg-red-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest">Anomaly Report</h4>
                </div>
                <ul className="space-y-2">
                  {result.anomalies.reasons.split(' | ').map((reason, idx) => (
                    <li key={idx} className="text-sm text-red-400/80 flex gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultItem({ label, value, highlight, multiline }) {
  return (
    <div className={`p-4 rounded-xl min-w-0 ${highlight ? 'bg-primary-500/10 border border-primary-500/20' : 'bg-surface/50 border border-border/50'}`}>
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">{label}</p>
      {multiline ? (
        <p className={`text-sm font-medium leading-relaxed break-words ${highlight ? 'text-primary-400' : 'text-slate-200'}`}>{value || '-'}</p>
      ) : (
        <p className={`text-lg font-medium truncate ${highlight ? 'text-primary-400' : 'text-slate-200'}`} title={value || '-'}>{value || '-'}</p>
      )}
    </div>
  );
}
