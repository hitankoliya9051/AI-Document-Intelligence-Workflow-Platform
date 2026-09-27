'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import { formatBytes, formatRelativeTime, getStatusBadge, getConfidenceBadge } from '../../../lib/utils';
import {
  Search as SearchIcon,
  Filter,
  FileText,
  Eye,
  Download,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

function SearchComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [docType, setDocType] = useState(searchParams.get('type') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [minConfidence, setMinConfidence] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [results, setResults] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const executeSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 40 };
      if (query.trim()) params.q = query.trim();
      if (docType) params.documentType = docType;
      if (status) params.status = status;
      if (minConfidence) params.minConfidence = minConfidence;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res: any = await api.get('/search', params);
      setResults(res.data || []);
      setTotalCount(res.pagination?.total || 0);
    } catch (err: any) {
      toast(err.message || 'Search execution failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [query, docType, status, minConfidence, dateFrom, dateTo, toast]);

  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <SearchIcon className="w-6 h-6 text-purple-600" /> Global Document Search & Knowledge Base
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Search across OCR extracted text, structured entity values, metadata, and summaries
        </p>
      </div>

      {/* Search Input & Multi-faceted Filter Bar */}
      <div className="p-5 rounded-3xl glass-panel space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keywords, invoice #, amounts, entities, dates, vendor names..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/80">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Document Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full p-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="">All Types</option>
              <option value="invoice">Invoices</option>
              <option value="contract">Contracts</option>
              <option value="financial_report">Financial Reports</option>
              <option value="receipt">Receipts</option>
              <option value="general">General</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Processing Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="review_required">Review Required</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Min Confidence Score
            </label>
            <select
              value={minConfidence}
              onChange={(e) => setMinConfidence(e.target.value)}
              className="w-full p-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="">Any Confidence</option>
              <option value="0.90">&gt; 90% (High)</option>
              <option value="0.80">&gt; 80% (Good)</option>
              <option value="0.70">&gt; 70%</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full p-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Found {totalCount} matching documents</span>
          {query && (
            <span>
              Searching for: &quot;<span className="text-purple-600 dark:text-purple-400 font-semibold">{query}</span>&quot;
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-purple-600 animate-pulse glass-panel rounded-3xl">
            Searching across documents...
          </div>
        ) : results.length === 0 ? (
          <div className="p-16 text-center glass-panel rounded-3xl">
            <SearchIcon className="w-12 h-12 text-purple-300 dark:text-purple-800 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              No matching documents
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try broadening your keyword search or resetting the status and type filters.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map(({ document: doc, snippet }) => {
              const statusBadge = getStatusBadge(doc.status);
              const conf = getConfidenceBadge(doc.confidenceScore);

              return (
                <div
                  key={doc._id}
                  className="p-5 rounded-3xl glass-panel border border-purple-100 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-600/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="w-6 h-6 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[10px] uppercase flex items-center justify-center border border-purple-200 dark:border-purple-800">
                        {doc.fileExtension}
                      </span>
                      <a
                        href={`/documents/${doc._id}`}
                        className="font-bold text-sm text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        {doc.title}
                      </a>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge.bg}`}
                      >
                        {statusBadge.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${conf.color}`}>
                        {conf.text}
                      </span>
                    </div>

                    {/* Matched text snippet */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-purple-50/40 dark:bg-slate-900/60 p-2.5 rounded-xl border border-purple-100 dark:border-slate-800 mt-2">
                      {snippet}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                      <span>{doc.documentType.toUpperCase()}</span>
                      <span>·</span>
                      <span>{formatBytes(doc.fileSize)}</span>
                      <span>·</span>
                      <span>Uploaded {formatRelativeTime(doc.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <a
                      href={`/api/documents/${doc._id}/download`}
                      title="Download file"
                      className="p-2 rounded-xl border border-purple-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <a
                      href={`/documents/${doc._id}`}
                      className="py-2 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5"
                    >
                      View Intelligence <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Loading search engine...</div>}>
      <SearchComponent />
    </Suspense>
  );
}
