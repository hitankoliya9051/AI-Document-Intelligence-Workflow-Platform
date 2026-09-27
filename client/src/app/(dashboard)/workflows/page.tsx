'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import { IWorkflow, IWorkflowStep } from '../../../types';
import {
  GitBranch,
  Plus,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  Trash2,
  Star,
  Check,
} from 'lucide-react';

export default function WorkflowsPage() {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<IWorkflow[]>([]);
  const [loading, setLoading] = useState(true);

  // New Workflow Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<'on_upload' | 'manual'>('on_upload');
  const [steps, setSteps] = useState<Array<{ name: string; type: any; assignedRole: any }>>([
    { name: 'Document Ingestion', type: 'upload', assignedRole: 'any' },
    { name: 'AI Text & Entity Parsing', type: 'extraction', assignedRole: 'any' },
    { name: 'Domain Expert Review', type: 'review', assignedRole: 'reviewer' },
    { name: 'Executive Sign-off', type: 'complete', assignedRole: 'admin' },
  ]);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/workflows');
      setWorkflows(res || []);
    } catch (err: any) {
      toast(err.message || 'Failed to fetch workflows', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await api.post('/workflows', {
        name: name.trim(),
        description: description.trim(),
        triggerType,
        steps: steps.map((s, idx) => ({
          stepNumber: idx + 1,
          name: s.name,
          type: s.type,
          assignedRole: s.assignedRole,
          requiredApprovals: 1,
        })),
        isDefault: false,
      });

      toast('Workflow pipeline created successfully', 'success');
      setShowCreateModal(false);
      setName('');
      setDescription('');
      fetchWorkflows();
    } catch (err: any) {
      toast(err.message || 'Failed to create workflow', 'error');
    }
  };

  const handleDeleteWorkflow = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      toast('Cannot delete the default organization workflow', 'warning');
      return;
    }
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await api.delete(`/workflows/${id}`);
      toast('Workflow deleted', 'success');
      fetchWorkflows();
    } catch (err: any) {
      toast(err.message || 'Delete failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <GitBranch className="w-6 h-6 text-purple-600 dark:text-purple-400" /> Document Workflow Pipelines
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Define multi-step routing, automated parsing gates, and review requirements for ingested files
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Custom Workflow
        </button>
      </div>

      {/* Workflow Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 animate-pulse glass-panel rounded-3xl">
          Loading workflow pipelines...
        </div>
      ) : workflows.length === 0 ? (
        <div className="p-16 text-center glass-panel rounded-3xl">
          <GitBranch className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No Workflows Configured
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Create an automated pipeline to route documents from upload to final signoff.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30"
          >
            Create Standard Pipeline
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {workflows.map((wf) => (
            <div
              key={wf._id}
              className="p-6 rounded-3xl glass-panel border border-purple-100 dark:border-purple-900/40 space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-100 dark:border-purple-900/40">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {wf.name}
                    </h3>
                    {wf.isDefault && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-purple-600 dark:fill-purple-400 text-purple-600 dark:text-purple-400" /> Default Org Pipeline
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 dark:bg-slate-800 text-purple-700 dark:text-purple-300">
                      Trigger: {wf.triggerType.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {wf.description}
                  </p>
                </div>

                {!wf.isDefault && (
                  <button
                    onClick={() => handleDeleteWorkflow(wf._id, wf.isDefault)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-purple-50 dark:hover:bg-slate-800 self-start sm:self-auto transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Step Sequence Visualizer */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Sequential Progression Stages ({wf.steps?.length || 0} Steps)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
                  {wf.steps?.map((step: IWorkflowStep, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-purple-50/40 dark:bg-[#160f2a] border border-purple-100 dark:border-purple-900/40 relative group hover:border-purple-400 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center">
                          {step.stepNumber}
                        </span>
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">
                          {step.type}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 mb-1">
                        {step.name}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-2 pt-2 border-t border-purple-100 dark:border-purple-900/40">
                        <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        <span>Role: {step.assignedRole.toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl glass-dropdown p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Create Document Workflow
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Configure automated steps and approval roles
            </p>

            <form onSubmit={handleCreateWorkflow} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Workflow Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Financial Invoice Fast-Track"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-purple-50/30 dark:bg-slate-900 border border-purple-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the intent and lifecycle of this pipeline..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-purple-50/30 dark:bg-slate-900 border border-purple-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trigger
                </label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-purple-50/30 dark:bg-slate-900 border border-purple-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="on_upload">Automatic on Upload</option>
                  <option value="manual">Manual Trigger Only</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30"
                >
                  Save Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
