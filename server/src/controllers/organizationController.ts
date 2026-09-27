import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { Organization, Membership, User } from '../models';
import { logActivity } from '../services/activityLogger';
import { createNotification } from '../services/notificationService';
import { WorkflowEngine } from '../services/workflowEngine';

export const getUserOrganizations = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = new mongoose.Types.ObjectId(req.userId);

  const memberships = await Membership.find({ userId, status: 'active' }).populate(
    'organizationId'
  );

  const orgs = memberships
    .filter((m) => m.organizationId)
    .map((m: any) => ({
      ...m.organizationId.toObject(),
      currentUserRole: m.role,
    }));

  res.status(200).json({
    success: true,
    data: orgs,
  });
};

export const createOrganization = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = new mongoose.Types.ObjectId(req.userId);
  const { name } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ success: false, error: 'Organization name is required' });
    return;
  }

  const slug =
    name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-') +
    '-' +
    Math.floor(1000 + Math.random() * 9000);

  const organization = await Organization.create({
    name: name.trim(),
    slug,
    ownerId: userId,
  });

  await Membership.create({
    userId,
    organizationId: organization._id,
    role: 'owner',
    status: 'active',
  });

  // Create default workflow
  await WorkflowEngine.createDefaultWorkflow(organization._id, userId);

  // Switch current organization to new one
  await User.findByIdAndUpdate(userId, { currentOrganizationId: organization._id });

  await logActivity({
    organizationId: organization._id,
    userId,
    action: 'settings_update',
    details: { event: 'organization_created', name: organization.name },
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    message: 'Organization created successfully',
    data: {
      ...organization.toObject(),
      currentUserRole: 'owner',
    },
  });
};

export const getCurrentOrganization = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const orgId = new mongoose.Types.ObjectId(req.organizationId);

  const org = await Organization.findById(orgId).populate('ownerId', 'name email avatar');
  if (!org) {
    res.status(404).json({ success: false, error: 'Organization not found' });
    return;
  }

  const memberships = await Membership.find({ organizationId: orgId, status: 'active' }).populate(
    'userId',
    'name email avatar lastLogin'
  );

  const members = memberships.map((m: any) => ({
    membershipId: m._id,
    user: m.userId,
    role: m.role,
    status: m.status,
    joinedAt: m.createdAt,
  }));

  res.status(200).json({
    success: true,
    data: {
      organization: org,
      currentUserRole: req.membershipRole,
      members,
    },
  });
};

export const inviteMember = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const orgId = new mongoose.Types.ObjectId(req.organizationId);
  const inviterId = new mongoose.Types.ObjectId(req.userId);
  const { email, role = 'member', name } = req.body;

  if (!email || !email.trim()) {
    res.status(400).json({ success: false, error: 'Email is required' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Find or create placeholder user
  let targetUser = await User.findOne({ email: normalizedEmail });
  if (!targetUser) {
    const salt = await require('bcryptjs').genSalt(10);
    const tempPasswordHash = await require('bcryptjs').hash('InviteTemp123!', salt);
    targetUser = await User.create({
      name: name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      passwordHash: tempPasswordHash,
      currentOrganizationId: orgId,
    });
  }

  const existingMembership = await Membership.findOne({
    userId: targetUser._id,
    organizationId: orgId,
  });

  if (existingMembership) {
    res.status(400).json({
      success: false,
      error: 'User is already a member of this organization',
    });
    return;
  }

  const membership = await Membership.create({
    userId: targetUser._id,
    organizationId: orgId,
    role: ['owner', 'admin', 'reviewer', 'member'].includes(role) ? role : 'member',
    status: 'active',
    invitedBy: inviterId,
  });

  await createNotification({
    userId: targetUser._id,
    organizationId: orgId,
    title: 'Workspace Invitation',
    message: `You were added to the workspace with role: ${membership.role}.`,
    type: 'team_invitation',
    link: '/dashboard',
  });

  await logActivity({
    organizationId: orgId,
    userId: inviterId,
    action: 'permission_change',
    details: { event: 'member_invited', invitedEmail: normalizedEmail, role: membership.role },
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    message: `User ${normalizedEmail} successfully added to the organization as ${membership.role}.`,
    data: membership,
  });
};

export const updateMemberRole = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const orgId = new mongoose.Types.ObjectId(req.organizationId);
  const { memberId } = req.params;
  const { role } = req.body;

  if (!['owner', 'admin', 'reviewer', 'member'].includes(role)) {
    res.status(400).json({ success: false, error: 'Invalid role specified' });
    return;
  }

  const membership = await Membership.findOne({
    _id: memberId,
    organizationId: orgId,
  });

  if (!membership) {
    res.status(404).json({ success: false, error: 'Membership not found' });
    return;
  }

  membership.role = role;
  await membership.save();

  await logActivity({
    organizationId: orgId,
    userId: req.userId!,
    action: 'permission_change',
    details: { event: 'role_updated', memberId, newRole: role },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Member role updated successfully',
    data: membership,
  });
};

export const removeMember = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const orgId = new mongoose.Types.ObjectId(req.organizationId);
  const { memberId } = req.params;

  const membership = await Membership.findOne({
    _id: memberId,
    organizationId: orgId,
  });

  if (!membership) {
    res.status(404).json({ success: false, error: 'Membership not found' });
    return;
  }

  if (membership.role === 'owner') {
    res.status(400).json({ success: false, error: 'Cannot remove organization owner' });
    return;
  }

  await Membership.deleteOne({ _id: membership._id });

  await logActivity({
    organizationId: orgId,
    userId: req.userId!,
    action: 'permission_change',
    details: { event: 'member_removed', removedUserId: membership.userId },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Member removed from organization',
  });
};
