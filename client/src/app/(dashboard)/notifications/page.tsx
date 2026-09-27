'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import { formatRelativeTime } from '../../../lib/utils';
import { INotification } from '../../../types';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Users,
  Check,
  ExternalLink,
} from 'lucide-react';

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/notifications', { limit: 50 });
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err: any) {
      toast(err.message || 'Error loading notifications', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // quiet
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast('All notifications marked as read', 'success');
    } catch {
      toast('Failed to mark all as read', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-purple-600" /> Notifications & Activity Alerts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Stay updated with pipeline status, reviews requiring signoff, and team comments
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="py-2 px-3.5 rounded-xl border border-purple-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="rounded-3xl glass-panel overflow-hidden border border-purple-100 dark:border-slate-800">
        {loading ? (
          <div className="p-12 text-center text-xs text-purple-600 animate-pulse">
            Loading notification feed...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center">
            <Bell className="w-12 h-12 text-purple-300 dark:text-purple-800 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              No Notifications
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You are completely caught up! New document processing and review alerts will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-purple-50 dark:divide-slate-800/60">
            {notifications.map((n) => {
              const isApproved = n.type === 'document_approved';
              const isReview = n.type === 'review_required';
              const isComment = n.type === 'comment_added';

              return (
                <div
                  key={n._id}
                  className={`p-4 sm:p-5 flex items-start gap-4 transition-colors hover:bg-purple-50/50 dark:hover:bg-slate-800/40 ${
                    !n.isRead ? 'bg-purple-500/10' : ''
                  }`}
                >
                  <div className="mt-1 shrink-0">
                    {isApproved ? (
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : isReview ? (
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    ) : isComment ? (
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {n.message}
                    </p>

                    <div className="flex items-center gap-3 mt-3">
                      {n.link && (
                        <a
                          href={n.link}
                          onClick={() => handleMarkAsRead(n._id)}
                          className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                        >
                          View Document <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(n._id)}
                          className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-slate-200"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
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
