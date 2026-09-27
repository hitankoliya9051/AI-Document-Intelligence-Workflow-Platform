'use client';

import React from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Sparkles, 
  Workflow, 
  Search, 
  CheckCircle2, 
  BarChart3, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  Cpu, 
  Zap, 
  Eye, 
  Layers, 
  Bot, 
  FileCheck, 
  Lock, 
  Database,
  ArrowUpRight,
  Terminal,
  ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0c0817] text-slate-900 dark:text-slate-100 selection:bg-purple-600 selection:text-white transition-colors">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-50 via-purple-100/60 to-purple-50 dark:from-purple-950/40 dark:via-purple-900/30 dark:to-purple-950/40 border-b border-purple-200/80 dark:border-purple-800/40 py-2.5 px-4 text-center text-xs sm:text-sm text-purple-900 dark:text-purple-200">
        <span className="font-semibold text-purple-700 dark:text-purple-300 mr-2">🚀 Developer Portfolio Edition:</span>
        Fully functional full-stack platform with parsing, AI extraction, workflow state machines, and human review queues.
        <Link href="/login" className="inline-flex items-center ml-2 font-semibold text-purple-700 dark:text-purple-300 underline underline-offset-4 hover:text-purple-900 dark:hover:text-white">
          Try Live Demo <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/85 dark:bg-[#0c0817]/85 border-b border-purple-100 dark:border-purple-900/40 px-6 py-4 shadow-sm shadow-purple-500/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-purple-600/30 ring-2 ring-purple-100 dark:ring-purple-900/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/favicon.svg" alt="DocIntel" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-900 via-purple-700 to-purple-600 dark:from-white dark:via-purple-200 dark:to-purple-400 tracking-tight">
                DocIntel AI
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] tracking-wider uppercase px-2 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-full font-mono font-bold">
                v1.0 Production
              </span>
            </div>
          </div>


          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-purple-700 dark:hover:text-purple-300 transition-colors">Features</a>
            <a href="#pipeline" className="hover:text-purple-700 dark:hover:text-purple-300 transition-colors">Pipeline</a>
            <a href="#tech" className="hover:text-purple-700 dark:hover:text-purple-300 transition-colors">Tech Stack</a>
            <a href="#security" className="hover:text-purple-700 dark:hover:text-purple-300 transition-colors">Security</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-purple-700 dark:hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30 transition-all active:scale-[0.98] flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 overflow-hidden bg-gradient-to-b from-purple-50/40 via-white to-purple-50/30 dark:from-[#110a22]/50 dark:via-[#0c0817] dark:to-[#110a22]/50">
        {/* Glow Background Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-purple-500/10 dark:bg-purple-600/15 blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/3 w-[450px] h-[350px] bg-purple-600/10 dark:bg-purple-800/15 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#160f2a] border border-purple-200 dark:border-purple-800/60 text-xs font-semibold text-purple-700 dark:text-purple-300 mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
            Zero Static Mocks &bull; Real Multi-Format Document Ingestion Engine
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.12]">
            AI Document Intelligence &amp; <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-800 via-purple-600 to-purple-500 dark:from-purple-300 dark:via-purple-200 dark:to-purple-400">
              Autonomous Workflow Platform
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-10 leading-relaxed font-normal">
            Ingest PDFs, Word documents, Excel workbooks, and CSV records. Automatically parse text, extract structured business entities, orchestrate multi-tier human review approvals, and query docs with grounded AI citations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-base shadow-xl shadow-purple-600/30 hover:shadow-purple-600/40 transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Platform Live</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white dark:bg-[#160f2a] hover:bg-purple-50 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800 font-bold text-base shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>Instant 1-Click Demo Login</span>
              <ArrowUpRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </Link>
          </div>

          {/* Metrics bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-purple-100 dark:border-purple-900/40">
            <div className="p-4 rounded-xl bg-white dark:bg-[#130d24] border border-purple-100 dark:border-purple-900/40 shadow-sm shadow-purple-500/5">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">6+ Formats</div>
              <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1">PDF, DOCX, XLSX, CSV, TXT, IMG</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#130d24] border border-purple-100 dark:border-purple-900/40 shadow-sm shadow-purple-500/5">
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400">12+ Fields</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Auto-Extracted Entities</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#130d24] border border-purple-100 dark:border-purple-900/40 shadow-sm shadow-purple-500/5">
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-700 dark:text-purple-300">4 Roles</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">RBAC &amp; Tenant Isolation</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#130d24] border border-purple-100 dark:border-purple-900/40 shadow-sm shadow-purple-500/5">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">100% Real</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Full-Stack Database Backed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Platform Preview Mockup */}
      <section className="px-6 pb-28">
        <div className="max-w-6xl mx-auto rounded-3xl border border-purple-200 dark:border-purple-800/60 bg-white dark:bg-[#130d24] shadow-2xl shadow-purple-900/10 overflow-hidden backdrop-blur-xl">
          <div className="px-6 py-4 border-b border-purple-100 dark:border-purple-900/40 flex items-center justify-between bg-purple-50/60 dark:bg-[#170f2c]/60">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="ml-3 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                DocIntel Studio &mdash; Invoice_AcmeCorp_2026.pdf [Split View &amp; Extraction]
              </span>
            </div>
            <div className="text-xs px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-mono font-semibold border border-purple-200 dark:border-purple-800">
              Confidence: 96%
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
            {/* Left: Document Raw Content Preview */}
            <div className="lg:col-span-6 p-6 border-b lg:border-b-0 lg:border-r border-purple-100 dark:border-purple-900/40 bg-purple-50/30 dark:bg-[#0e091b] font-mono text-xs text-slate-800 dark:text-slate-300 leading-relaxed overflow-hidden">
              <div className="text-slate-500 mb-3 flex items-center justify-between pb-2 border-b border-purple-100 dark:border-purple-900/40">
                <span className="font-semibold text-purple-900 dark:text-purple-300">RAW EXTRACTED TEXT STREAM</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-bold">PARSED VIA PDF-PARSE</span>
              </div>
              <div className="space-y-2 text-slate-700 dark:text-slate-300">
                <p className="text-purple-700 dark:text-purple-300 font-bold text-sm">ACME CORPORATION &bull; INVOICE #INV-2026-0891</p>
                <p className="text-slate-500 dark:text-slate-400">Date: September 20, 2026 | Due: October 20, 2026</p>
                <p className="text-slate-500 dark:text-slate-400">Billed to: Global Tech Logistics Inc, 450 Enterprise Way, Suite 800</p>
                <div className="mt-4 p-3 rounded-xl bg-white dark:bg-[#160f2a] border border-purple-100 dark:border-purple-900/50 space-y-1 shadow-sm">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Enterprise Document AI API Cluster (Q3)</span>
                    <span className="font-semibold text-slate-900 dark:text-white">$14,500.00</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Workflow Automation Engine Orchestration</span>
                    <span className="font-semibold text-slate-900 dark:text-white">$4,250.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-purple-700 dark:text-purple-300 pt-2 border-t border-purple-100 dark:border-purple-900/50">
                    <span>Total Amount Payable</span>
                    <span className="text-emerald-600 dark:text-emerald-400">$18,750.00 USD</span>
                  </div>
                </div>
                <p className="text-slate-500 text-[11px] pt-3">
                  Bank Reference: ACH-774920412 &bull; Authorized by Sarah Jenkins (CFO)
                </p>
              </div>
            </div>

            {/* Right: AI Structured Fields & Workflow Status */}
            <div className="lg:col-span-6 p-6 space-y-6 bg-white dark:bg-[#130d24]">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Structured Entity Recognition
                  </h3>
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Gemini 1.5 Flash / Demo Engine</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-[#160f2a] border border-purple-100 dark:border-purple-900/50">
                    <span className="text-purple-600 dark:text-purple-400 block text-[10px] uppercase font-bold tracking-wider">Vendor Company</span>
                    <span className="text-slate-900 dark:text-white font-semibold">Acme Corporation</span>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-[#160f2a] border border-purple-100 dark:border-purple-900/50">
                    <span className="text-purple-600 dark:text-purple-400 block text-[10px] uppercase font-bold tracking-wider">Invoice Number</span>
                    <span className="text-purple-700 dark:text-purple-300 font-mono font-semibold">INV-2026-0891</span>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-[#160f2a] border border-purple-100 dark:border-purple-900/50">
                    <span className="text-purple-600 dark:text-purple-400 block text-[10px] uppercase font-bold tracking-wider">Grand Total</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">$18,750.00 USD</span>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-[#160f2a] border border-purple-100 dark:border-purple-900/50">
                    <span className="text-purple-600 dark:text-purple-400 block text-[10px] uppercase font-bold tracking-wider">Signatory Entity</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">Sarah Jenkins</span>
                  </div>
                </div>
              </div>

              {/* Workflow Stepper */}
              <div>
                <h4 className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-2 tracking-wider">Automated Workflow State</h4>
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
                    ✓ Ingested
                  </span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
                    ✓ AI Extracted
                  </span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 font-bold animate-pulse">
                    Review Required
                  </span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                    Approved
                  </span>
                </div>
              </div>

              {/* Document Chat Mini Teaser */}
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-[#191130] border border-purple-200/80 dark:border-purple-800/60 text-xs">
                <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-bold mb-1.5">
                  <Bot className="w-4 h-4 text-purple-600" />
                  Q&amp;A Chat with Grounded Citations
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="text-slate-500 dark:text-slate-400">&ldquo;What is the payment due date and bank ref?&rdquo;</span>
                  <br />
                  &rarr; The payment is due on <strong className="text-purple-900 dark:text-white font-bold">October 20, 2026</strong> via reference <strong className="text-purple-700 dark:text-purple-300 font-mono font-bold">ACH-774920412</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 px-6 border-t border-purple-100 dark:border-purple-900/30 bg-purple-50/20 dark:bg-[#0f0a1c]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-wider text-purple-600 dark:text-purple-400 font-mono font-bold mb-3">
              Core Capabilities
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              Everything Needed for Production Document Intelligence
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-base">
              Built from scratch with zero corner-cutting. Every endpoint, database relationship, and user interaction is functional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-7 rounded-2xl bg-white dark:bg-[#130d24] border border-purple-100 dark:border-purple-900/40 hover:border-purple-400 dark:hover:border-purple-600 transition-all hover:shadow-xl hover:shadow-purple-500/10 group">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Multi-Format Parsing</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Native parsing for PDF documents, Word .docx, Excel .xlsx spreadsheets, CSV datasets, plain text, and image files without external SaaS lock-in.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-2xl bg-white dark:bg-[#130d24] border border-purple-100 dark:border-purple-900/40 hover:border-purple-400 dark:hover:border-purple-600 transition-all hover:shadow-xl hover:shadow-purple-500/10 group">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Automated AI Extraction</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Extracts key entities including invoices, parties, monetary amounts, addresses, dates, and classifications with confidence scores and confidence thresholds.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-2xl bg-white dark:bg-[#130d24] border border-purple-100 dark:border-purple-900/40 hover:border-purple-400 dark:hover:border-purple-600 transition-all hover:shadow-xl hover:shadow-purple-500/10 group">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                <Workflow className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Configurable Workflows</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Define multi-step pipelines with automated state transitions, confidence-based auto-approval rules, and deterministic human-in-the-loop escalation.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-7 rounded-2xl bg-white dark:bg-[#130d24] border border-purple-100 dark:border-purple-900/40 hover:border-purple-400 dark:hover:border-purple-600 transition-all hover:shadow-xl hover:shadow-purple-500/10 group">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Human Review Queue</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Dedicated review dashboard where assigned reviewers can inspect split documents, perform inline edits on extracted fields, and approve or reject with comments.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-7 rounded-2xl bg-white dark:bg-[#130d24] border border-purple-100 dark:border-purple-900/40 hover:border-purple-400 dark:hover:border-purple-600 transition-all hover:shadow-xl hover:shadow-purple-500/10 group">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Full-Text Global Search</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                MongoDB query engine allows searching across raw text, extracted metadata, tags, vendor names, and entity values with status, type, and date filters.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-7 rounded-2xl bg-white dark:bg-[#130d24] border border-purple-100 dark:border-purple-900/40 hover:border-purple-400 dark:hover:border-purple-600 transition-all hover:shadow-xl hover:shadow-purple-500/10 group">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Document Q&amp;A with Citations</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Ask targeted questions against any document. The AI retrieves grounded text spans and generates exact answers with cited source snippets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* End-to-End Processing Pipeline */}
      <section id="pipeline" className="py-24 px-6 border-t border-purple-100 dark:border-purple-900/30 bg-white dark:bg-[#0c0817]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-wider text-purple-600 dark:text-purple-400 font-mono font-bold mb-3">
              The Architecture Pipeline
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              From Raw Ingestion to Verified Knowledge
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-base">
              Structured async processing designed for high resilience and auditability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#130d24] border border-purple-100 dark:border-purple-900/40 shadow-sm shadow-purple-500/5 relative">
              <div className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 mb-2">STAGE 01</div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Ingest &amp; Hash</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Multer memory streaming, file type validation, SHA-256 deduplication, and isolated organization folder assignment.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#130d24] border border-purple-100 dark:border-purple-900/40 shadow-sm shadow-purple-500/5 relative">
              <div className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 mb-2">STAGE 02</div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Parse &amp; Extract</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Parser service converts binary streams to structured text. AI model generates summary, tags, and field entity dictionary.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#130d24] border border-purple-100 dark:border-purple-900/40 shadow-sm shadow-purple-500/5 relative">
              <div className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 mb-2">STAGE 03</div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Workflow Evaluation</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Workflow engine matches rules. If confidence is below threshold, routes automatically to the Review Queue.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#130d24] border border-purple-100 dark:border-purple-900/40 shadow-sm shadow-purple-500/5 relative">
              <div className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 mb-2">STAGE 04</div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Audit &amp; Index</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Activity log recorded, notifications dispatched, and document text indexed for instant sub-second global search.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Highlights */}
      <section id="tech" className="py-24 px-6 border-t border-purple-100 dark:border-purple-900/30 bg-purple-50/20 dark:bg-[#0f0a1c]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-wider text-purple-600 dark:text-purple-400 font-mono font-bold mb-3">
              Modern Enterprise Stack
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              Built with Modern Standards &amp; Clean Architecture
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-5 rounded-xl bg-white dark:bg-[#130d24] border border-purple-100 dark:border-purple-900/40 text-center shadow-sm">
              <div className="font-bold text-slate-900 dark:text-white text-base">Next.js 14</div>
              <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1">App Router &amp; SSR</div>
            </div>
            <div className="p-5 rounded-xl bg-white dark:bg-[#130d24] border border-purple-100 dark:border-purple-900/40 text-center shadow-sm">
              <div className="font-bold text-slate-900 dark:text-white text-base">React 18</div>
              <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1">TypeScript 5</div>
            </div>
            <div className="p-5 rounded-xl bg-white dark:bg-[#130d24] border border-purple-100 dark:border-purple-900/40 text-center shadow-sm">
              <div className="font-bold text-slate-900 dark:text-white text-base">Express.js</div>
              <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1">REST API Layer</div>
            </div>
            <div className="p-5 rounded-xl bg-white dark:bg-[#130d24] border border-purple-100 dark:border-purple-900/40 text-center shadow-sm">
              <div className="font-bold text-slate-900 dark:text-white text-base">MongoDB</div>
              <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1">Mongoose ODM</div>
            </div>
            <div className="p-5 rounded-xl bg-white dark:bg-[#130d24] border border-purple-100 dark:border-purple-900/40 text-center shadow-sm">
              <div className="font-bold text-slate-900 dark:text-white text-base">Tailwind CSS</div>
              <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1">White &amp; Purple Design</div>
            </div>
            <div className="p-5 rounded-xl bg-white dark:bg-[#130d24] border border-purple-100 dark:border-purple-900/40 text-center shadow-sm">
              <div className="font-bold text-slate-900 dark:text-white text-base">Google Gemini</div>
              <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1">+ Demo Engine</div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Multi-Tenancy */}
      <section id="security" className="py-24 px-6 border-t border-purple-100 dark:border-purple-900/30 bg-white dark:bg-[#0c0817]">
        <div className="max-w-5xl mx-auto rounded-3xl border border-purple-200 dark:border-purple-800/60 bg-gradient-to-b from-purple-50/60 via-white to-purple-50/40 dark:from-[#160f2a] dark:to-[#0f0a1c] p-8 sm:p-12 relative overflow-hidden shadow-xl shadow-purple-900/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">Enterprise-Grade Security &amp; Isolation</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                Data isolation is enforced strictly at the database query level via Organization scoping. Includes bcrypt password hashing, JWT authorization, rate limiting, and 4-tier Role-Based Access Control (Owner, Admin, Reviewer, Member).
              </p>
              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Tenant organization boundaries strictly isolated</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Configurable storage abstraction (Local/S3-ready)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Full immutable activity log audit trail for every action</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#130d24] border border-purple-200 dark:border-purple-800/60 space-y-4 shadow-md">
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between pb-2 border-b border-purple-100 dark:border-purple-900/40">
                <span className="font-semibold text-purple-900 dark:text-purple-300">PRE-SEEDED DEMO ACCOUNTS</span>
                <span className="text-purple-600 dark:text-purple-400">Password: Password123!</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-[#160f2a] border border-purple-100 dark:border-purple-900/50 flex justify-between items-center">
                  <span className="font-semibold text-slate-900 dark:text-white">admin@docintel.io</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold font-mono">Owner / Admin</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-[#160f2a] border border-purple-100 dark:border-purple-900/50 flex justify-between items-center">
                  <span className="font-semibold text-slate-900 dark:text-white">reviewer@docintel.io</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold font-mono">Reviewer</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-[#160f2a] border border-purple-100 dark:border-purple-900/50 flex justify-between items-center">
                  <span className="font-semibold text-slate-900 dark:text-white">member@docintel.io</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold font-mono">Member</span>
                </div>
              </div>
              <Link
                href="/login"
                className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all mt-2"
              >
                <span>Launch Demo Environment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-6 text-center bg-gradient-to-b from-purple-50/30 to-white dark:from-[#0f0a1c] dark:to-[#0c0817]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
            Ready to experience real document intelligence?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
            Test the live application right now. Upload documents, execute workflows, review extracted entities, and explore the analytics.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xl shadow-purple-600/30 hover:shadow-purple-600/40 transition-all"
            >
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white dark:bg-[#160f2a] hover:bg-purple-50 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800 font-bold transition-colors shadow-sm"
            >
              Sign In to Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-100 dark:border-purple-900/30 py-10 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="font-bold text-slate-700 dark:text-slate-300">DocIntel AI Platform</span>
            <span>&bull; Developer Portfolio Project</span>
          </div>
          <div>
            Built with White &amp; Purple Theme &bull; Next.js, TypeScript, Express, MongoDB &amp; Tailwind CSS.
          </div>
        </div>
      </footer>
    </div>
  );
}
