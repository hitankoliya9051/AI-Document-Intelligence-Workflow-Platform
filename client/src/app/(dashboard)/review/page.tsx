'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import { formatBytes, formatRelativeTime, getConfidenceBadge } from '../../../lib/utils';
import {
  CheckSquare,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  Check,
  X,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function ReviewQueuePage() {
  const { toast } = useToast();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [decision, setDecision] = useState<'approve' | 'reject' | 'request_changes'>('approve');
  const [notes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/reviews/queue');
      setQueue(res || []);
    } catch (err: any) {
      toast(err.message || 'Failed to fetch review queue', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleSubmitDecision = async () => {
    if (!activeItem) return;
    setSubmitting(true);
    try {
      await api.post(`/reviews/${activeItem.document._id}`, {
        action: decision,
        notes,
      });

      toast(`Review decision "${decision}" recorded successfully.`, 'success');
      setActiveItem(null);
      setReviewNotes('');
      fetchQueue();
    } catch (err: any) {
      toast(err.message || 'Error saving review decision', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-amber-500" /> Human Verification & Review Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Documents with low-confidence OCR entities or requiring reviewer sign-off before completion
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 animate-pulse glass-panel rounded-3xl">
          Loading verification queue...
        </div>
      ) : queue.length === 0 ? (
        <div className="p-16 text-center glass-panel rounded-3xl">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Review Queue is Clear!
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All uploaded documents have completed automated extraction and human verification.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((item) => {
            const doc = item.document;
            const ext = item.extractedData;
            const conf = getConfidenceBadge(doc.confidenceScore);

            return (
              <div
                key={doc._id}
                className="p-5 rounded-3xl glass-panel border border-purple-100 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-600/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {doc.fileExtension.toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={`/documents/${doc._id}`}
                        className="font-bold text-sm text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors truncate"
                      >
                        {doc.title}
                      </a>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${conf.color}`}>
                        {conf.text}
                      </span>
                      {item.urgency === 'high' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          {item.lowConfidenceFieldCount} Low Confidence Fields
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                      {doc.summary || doc.description || doc.originalName}
                    </p>

                    {/* Extracted fields pills preview */}
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {ext?.fields?.slice(0, 4).map((f: any) => (
                        <span
                          key={f.key}
                          className="px-2 py-1 rounded-lg bg-purple-50/60 dark:bg-slate-900 border border-purple-100 dark:border-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300"
                        >
                          <span className="opacity-60">{f.label}:</span>{' '}
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {String(f.value || '')}
                          </span>
                        </span>
                      ))}
                      {(ext?.fields?.length || 0) > 4 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{(ext?.fields?.length || 0) - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Queue Item Actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  <a
                    href={`/documents/${doc._id}`}
                    className="py-2 px-3.5 rounded-xl border border-purple-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Inspect Split View
                  </a>

                  <button
                    onClick={() => {
                      setActiveItem(item);
                      setDecision('approve');
                    }}
                    className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> Review & Decide
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#160f2a] border border-purple-100 dark:border-purple-900/50 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Review: {activeItem.document.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Select verification outcome and provide optional reviewer feedback
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDecision('approve')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                    decision === 'approve'
                      ? 'bg-emerald-500 text-white border-emerald-400'
                      : 'bg-purple-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-purple-100 dark:border-slate-800'
                  }`}
                >
                  Approve Document
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('request_changes')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                    decision === 'request_changes'
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-purple-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-purple-100 dark:border-slate-800'
                  }`}
                >
                  Request Changes
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('reject')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                    decision === 'reject'
                      ? 'bg-rose-500 text-white border-rose-400'
                      : 'bg-purple-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-purple-100 dark:border-slate-800'
                  }`}
                >
                  Reject
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Reviewer Rationale & Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Verified amount against client PO. All line items approved."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-purple-50/40 dark:bg-slate-900 border border-purple-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmitDecision}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                >
                  Confirm Decision
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
