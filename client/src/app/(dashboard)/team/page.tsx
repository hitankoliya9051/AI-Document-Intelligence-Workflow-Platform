'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { formatRelativeTime } from '../../../lib/utils';
import { UserRole } from '../../../types';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  CheckCircle2,
  Mail,
  Building2,
  Sparkles,
} from 'lucide-react';

export default function TeamPage() {
  const { user, activeOrg } = useAuth();
  const { toast } = useToast();

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('member');
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/organizations/current');
      setMembers(res.members || []);
    } catch (err: any) {
      toast(err.message || 'Error loading team directory', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/organizations/invite', {
        email: inviteEmail.trim(),
        name: inviteName.trim(),
        role: inviteRole,
      });

      toast(`Invitation sent to ${inviteEmail}`, 'success');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteName('');
      fetchMembers();
    } catch (err: any) {
      toast(err.message || 'Failed to invite member', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    try {
      await api.patch(`/organizations/members/${memberId}`, { role: newRole });
      toast('Member role updated', 'success');
      fetchMembers();
    } catch (err: any) {
      toast(err.message || 'Failed to update role', 'error');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) return;

    try {
      await api.delete(`/organizations/members/${memberId}`);
      toast('Member removed from workspace', 'success');
      fetchMembers();
    } catch (err: any) {
      toast(err.message || 'Failed to remove member', 'error');
    }
  };

  const isOwnerOrAdmin = activeOrg?.currentUserRole === 'owner' || activeOrg?.currentUserRole === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-purple-600" /> Team & Workspace Permissions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage organization members, assign role permissions, and track active seats
          </p>
        </div>

        {isOwnerOrAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        )}
      </div>

      {/* Member Directory */}
      <div className="rounded-3xl glass-panel overflow-hidden border border-purple-100 dark:border-slate-800">
        <div className="p-4 px-6 border-b border-purple-100 dark:border-slate-800 flex items-center justify-between">
          <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
            Workspace Members ({members.length})
          </span>
          <span className="text-[11px] text-slate-400">
            Active Workspace: <span className="font-semibold text-purple-600 dark:text-purple-400">{activeOrg?.name}</span>
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
            Loading team directory...
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {members.map((m) => {
              const u = m.user;
              const isCurrentUser = u?._id === user?._id;

              return (
                <div
                  key={m.membershipId}
                  className="p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center border border-purple-200 dark:border-purple-800 shrink-0">
                      {u?.name ? u.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{u?.name || 'Invited User'}</span>
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{u?.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    {/* Role selector */}
                    {isOwnerOrAdmin && !isCurrentUser && m.role !== 'owner' ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.membershipId, e.target.value as UserRole)}
                        className="px-2.5 py-1 text-xs rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="admin">Admin</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="member">Member</option>
                      </select>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-slate-800 text-purple-700 dark:text-slate-300 border border-purple-200 dark:border-slate-700">
                        {m.role}
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 hidden md:inline">
                      Joined {formatRelativeTime(m.joinedAt)}
                    </span>

                    {isOwnerOrAdmin && !isCurrentUser && m.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(m.membershipId, u?.name || 'user')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Role Permissions Reference Table */}
      <div className="p-6 rounded-3xl glass-panel space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Role Access Matrix
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-slate-900/60 border border-purple-100 dark:border-slate-800">
            <span className="font-bold text-purple-600 dark:text-purple-400 block mb-1">Owner</span>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Full control over billing, member removal, workspace configuration, and permanent deletions.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-cyan-400 block mb-1">Admin</span>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Can invite members, manage workflows, adjust AI thresholds, and perform final sign-offs.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-amber-400 block mb-1">Reviewer</span>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Specialized verification role: approves or rejects documents, corrects low confidence fields.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-400 block mb-1">Member</span>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Can upload documents, view processed files, chat with AI, and post collaborative comments.
            </p>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#160f2a] border border-purple-100 dark:border-purple-900/50 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Invite Team Member
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Add a colleague to your document intelligence workspace
            </p>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Rachel Adams"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-purple-50/40 dark:bg-slate-900 border border-purple-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="rachel@company.com"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-purple-50/40 dark:bg-slate-900 border border-purple-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Workspace Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-purple-50/40 dark:bg-slate-900 border border-purple-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="member">Member - Ingestion & Chat</option>
                  <option value="reviewer">Reviewer - Verification Queue & Approval</option>
                  <option value="admin">Admin - Workflows & Configuration</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
