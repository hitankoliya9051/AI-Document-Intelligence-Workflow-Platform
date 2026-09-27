'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { OrgSwitcher } from './OrgSwitcher';
import { formatBytes } from '../../lib/utils';
import { api } from '../../lib/api';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  GitBranch,
  Search,
  BarChart3,
  Users,
  Settings,
  LogOut,
  HardDrive,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const pathname = usePathname();
  const { user, activeOrg, logout } = useAuth();
  const [reviewCount, setReviewCount] = useState<number>(0);

  useEffect(() => {
    const fetchQueueCount = async () => {
      try {
        const res: any = await api.get('/reviews/queue', { limit: 1 });
        if (res && res.pagination) {
          setReviewCount(res.pagination.total || 0);
        }
      } catch {
        // quiet error on initial boot
      }
    };
    fetchQueueCount();
  }, [pathname]);

  const navItems = [
    { label: 'Overview',      href: '/dashboard', icon: LayoutDashboard },
    { label: 'Documents',     href: '/documents', icon: FileText },
    {
      label: 'Review Queue',
      href: '/review',
      icon: CheckSquare,
      badge: reviewCount > 0 ? reviewCount : undefined,
      badgeColor: 'bg-amber-400/20 text-amber-200 border-amber-400/30',
    },
    { label: 'Workflows',     href: '/workflows', icon: GitBranch },
    { label: 'Global Search', href: '/search',    icon: Search },
    { label: 'Analytics',     href: '/analytics', icon: BarChart3 },
    { label: 'Team & Roles',  href: '/team',      icon: Users },
    { label: 'Settings',      href: '/settings',  icon: Settings },
  ];

  const storageUsed    = activeOrg?.storageUsed  || 0;
  const storageLimit   = activeOrg?.storageLimit || 5 * 1024 * 1024 * 1024;
  const storagePercent = Math.min(100, Math.round((storageUsed / storageLimit) * 100));

  return (
    <aside className="w-64 shrink-0 flex flex-col h-screen sidebar-gradient shadow-2xl shadow-purple-950/60">
      {/* ── Brand Header ── */}
      <div className="p-4 border-b border-purple-700/40 flex items-center gap-3">
        <a href="/dashboard" className="flex items-center gap-2.5">
          {/* Favicon as logo icon */}
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-lg shadow-purple-950/50 ring-2 ring-white/15">
            <Image
              src="/favicon.svg"
              alt="DocIntel"
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="font-black text-base tracking-tight text-white leading-none">
              DocIntel
            </span>
            <span className="text-[10px] font-bold block text-purple-300 tracking-widest uppercase mt-0.5">
              AI Platform
            </span>
          </div>
        </a>
      </div>

      {/* ── Org Switcher ── */}
      <div className="p-3 border-b border-purple-700/30">
        <OrgSwitcher />
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname?.startsWith(item.href));

          return (
            <a
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                  : 'text-purple-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-purple-200' : 'text-purple-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isActive
                      ? 'bg-white/20 text-white border-white/30'
                      : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {/* ── Storage Meter ── */}
      <div className="p-3.5 mx-3 mb-2 rounded-xl border border-purple-600/25" style={{ background: 'rgba(0,0,0,0.12)' }}>
        <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
          <span className="flex items-center gap-1.5 text-purple-300">
            <HardDrive className="w-3.5 h-3.5" /> Storage
          </span>
          <span className="text-white font-bold">{storagePercent}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-purple-900/50 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              storagePercent > 85
                ? 'bg-rose-400'
                : 'bg-gradient-to-r from-purple-300 to-white/80'
            }`}
            style={{ width: `${Math.max(2, storagePercent)}%` }}
          />
        </div>
        <div className="mt-1 text-[10px] text-purple-400">
          {formatBytes(storageUsed)} of {formatBytes(storageLimit)} used
        </div>
      </div>

      {/* ── User Footer ── */}
      <div className="p-3 border-t border-purple-700/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-purple-600/50 text-white border border-purple-400/30 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              (user?.name || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div className="truncate text-left">
            <div className="text-xs font-semibold text-white truncate">
              {user?.name || 'User'}
            </div>
            <div className="text-[10px] text-purple-400 truncate">{user?.email}</div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          className="p-1.5 rounded-lg text-purple-400 hover:text-rose-300 hover:bg-rose-500/15 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
