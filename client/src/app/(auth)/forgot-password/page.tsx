'use client';

import React, { useState } from 'react';
import { api } from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import { Sparkles, ArrowLeft, Mail, Loader2, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tokenResult, setTokenResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res: any = await api.post('/auth/forgot-password', { email });
      toast('Reset instructions generated', 'success');
      if (res?.demoResetToken) {
        setTokenResult(res.demoResetToken);
      }
    } catch (err: any) {
      toast(err.message || 'Error requesting reset', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-b from-purple-50/60 via-white to-purple-50/40 dark:from-[#0c0817] dark:via-[#110a22] dark:to-[#0c0817] text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-800 via-purple-600 to-purple-500 shadow-xl shadow-purple-600/30 mb-3 ring-2 ring-purple-100 dark:ring-purple-900">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Reset Password</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enter your work email to receive password recovery instructions
          </p>
        </div>

        <div className="rounded-3xl border border-purple-100 dark:border-purple-900/40 bg-white/95 dark:bg-[#160f2a]/95 backdrop-blur-2xl p-6 md:p-8 shadow-2xl shadow-purple-500/5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-purple-50/40 dark:bg-slate-900 border border-purple-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
            </button>
          </form>

          {tokenResult && (
            <div className="mt-5 p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs">
              <div className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 mb-1">
                <KeyRound className="w-4 h-4" /> Demo Mode Reset Token
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-[11px] mb-2 break-all font-mono bg-purple-50/60 dark:bg-slate-950 p-2 rounded-lg border border-purple-100 dark:border-slate-800">
                {tokenResult}
              </p>
              <a
                href={`/reset-password?token=${tokenResult}`}
                className="inline-block py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold"
              >
                Proceed to Reset Password →
              </a>
            </div>
          )}

          <div className="mt-6 text-center">
            <a
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
