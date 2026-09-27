'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { ArrowRight, Shield, CheckCircle2, Loader2, KeyRound } from 'lucide-react';

const DEMO_ROLES = [
  {
    name: 'Alexandra',
    role: 'Owner / Admin',
    email: 'admin@docintel.io',
    color: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700',
  },
  {
    name: 'Marcus',
    role: 'Reviewer',
    email: 'reviewer@docintel.io',
    color: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
  },
  {
    name: 'Sarah',
    role: 'Member',
    email: 'member@docintel.io',
    color: 'text-slate-600 dark:text-slate-400',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
  },
  {
    name: 'David',
    role: 'Auditor',
    email: 'auditor@docintel.io',
    color: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || loadingRole) return;
    setErrorMsg('');
    setSubmitting(true);
    try {
      await login(email, password);
      toast('Welcome back!', 'success');
    } catch (err: any) {
      const msg = err?.message || 'Failed to authenticate. Please check your credentials.';
      setErrorMsg(msg);
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (roleEmail: string) => {
    if (submitting || loadingRole) return;
    setLoadingRole(roleEmail);
    setErrorMsg('');
    try {
      await login(roleEmail, 'Password123!');
      toast(`✓ Signed in as ${roleEmail.split('@')[0]}`, 'success');
    } catch (err: any) {
      const msg = err?.message || 'Demo login failed. Please try again.';
      setErrorMsg(msg);
      toast(msg, 'error');
    } finally {
      setLoadingRole(null);
    }
  };

  const isAnyLoading = submitting || !!loadingRole;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-b from-purple-50/60 via-white to-purple-50/40 dark:from-[#0c0817] dark:via-[#110a22] dark:to-[#0c0817] text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Brand Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl overflow-hidden shadow-xl shadow-purple-600/30 mb-3 ring-2 ring-purple-200 dark:ring-purple-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.svg" alt="DocIntel" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            DocIntel Platform
          </h1>
          <p className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1">
            Enterprise AI Document Intelligence &amp; Workflow System
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-purple-200/90 dark:border-purple-800/60 bg-white dark:bg-[#130d24] backdrop-blur-2xl p-6 md:p-8 shadow-2xl shadow-purple-900/10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Sign in to your account</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Enter your credentials or use a one-click portfolio demo role below.
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                disabled={isAnyLoading}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-purple-50/30 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-60"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
                <a
                  href="/forgot-password"
                  className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold hover:underline transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isAnyLoading}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-purple-50/30 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={isAnyLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* ── One-Click Demo Roles ── */}
          <div className="mt-6 pt-5 border-t border-purple-100 dark:border-purple-900/40">
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-purple-600" />
              One-Click Recruiter / Demo Roles
              <span className="ml-auto text-[10px] font-mono text-slate-400 normal-case tracking-normal">
                pw: Password123!
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ROLES.map((demo) => {
                const isThisLoading = loadingRole === demo.email;
                return (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => handleDemoLogin(demo.email)}
                    disabled={isAnyLoading}
                    className={`p-2.5 rounded-xl text-left transition-all border ${
                      isThisLoading
                        ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-400 dark:border-purple-600 scale-[0.98]'
                        : 'bg-purple-50/70 hover:bg-purple-100/90 dark:bg-[#191130] dark:hover:bg-[#20163d] border-purple-200/80 dark:border-purple-800/50 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md hover:shadow-purple-500/10'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {demo.name}
                      </div>
                      {isThisLoading && (
                        <Loader2 className="w-3 h-3 animate-spin text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border inline-block ${demo.badge}`}>
                      {demo.role}
                    </div>
                    <div className={`text-[10px] font-mono mt-1 ${demo.color}`}>
                      {demo.email}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Security note */}
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400">
              <Shield className="w-3 h-3 text-purple-400 shrink-0" />
              <span>Demo accounts are read for portfolio review only. Organization data is isolated per tenant.</span>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Don&apos;t have an account yet?{' '}
          <a href="/register" className="font-bold text-purple-600 dark:text-purple-400 hover:underline">
            Create an organization
          </a>
        </p>

        {/* Verified accounts list */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            All demo accounts verified and active
          </div>
        </div>
      </div>
    </div>
  );
}
