'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';

export const OrgSwitcher: React.FC = () => {
  const { activeOrg, organizations, switchOrganization } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {activeOrg?.name || 'Workspace'}
            </div>
            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wider">
              {activeOrg?.currentUserRole || 'Member'} Plan
            </div>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-purple-100 dark:border-purple-900/40 bg-white dark:bg-[#130d24] shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1.5 text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
            Switch Workspace
          </div>
          <div className="space-y-1">
            {organizations.map((org) => {
              const isSelected = org.id === activeOrg?._id;
              return (
                <button
                  key={org.id}
                  onClick={() => {
                    switchOrganization(org.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-purple-50/50 dark:hover:bg-purple-950/20'
                  }`}
                >
                  <span className="truncate">{org.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
