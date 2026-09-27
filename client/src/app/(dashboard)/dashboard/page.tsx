'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { formatBytes, formatRelativeTime, getStatusBadge } from '../../../lib/utils';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
  Upload,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Activity,
  Layers,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, activeOrg } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res: any = await api.get('/analytics');
        setData(res);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 dark:bg-slate-900 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-900 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const m = data?.metrics || {
    totalDocuments: 0,
    completedDocuments: 0,
    reviewRequiredDocuments: 0,
    failedDocuments: 0,
    processingDocuments: 0,
    storageUsed: 0,
    storageLimit: 5 * 1024 * 1024 * 1024,
    storagePercentage: 0,
    avgConfidenceScore: 0.9,
    totalReviews: 0,
    reviewApprovalRate: 100,
  };

  const recentUploads = data?.recentUploads || [];
  const recentActivity = data?.recentActivity || [];
  const typeDistribution = data?.documentTypeDistribution || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-200 dark:border-purple-800/60 bg-gradient-to-r from-purple-50 via-white to-purple-50/50 dark:from-purple-950/40 dark:via-[#130d24] dark:to-purple-950/30 p-6 md:p-8 backdrop-blur-xl shadow-sm shadow-purple-500/5">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Workspace Intelligence Live
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Welcome back, {user?.name?.split(' ')[0] || 'Member'}
            </h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Real-time document intelligence status across{' '}
              <span className="font-bold text-purple-700 dark:text-purple-300">{activeOrg?.name}</span>.
              All metrics below reflect live database state.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/documents"
              className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 shrink-0"
            >
              <Upload className="w-4 h-4" /> Upload Document
            </a>
            {m.reviewRequiredDocuments > 0 && (
              <a
                href="/review"
                className="py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all flex items-center gap-2 shrink-0"
              >
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Review Queue ({m.reviewRequiredDocuments})
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div className="p-5 rounded-2xl glass-panel relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Ingested</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {m.totalDocuments}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{m.completedDocuments} processed</span>
            <span>·</span>
            <span>{m.processingDocuments} in flight</span>
          </div>
        </div>

        {/* Requiring Review */}
        <div className="p-5 rounded-2xl glass-panel relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Review Queue</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {m.reviewRequiredDocuments}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            <a href="/review" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-0.5">
              Open verification queue <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* AI Confidence Score */}
        <div className="p-5 rounded-2xl glass-panel relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Avg AI Accuracy</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {Math.round(m.avgConfidenceScore * 100)}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Approval Rate: <span className="font-semibold text-emerald-500">{m.reviewApprovalRate}%</span>
          </div>
        </div>

        {/* Storage Usage */}
        <div className="p-5 rounded-2xl glass-panel relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Storage Used</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatBytes(m.storageUsed)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {m.storagePercentage}% of {formatBytes(m.storageLimit)} limit
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Documents & Activity / Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Uploads (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl glass-panel">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Recent Documents
                </h3>
                <p className="text-[11px] text-slate-400">
                  Latest files analyzed by the document pipeline
                </p>
              </div>
              <a
                href="/documents"
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                View all ({m.totalDocuments}) <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {recentUploads.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No documents uploaded yet. Click &quot;Upload Document&quot; to begin.
              </div>
            ) : (
              <div className="divide-y divide-purple-100 dark:divide-purple-900/30">
                {recentUploads.map((doc: any) => {
                  const status = getStatusBadge(doc.status);
                  return (
                    <div
                      key={doc._id}
                      className="py-3 flex items-center justify-between gap-3 group hover:bg-purple-50/50 dark:hover:bg-purple-950/20 p-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-purple-200 dark:border-purple-800">
                          {doc.fileExtension}
                        </div>
                        <div className="truncate">
                          <a
                            href={`/documents/${doc._id}`}
                            className="text-xs font-semibold text-slate-900 dark:text-slate-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors truncate block"
                          >
                            {doc.title}
                          </a>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{formatBytes(doc.fileSize)}</span>
                            <span>·</span>
                            <span>{doc.documentType.toUpperCase()}</span>
                            <span>·</span>
                            <span>{formatRelativeTime(doc.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1.5 ${status.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>

                        <a
                          href={`/documents/${doc._id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions / Document Types distribution */}
          <div className="p-6 rounded-3xl glass-panel">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Document Types Breakdown
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {typeDistribution.map((t: any) => (
                <div
                  key={t.type}
                  className="p-3.5 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40"
                >
                  <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider truncate">
                    {t.type.replace('_', ' ')}
                  </div>
                  <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                    {t.count} files
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Audit Activity Feed (1 col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl glass-panel">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Live Activity Feed
                </h3>
                <p className="text-[11px] text-slate-400">Team audit actions & processing logs</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No activity recorded yet.
                </div>
              ) : (
                recentActivity.map((act: any) => (
                  <div key={act._id} className="flex items-start gap-3 text-xs">
                    <div className="w-7 h-7 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-purple-200 dark:border-purple-800">
                      {act.userId?.name ? act.userId.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-800 dark:text-slate-200">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {act.userId?.name || 'User'}
                        </span>{' '}
                        <span className="text-slate-500 dark:text-slate-400">
                          {act.action.replace('_', ' ')}
                        </span>
                        {act.documentId?.title && (
                          <span className="text-purple-600 dark:text-purple-400 font-medium ml-1 truncate">
                            &quot;{act.documentId.title}&quot;
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {formatRelativeTime(act.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
