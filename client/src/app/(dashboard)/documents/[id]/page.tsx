'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { useToast } from '../../../../context/ToastContext';
import { useAuth } from '../../../../context/AuthContext';
import {
  formatBytes,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  getStatusBadge,
  getConfidenceBadge,
} from '../../../../lib/utils';
import {
  IDocument,
  IExtractedData,
  IExtractedField,
  IWorkflowExecution,
  IComment,
  IReview,
} from '../../../../types';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Archive,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Bot,
  Send,
  MessageSquare,
  GitBranch,
  History,
  Check,
  X,
  Edit2,
  Save,
  Clock,
  Layers,
  HelpCircle,
  Table as TableIcon,
  Shield,
  ExternalLink,
} from 'lucide-react';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const documentId = params.id as string;

  const [document, setDocument] = useState<IDocument | null>(null);
  const [extractedData, setExtractedData] = useState<IExtractedData | null>(null);
  const [workflowExecution, setWorkflowExecution] = useState<IWorkflowExecution | null>(null);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [comments, setComments] = useState<IComment[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab in Right Pane
  const [activeTab, setActiveTab] = useState<'fields' | 'insights' | 'chat' | 'workflow' | 'comments'>('fields');

  // Inline Title Edit
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  // Editable Fields State
  const [editingFields, setEditingFields] = useState<Record<string, any>>({});
  const [savingFields, setSavingFields] = useState(false);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string; citations?: string[]; isDemoMode?: boolean }>
  >([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Comments State
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'request_changes'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchDocumentData = useCallback(async () => {
    try {
      const res: any = await api.get(`/documents/${documentId}`);
      setDocument(res.document);
      setTitleInput(res.document.title);
      setExtractedData(res.extractedData);
      setWorkflowExecution(res.workflowExecution);
      setReviews(res.reviews || []);

      // Initialize editable fields
      if (res.extractedData?.fields) {
        const fieldMap: Record<string, any> = {};
        res.extractedData.fields.forEach((f: IExtractedField) => {
          fieldMap[f.key] = f.value;
        });
        setEditingFields(fieldMap);
      }

      // Fetch comments
      const commentRes: any = await api.get(`/comments/${documentId}`);
      setComments(commentRes || []);
    } catch (err: any) {
      toast(err.message || 'Error loading document detail', 'error');
    } finally {
      setLoading(false);
    }
  }, [documentId, toast]);

  useEffect(() => {
    fetchDocumentData();
  }, [fetchDocumentData]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSaveTitle = async () => {
    if (!titleInput.trim() || titleInput === document?.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      await api.patch(`/documents/${documentId}`, { title: titleInput.trim() });
      toast('Title updated successfully', 'success');
      setIsEditingTitle(false);
      fetchDocumentData();
    } catch (err: any) {
      toast(err.message || 'Failed to update title', 'error');
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    setEditingFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveAllFields = async () => {
    setSavingFields(true);
    try {
      const payload = Object.entries(editingFields).map(([key, value]) => ({
        key,
        value,
        status: 'approved',
      }));

      await api.patch(`/extractions/${documentId}/fields`, { fields: payload });
      toast('Extracted fields updated and verified', 'success');
      fetchDocumentData();
    } catch (err: any) {
      toast(err.message || 'Failed to update fields', 'error');
    } finally {
      setSavingFields(false);
    }
  };

  const handleAskAI = async (queryText?: string) => {
    const q = queryText || chatInput;
    if (!q.trim() || chatLoading) return;

    const userMsg = { role: 'user' as const, content: q };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!queryText) setChatInput('');
    setChatLoading(true);

    try {
      const history = chatMessages.map((m) => ({ role: m.role, content: m.content }));
      const res: any = await api.post(`/documents/${documentId}/chat`, {
        query: q,
        history,
      });

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer,
          citations: res.citations,
          isDemoMode: res.isDemoMode,
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error generating response: ${err.message}`,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || commentSubmitting) return;

    setCommentSubmitting(true);
    try {
      const created: any = await api.post(`/comments/${documentId}`, {
        content: newComment.trim(),
      });
      setComments((prev) => [...prev, created]);
      setNewComment('');
      toast('Comment posted', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to post comment', 'error');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleSubmitReviewDecision = async () => {
    setSubmittingReview(true);
    try {
      await api.post(`/reviews/${documentId}`, {
        action: reviewAction,
        notes: reviewNotes,
      });

      toast(`Document review marked as "${reviewAction}".`, 'success');
      setShowReviewModal(false);
      setReviewNotes('');
      fetchDocumentData();
    } catch (err: any) {
      toast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReprocess = async () => {
    try {
      await api.post(`/documents/${documentId}/process`);
      toast('AI pipeline processing triggered in background', 'info');
      setTimeout(fetchDocumentData, 2500);
    } catch (err: any) {
      toast(err.message || 'Reprocess error', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this document and all its data?')) return;
    try {
      await api.delete(`/documents/${documentId}`);
      toast('Document permanently deleted', 'success');
      router.push('/documents');
    } catch (err: any) {
      toast(err.message || 'Delete failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
        <span className="text-xs">Loading document intelligence workspace...</span>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-bold">Document not found</h2>
        <a href="/documents" className="text-purple-600 dark:text-purple-400 text-xs mt-2 inline-block">
          ← Back to documents
        </a>
      </div>
    );
  }

  const status = getStatusBadge(document.status);
  const conf = getConfidenceBadge(document.confidenceScore);

  return (
    <div className="space-y-4">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <a
            href="/documents"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </a>

          <div>
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="px-2.5 py-1 text-sm font-bold rounded-lg bg-white dark:bg-slate-900 border border-purple-500 text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1 rounded bg-purple-600 text-white hover:bg-purple-700"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setTitleInput(document.title);
                      setIsEditingTitle(false);
                    }}
                    className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{document.title}</span>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </h1>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${status.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1.5 ${status.dot}`} />
                {status.label}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${conf.color}`}>
                {conf.text}
              </span>
              <span>·</span>
              <span className="uppercase text-[10px] font-semibold">{document.documentType}</span>
              <span>·</span>
              <span>{formatBytes(document.fileSize)}</span>
              <span>·</span>
              <span>Uploaded by {document.uploadedBy?.name || 'User'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {document.status === 'review_required' && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
            >
              <AlertCircle className="w-4 h-4" /> Review & Decide
            </button>
          )}

          <a
            href={`/api/documents/${document._id}/download`}
            className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </a>

          <button
            onClick={handleReprocess}
            title="Re-run AI extraction"
            className="p-2 rounded-xl border border-purple-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleDelete}
            title="Delete document"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Split-View Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-175px)] min-h-[600px]">
        {/* Left Pane: Document Viewer (6 cols on lg) */}
        <div className="lg:col-span-6 rounded-3xl glass-panel flex flex-col overflow-hidden border border-purple-100 dark:border-slate-800">
          <div className="p-3 px-4 border-b border-purple-100 dark:border-slate-800 bg-purple-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Document Preview ({document.fileExtension.toUpperCase()})
            </span>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>{document.wordCount} words</span>
              <span>·</span>
              <a
                href={`/api/documents/${document._id}/preview`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1"
              >
                Popout <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-slate-950 p-4">
            {document.fileExtension === 'pdf' ? (
              <iframe
                src={`/api/documents/${document._id}/preview`}
                className="w-full h-full rounded-2xl border border-slate-800 bg-slate-900"
                title={document.title}
              />
            ) : ['png', 'jpg', 'jpeg', 'webp'].includes(document.fileExtension) ? (
              <div className="h-full flex items-center justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/documents/${document._id}/preview`}
                  alt={document.title}
                  className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
                />
              </div>
            ) : extractedData?.tables && extractedData.tables.length > 0 ? (
              <div className="space-y-4">
                {extractedData.tables.map((tbl, tIdx) => (
                  <div key={tIdx} className="rounded-xl border border-slate-800 overflow-hidden">
                    <div className="p-2.5 bg-slate-900 font-bold text-xs text-purple-400 flex items-center gap-2">
                      <TableIcon className="w-3.5 h-3.5" /> {tbl.name}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/80 text-[10px] text-slate-400 uppercase">
                          <tr>
                            {tbl.headers.map((h, hIdx) => (
                              <th key={hIdx} className="p-2">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {tbl.rows.slice(0, 50).map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-900/40">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="p-2 whitespace-nowrap">
                                  {String(cell || '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed select-text">
                {document.extractedText || 'No text extracted from document.'}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Intelligence Deck (6 cols on lg) */}
        <div className="lg:col-span-6 rounded-3xl glass-panel flex flex-col overflow-hidden border border-purple-100 dark:border-slate-800">
          {/* Deck Tab Navigation */}
          <div className="flex items-center gap-1 p-2 border-b border-purple-100 dark:border-slate-800 bg-purple-50/50 dark:bg-slate-900/50 overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveTab('fields')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'fields'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Fields ({extractedData?.fields?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('insights')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'insights'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Summary
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'chat'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-slate-800'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              AI Chat
            </button>

            <button
              onClick={() => setActiveTab('workflow')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'workflow'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-slate-800'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              Workflow
            </button>

            <button
              onClick={() => setActiveTab('comments')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'comments'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Comments ({comments.length})
            </button>
          </div>

          {/* Deck Body */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* TAB 1: EXTRACTED FIELDS */}
            {activeTab === 'fields' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Structured Extracted Entities
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Edit values inline and verify against document text
                    </p>
                  </div>
                  <button
                    onClick={handleSaveAllFields}
                    disabled={savingFields}
                    className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-all"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>

                {extractedData?.isDemoMode && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <span className="font-bold">Offline Demo Extraction:</span> Extracted via local rule-based regex engine (no external AI key required). Clearly separated from live AI inference.
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  {extractedData?.fields?.map((field) => {
                    const conf = getConfidenceBadge(field.confidence);
                    return (
                      <div
                        key={field.key}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {field.label}
                          </label>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${conf.color}`}>
                              {conf.text}
                            </span>
                            {field.isEdited && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                Edited
                              </span>
                            )}
                          </div>
                        </div>

                        <input
                          type="text"
                          value={editingFields[field.key] ?? field.value ?? ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-950 border border-purple-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: AI SUMMARY & INSIGHTS */}
            {activeTab === 'insights' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Executive AI Summary
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                    {document.summary || 'Summary generated during parsing.'}
                  </p>
                </div>

                {/* Named Entities Detected */}
                {extractedData?.entities && extractedData.entities.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Key Named Entities Detected
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {extractedData.entities.map((ent, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-xl bg-purple-50/50 dark:bg-slate-900/60 border border-purple-100 dark:border-slate-800 text-xs"
                        >
                          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block uppercase">
                            {ent.type}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {ent.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: AI DOCUMENT CHAT */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full space-y-3">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
                  Ask questions grounded specifically in this document&apos;s extracted content. Answers include citations from the source text.
                </div>

                {/* Quick suggestions */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'What is the total amount?',
                    'Who is the vendor?',
                    'What are the key dates?',
                    'Summarize main obligations',
                  ].map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAskAI(prompt)}
                      className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-medium hover:bg-purple-100 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                {/* Chat Message Thread */}
                <div
                  ref={chatScrollRef}
                  className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[240px] max-h-[350px]"
                >
                  {chatMessages.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-center text-xs text-slate-500">
                      <Bot className="w-8 h-8 text-purple-400/50 mb-2" />
                      Ask any question about this document above or type below.
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl text-xs ${
                          msg.role === 'user'
                            ? 'bg-purple-600 text-white ml-8 shadow-md shadow-purple-600/20'
                            : 'bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 mr-8 text-slate-800 dark:text-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="font-semibold text-[10px] opacity-75 mb-1">
                          {msg.role === 'user' ? 'You' : 'Document Assistant'}
                        </div>
                        <div className="whitespace-pre-wrap">{msg.content}</div>

                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-purple-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="font-semibold block mb-0.5 text-purple-600 dark:text-purple-400">
                              Direct Citations:
                            </span>
                            {msg.citations.map((c, cIdx) => (
                              <div key={cIdx} className="italic bg-purple-50/60 dark:bg-slate-950/40 p-1 rounded mt-0.5 border border-purple-100 dark:border-slate-800">
                                &quot;{c}&quot;
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 text-xs text-purple-600 dark:text-purple-400 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Analyzing document text...
                    </div>
                  )}
                </div>

                {/* Input box */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskAI();
                  }}
                  className="flex items-center gap-2 pt-2 border-t border-purple-100 dark:border-slate-800"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question about this document..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatLoading}
                    className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-colors shadow-lg shadow-purple-600/30"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 4: WORKFLOW PROGRESSION */}
            {activeTab === 'workflow' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-purple-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Workflow Pipeline Status
                  </h3>
                  <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                    {workflowExecution?.status?.toUpperCase() || 'IN PROGRESS'}
                  </span>
                </div>

                {/* Steps History */}
                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {workflowExecution?.history?.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 relative z-10 text-xs">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          step.action === 'approved' || step.action === 'passed'
                            ? 'bg-emerald-500 text-white'
                            : step.action === 'started'
                            ? 'bg-amber-500 text-white animate-pulse'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {step.action === 'approved' || step.action === 'passed' ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          step.stepNumber
                        )}
                      </div>
                      <div className="flex-1 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-slate-100">
                          <span>{step.stepName}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {formatRelativeTime(step.timestamp)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {step.notes || step.action}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: COMMENTS & DISCUSSION */}
            {activeTab === 'comments' && (
              <div className="space-y-4 flex flex-col h-full">
                <div className="flex-1 overflow-y-auto space-y-3 max-h-[350px]">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No comments yet. Start the team collaboration discussion below.
                    </div>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c._id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {c.authorId?.name || 'Member'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatRelativeTime(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {c.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="pt-2 border-t border-purple-100 dark:border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || commentSubmitting}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                  >
                    Post
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review & Decision Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#160f2a] border border-purple-100 dark:border-purple-900/50 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Submit Review Decision
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Validate extracted fields and approve or reject document
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Decision
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewAction('approve')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      reviewAction === 'approve'
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                        : 'bg-purple-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-purple-100 dark:border-slate-800'
                    }`}
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction('request_changes')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      reviewAction === 'request_changes'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                        : 'bg-purple-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-purple-100 dark:border-slate-800'
                    }`}
                  >
                    Changes
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction('reject')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      reviewAction === 'reject'
                        ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                        : 'bg-purple-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-purple-100 dark:border-slate-800'
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Reviewer Notes
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add context or rationale for this approval decision..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-purple-50/40 dark:bg-slate-900 border border-purple-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingReview}
                  onClick={handleSubmitReviewDecision}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                >
                  Submit Decision
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
