'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { formatRelativeTime } from '../../lib/utils';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  Sparkles,
  Bot,
  Check,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [aiStatus, setAiStatus] = useState<{ provider: string; isDemoMode: boolean } | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        const [statusRes, notifRes]: any = await Promise.all([
          api.get('/settings/ai-status'),
          api.get('/notifications', { limit: 5 }),
        ]);

        setAiStatus(statusRes);
        setUnreadNotifications(notifRes.notifications || []);
        setUnreadCount(notifRes.unreadCount || 0);
      } catch {
        // silent fail
      }
    };

    fetchHeaderData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/search');
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setUnreadCount(0);
      setUnreadNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // quiet
    }
  };

  return (
    <header className="h-16 px-4 md:px-6 border-b border-purple-100 dark:border-purple-900/40 bg-white/80 dark:bg-[#0c0817]/80 backdrop-blur-xl flex items-center justify-between z-30">
      {/* Mobile menu trigger */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-slate-500 hover:text-purple-700 dark:hover:text-slate-100 hover:bg-purple-50 dark:hover:bg-slate-900"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Global Quick Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md hidden sm:block">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Global search across titles, OCR text, tags, and extracted fields..."
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
        />
      </form>

      {/* Right Action Icons */}
      <div className="flex items-center gap-3">
        {/* AI Status Badge */}
        <div
          title={
            aiStatus?.isDemoMode
              ? 'AI Engine running in offline demo mode. Output is rule-based and transparently tagged.'
              : `Connected to live ${aiStatus?.provider?.toUpperCase()} AI model.`
          }
          className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-colors ${
            aiStatus?.isDemoMode
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
              : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>
            {aiStatus?.isDemoMode
              ? 'Demo Engine (Offline)'
              : `${(aiStatus?.provider || 'AI').toUpperCase()} Live`}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              aiStatus?.isDemoMode ? 'bg-amber-400' : 'bg-purple-600 dark:bg-purple-400 animate-pulse'
            }`}
          />
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:text-purple-700 dark:hover:text-slate-100 hover:bg-purple-50 dark:hover:bg-slate-900 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl glass-dropdown p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-purple-100 dark:border-purple-900/40">
                <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                  Notifications ({unreadCount} unread)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="py-2 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
                {unreadNotifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  unreadNotifications.map((n) => (
                    <a
                      key={n._id}
                      href={n.link || '/notifications'}
                      onClick={() => setShowNotifications(false)}
                      className={`block p-2.5 rounded-xl hover:bg-purple-50/60 dark:hover:bg-slate-800/60 transition-colors ${
                        !n.isRead ? 'bg-purple-500/10' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0">
                          {n.type === 'document_approved' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : n.type === 'review_required' ? (
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          )}
                        </div>
                        <div className="flex-1 text-xs">
                          <div className="font-medium text-slate-900 dark:text-slate-100 mb-0.5">
                            {n.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                            {n.message}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {formatRelativeTime(n.createdAt)}
                          </div>
                        </div>
                      </div>
                    </a>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-purple-100 dark:border-purple-900/40 text-center">
                <a
                  href="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                >
                  View all notifications →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
