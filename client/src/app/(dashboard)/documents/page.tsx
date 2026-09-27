'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import { formatBytes, formatRelativeTime, getStatusBadge, getConfidenceBadge } from '../../../lib/utils';
import { IDocument, IFolder, ITag } from '../../../types';
import { FileUploader } from '../../../components/documents/FileUploader';
import {
  FileText,
  Upload,
  FolderPlus,
  Folder as FolderIcon,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Download,
  Trash2,
  Archive,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Tag as TagIcon,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export default function DocumentsPage() {
  const { toast } = useToast();

  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [folders, setFolders] = useState<IFolder[]>([]);
  const [tags, setTags] = useState<ITag[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameDocId, setRenameDocId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const fetchFoldersAndTags = useCallback(async () => {
    try {
      const [folderRes, tagRes]: any = await Promise.all([
        api.get('/folders'),
        api.get('/tags'),
      ]);
      setFolders(folderRes.folders || []);
      setTags(tagRes || []);
    } catch {
      // quiet
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: 50,
        isArchived: showArchived ? 'true' : 'false',
      };
      if (selectedFolder) params.folderId = selectedFolder;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.documentType = typeFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res: any = await api.get('/documents', params);
      setDocuments(res || []);
    } catch (err: any) {
      toast(err.message || 'Error loading documents', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedFolder, statusFilter, typeFilter, searchQuery, showArchived, toast]);

  useEffect(() => {
    fetchFoldersAndTags();
  }, [fetchFoldersAndTags]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await api.post('/folders', { name: newFolderName.trim() });
      toast('Folder created successfully', 'success');
      setNewFolderName('');
      setShowCreateFolderModal(false);
      fetchFoldersAndTags();
    } catch (err: any) {
      toast(err.message || 'Failed to create folder', 'error');
    }
  };

  const handleRename = async (id: string) => {
    if (!newTitle.trim()) return;
    try {
      await api.patch(`/documents/${id}`, { title: newTitle.trim() });
      toast('Document renamed', 'success');
      setRenameDocId(null);
      fetchDocuments();
    } catch (err: any) {
      toast(err.message || 'Rename failed', 'error');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/documents/${id}`);
      toast('Document deleted', 'success');
      fetchDocuments();
      fetchFoldersAndTags();
    } catch (err: any) {
      toast(err.message || 'Delete failed', 'error');
    }
  };

  const handleArchiveToggle = async (id: string, isArchived: boolean) => {
    try {
      if (isArchived) {
        await api.post(`/documents/${id}/restore`);
        toast('Document restored from archive', 'success');
      } else {
        await api.post(`/documents/${id}/archive`);
        toast('Document archived', 'success');
      }
      fetchDocuments();
    } catch (err: any) {
      toast(err.message || 'Archive action failed', 'error');
    }
  };

  const handleReprocess = async (id: string) => {
    try {
      await api.post(`/documents/${id}/process`);
      toast('AI Document processing re-triggered in background', 'info');
      setTimeout(fetchDocuments, 2000);
    } catch (err: any) {
      toast(err.message || 'Reprocess failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-purple-600" /> Document Repository
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage, review, organize into folders, and run AI extractions on your files
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="py-2 px-3 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" /> New Folder
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Upload Files
          </button>
        </div>
      </div>

      {/* Main Workspace Layout (Folder Tree + Document List) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Column: Folders Sidebar */}
        <div className="md:col-span-1 p-4 rounded-3xl glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Folders
            </span>
            <button
              onClick={() => setShowCreateFolderModal(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setSelectedFolder('')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                selectedFolder === ''
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <FolderIcon className="w-4 h-4 text-purple-400" /> All Documents
              </span>
            </button>

            {folders.map((folder) => {
              const isSelected = selectedFolder === folder._id;
              return (
                <button
                  key={folder._id}
                  onClick={() => setSelectedFolder(folder._id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <FolderIcon className="w-4 h-4 text-purple-400" /> {folder.name}
                  </span>
                  <span className="text-[10px] opacity-70">
                    {folder.documentCount !== undefined ? folder.documentCount : ''}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tags Filter section */}
          {tags.length > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t._id}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    #{t.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Search, Filters, and Table / Grid */}
        <div className="md:col-span-3 space-y-4">
          {/* Filter Bar */}
          <div className="p-3 rounded-2xl glass-panel flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search */}
              <div className="relative min-w-[200px] flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter documents..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="review_required">Review Required</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Document Types</option>
                <option value="invoice">Invoices</option>
                <option value="contract">Contracts</option>
                <option value="financial_report">Financial Reports</option>
                <option value="receipt">Receipts</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {/* Archive Toggle */}
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  showArchived
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:text-slate-300'
                }`}
              >
                <Archive className="w-3.5 h-3.5 inline mr-1" />
                {showArchived ? 'Viewing Archived' : 'Archived'}
              </button>

              {/* View Toggle */}
              <div className="flex items-center p-0.5 rounded-xl border border-purple-100 dark:border-slate-800 bg-purple-50/60 dark:bg-slate-900">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-800 text-purple-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-800 text-purple-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Documents Content */}
          {loading ? (
            <div className="p-12 text-center text-xs text-purple-600 animate-pulse glass-panel rounded-3xl">
              Loading document catalog...
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center glass-panel rounded-3xl">
              <FileText className="w-12 h-12 text-purple-300 dark:text-purple-800 mx-auto mb-3 opacity-60" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                No documents found
              </h3>
              <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                No documents matched your filters or search criteria. Upload your first document to initiate automated intelligence analysis.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Upload Document
              </button>
            </div>
          ) : viewMode === 'table' ? (
            /* Table View */
            <div className="rounded-3xl glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Document Title</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">AI Score</th>
                      <th className="py-3.5 px-4">Size</th>
                      <th className="py-3.5 px-4">Uploaded</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                    {documents.map((doc) => {
                      const status = getStatusBadge(doc.status);
                      const conf = getConfidenceBadge(doc.confidenceScore);
                      return (
                        <tr
                          key={doc._id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[10px] uppercase flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
                                {doc.fileExtension}
                              </span>
                              <div className="truncate max-w-xs">
                                {renameDocId === doc._id ? (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={newTitle}
                                      onChange={(e) => setNewTitle(e.target.value)}
                                      className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-purple-500 text-slate-900 dark:text-white"
                                    />
                                    <button
                                      onClick={() => handleRename(doc._id)}
                                      className="px-2 py-1 bg-purple-600 rounded text-[10px] text-white"
                                    >
                                      Save
                                    </button>
                                  </div>
                                ) : (
                                  <a
                                    href={`/documents/${doc._id}`}
                                    className="font-semibold text-slate-900 dark:text-slate-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors block truncate"
                                  >
                                    {doc.title}
                                  </a>
                                )}
                                <div className="text-[10px] text-slate-400 truncate">
                                  {doc.originalName}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${status.bg}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="uppercase text-[11px] font-medium text-slate-600 dark:text-slate-300">
                              {doc.documentType.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${conf.color}`}
                            >
                              {conf.text}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                            {formatBytes(doc.fileSize)}
                          </td>

                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                            {formatRelativeTime(doc.createdAt)}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                              <a
                                href={`/documents/${doc._id}`}
                                title="Open split viewer"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                              <a
                                href={`/api/documents/${doc._id}/download`}
                                title="Download original file"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleReprocess(doc._id)}
                                title="Re-run AI extraction"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleArchiveToggle(doc._id, doc.isArchived)}
                                title={doc.isArchived ? 'Restore' : 'Archive'}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(doc._id, doc.title)}
                                title="Delete document"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => {
                const status = getStatusBadge(doc.status);
                const conf = getConfidenceBadge(doc.confidenceScore);
                return (
                  <div
                    key={doc._id}
                    className="p-5 rounded-3xl glass-panel hover:border-purple-300 dark:hover:border-purple-600/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs uppercase flex items-center justify-center border border-purple-200 dark:border-purple-800">
                          {doc.fileExtension}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1.5 ${status.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>

                      <a
                        href={`/documents/${doc._id}`}
                        className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors line-clamp-1 block mb-1"
                      >
                        {doc.title}
                      </a>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                        {doc.summary || doc.description || doc.originalName}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${conf.color}`}>
                        {conf.text}
                      </span>
                      <div className="flex items-center gap-1">
                        <a
                          href={`/api/documents/${doc._id}/download`}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`/documents/${doc._id}`}
                          className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <FileUploader
          folders={folders}
          currentFolderId={selectedFolder}
          onUploadSuccess={() => {
            fetchDocuments();
            fetchFoldersAndTags();
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#160f2a] border border-purple-100 dark:border-purple-900/50 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Create New Folder
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Organize your document pipeline</p>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Folder Name
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Legal Contracts"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-purple-50/40 dark:bg-slate-900 border border-purple-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateFolderModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/30"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
