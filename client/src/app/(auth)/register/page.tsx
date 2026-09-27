'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await register(name, email, password, orgName);
      toast('Workspace registered successfully!', 'success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register account');
      toast(err.message || 'Registration failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-b from-purple-50/60 via-white to-purple-50/40 dark:from-[#0c0817] dark:via-[#110a22] dark:to-[#0c0817] text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-800 via-purple-600 to-purple-500 shadow-xl shadow-purple-600/30 mb-3 ring-2 ring-purple-100 dark:ring-purple-900">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Create Your Workspace
          </h1>
          <p className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1">
            Deploy your enterprise AI document intelligence pipeline in minutes
          </p>
        </div>

        <div className="rounded-3xl border border-purple-200/90 dark:border-purple-800/60 bg-white dark:bg-[#130d24] backdrop-blur-2xl p-6 md:p-8 shadow-2xl shadow-purple-900/10">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jordan Rivera"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-purple-50/30 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jordan@enterprisecorp.io"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-purple-50/30 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-purple-50/30 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Organization / Company Name
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Global Corporation"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-purple-50/30 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Provisioning Organization...
                </>
              ) : (
                <>
                  Create Organization <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Already registered?{' '}
          <a href="/login" className="font-bold text-purple-600 dark:text-purple-400 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
