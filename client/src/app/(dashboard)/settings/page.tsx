'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { formatBytes } from '../../../lib/utils';
import {
  Settings as SettingsIcon,
  User,
  Building2,
  Bot,
  HardDrive,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  Sliders,
  Sparkles,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, activeOrg, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'ai' | 'storage'>('profile');
  const [settingsData, setSettingsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile Form
  const [name, setName] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Org Form
  const [orgName, setOrgName] = useState('');
  const [reviewThreshold, setReviewThreshold] = useState(0.85);
  const [maxFileSize, setMaxFileSize] = useState(25);
  const [autoTriggerWorkflow, setAutoTriggerWorkflow] = useState(true);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res: any = await api.get('/settings');
        setSettingsData(res);
        setName(res.user?.name || '');
        setEmailNotifications(res.user?.settings?.emailNotifications ?? true);

        if (res.organization) {
          setOrgName(res.organization.name || '');
          setReviewThreshold(res.organization.settings?.requireReviewForConfidenceBelow ?? 0.85);
          setMaxFileSize(res.organization.settings?.maxFileSizeMb ?? 25);
          setAutoTriggerWorkflow(res.organization.settings?.autoTriggerWorkflow ?? true);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/settings/profile', {
        name,
        settings: { emailNotifications },
      });
      toast('Profile preferences updated', 'success');
      await refreshUser();
    } catch (err: any) {
      toast(err.message || 'Error updating profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/settings/organization', {
        name: orgName,
        requireReviewForConfidenceBelow: reviewThreshold,
        maxFileSizeMb: maxFileSize,
        autoTriggerWorkflow,
      });
      toast('Workspace configuration updated', 'success');
      await refreshUser();
    } catch (err: any) {
      toast(err.message || 'Error updating organization settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 animate-pulse glass-panel rounded-3xl">
        Loading system configuration...
      </div>
    );
  }

  const ai = settingsData?.aiProvider || {};
  const storage = settingsData?.storage || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-purple-600" /> Platform & Workspace Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure security, AI models, review thresholds, and workspace notifications
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Tabs */}
        <div className="md:col-span-1 p-3 rounded-3xl glass-panel space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-slate-100 hover:bg-purple-50 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" /> Personal Profile
          </button>

          <button
            onClick={() => setActiveTab('organization')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'organization'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-slate-100 hover:bg-purple-50 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" /> Workspace Rules
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'ai'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-slate-100 hover:bg-purple-50 dark:hover:bg-slate-800'
            }`}
          >
            <Bot className="w-4 h-4" /> AI Intelligence Provider
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'storage'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-slate-100 hover:bg-purple-50 dark:hover:bg-slate-800'
            }`}
          >
            <HardDrive className="w-4 h-4" /> Storage Quotas
          </button>
        </div>

        {/* Tab Content Panes */}
        <div className="md:col-span-3">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="p-6 rounded-3xl glass-panel space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Profile Settings</h3>
                <p className="text-xs text-slate-400">Manage your credentials and notifications</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-200/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Visual Theme
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        theme === 'light'
                          ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30'
                          : 'bg-purple-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-purple-100 dark:border-slate-800'
                      }`}
                    >
                      Light Theme (Clean White & Purple)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        theme === 'dark'
                          ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30'
                          : 'bg-purple-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-purple-100 dark:border-slate-800'
                      }`}
                    >
                      Dark Theme
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="emailNotif"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="emailNotif" className="text-xs text-slate-700 dark:text-slate-300">
                    Receive email digests on document processing and review assignments
                  </label>
                </div>

                <div className="pt-4 border-t border-purple-100 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-2 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: ORGANIZATION RULES */}
          {activeTab === 'organization' && (
            <div className="p-6 rounded-3xl glass-panel space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Workspace Intelligence Rules</h3>
                <p className="text-xs text-slate-400">
                  Configure automated verification gates and file constraints
                </p>
              </div>

              <form onSubmit={handleSaveOrg} className="space-y-5 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Review Gate Confidence Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Human Review Gate Threshold
                    </label>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      {Math.round(reviewThreshold * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.70"
                    max="0.98"
                    step="0.01"
                    value={reviewThreshold}
                    onChange={(e) => setReviewThreshold(parseFloat(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Documents with extraction confidence below {Math.round(reviewThreshold * 100)}% will automatically route to the verification queue.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Maximum Upload Size (MB)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={maxFileSize}
                    onChange={(e) => setMaxFileSize(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-purple-50/40 dark:bg-slate-900 border border-purple-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="autoWorkflow"
                    checked={autoTriggerWorkflow}
                    onChange={(e) => setAutoTriggerWorkflow(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="autoWorkflow" className="text-xs text-slate-700 dark:text-slate-300">
                    Automatically trigger default workflow pipeline on file upload
                  </label>
                </div>

                <div className="pt-4 border-t border-purple-100 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-2 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Workspace Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: AI INTELLIGENCE PROVIDER */}
          {activeTab === 'ai' && (
            <div className="p-6 rounded-3xl glass-panel space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-600" /> AI Document Analysis Engine
                </h3>
                <p className="text-xs text-slate-400">
                  Pluggable multi-provider architecture supporting Google Gemini, OpenAI, or zero-config demo mode
                </p>
              </div>

              {/* Status Box */}
              <div
                className={`p-4 rounded-2xl border ${
                  ai.isDemoMode
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4" />
                  Active Provider: {ai.currentProvider?.toUpperCase()}
                </div>
                <p className="text-xs leading-relaxed">
                  {ai.isDemoMode
                    ? 'The platform is currently operating in safe Development & Demo mode. Text parsing, entity extraction, and grounded Q&A are powered by the local regex/heuristic engine without requiring external API keys.'
                    : `Connected to live ${ai.currentProvider?.toUpperCase()} API models. Full multimodal inference and natural language chat are active.`}
                </p>
              </div>

              {/* Supported AI Capabilities */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Supported Engine Capabilities
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {[
                    'Multi-format Parsing (PDF, Word, Excel, CSV, Images)',
                    'Structured Key-Value Extraction with Confidence Scoring',
                    'Document Classification & Auto-Tagging',
                    'Executive Summarization & Key Bullet Highlighting',
                    'Interactive In-Document Q&A Chat with Source Citations',
                    'Human Review & Verification Workflow Loop',
                  ].map((cap, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 text-slate-800 dark:text-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STORAGE QUOTA */}
          {activeTab === 'storage' && (
            <div className="p-6 rounded-3xl glass-panel space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-cyan-500" /> Storage Architecture & Quotas
                </h3>
                <p className="text-xs text-slate-400">
                  Configurable storage abstraction supporting local filesystem and S3 cloud storage
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-slate-900/60 border border-purple-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Current Storage Allocation</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                    {formatBytes(storage.storageUsed || 0)} / {formatBytes(storage.storageLimit || 0)}
                  </span>
                </div>

                <div className="w-full h-3 rounded-full bg-purple-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-700 to-purple-400 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          2,
                          Math.round(((storage.storageUsed || 0) / (storage.storageLimit || 1)) * 100)
                        )
                      )}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Provider: {storage.provider?.toUpperCase()}</span>
                  <span>Max File: {storage.maxFileSizeMb} MB</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
