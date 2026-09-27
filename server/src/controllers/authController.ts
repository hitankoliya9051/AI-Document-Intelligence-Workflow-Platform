import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { User, Organization, Membership } from '../models';
import { config } from '../config';
import { logActivity } from '../services/activityLogger';
import { WorkflowEngine } from '../services/workflowEngine';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organizationName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const generateToken = (userId: string, email: string, organizationId?: string) => {
  return jwt.sign(
    { userId, email, organizationId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as any }
  );
};

export const register = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, email, password, organizationName } = registerSchema.parse(req.body);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400).json({
      success: false,
      error: 'An account with this email already exists',
    });
    return;
  }

  const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  // Create default organization for new user
  const orgName = organizationName || `${name.split(' ')[0]}'s Workspace`;
  const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);

  const organization = await Organization.create({
    name: orgName,
    slug,
    ownerId: user._id,
  });

  // Assign user as owner
  await Membership.create({
    userId: user._id,
    organizationId: organization._id,
    role: 'owner',
    status: 'active',
  });

  user.currentOrganizationId = organization._id;
  await user.save();

  // Create default standard workflow
  await WorkflowEngine.createDefaultWorkflow(organization._id, user._id);

  const token = generateToken(user._id.toString(), user.email, organization._id.toString());

  await logActivity({
    organizationId: organization._id,
    userId: user._id,
    action: 'login',
    details: { event: 'user_registered' },
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    data: {
      user: user.toJSON(),
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        role: 'owner',
      },
      token,
    },
  });
};

export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Invalid email or password',
    });
    return;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401).json({
      success: false,
      error: 'Invalid email or password',
    });
    return;
  }

  user.lastLogin = new Date();
  await user.save();

  // Resolve active organization & role
  let organizationId = user.currentOrganizationId;
  let membership = null;

  if (organizationId) {
    membership = await Membership.findOne({
      userId: user._id,
      organizationId,
      status: 'active',
    });
  }

  if (!membership) {
    membership = await Membership.findOne({
      userId: user._id,
      status: 'active',
    });
    if (membership) {
      organizationId = membership.organizationId;
      user.currentOrganizationId = organizationId;
      await user.save();
    }
  }

  let orgData: any = null;
  if (organizationId) {
    const org = await Organization.findById(organizationId);
    if (org) {
      orgData = {
        id: org._id,
        name: org.name,
        slug: org.slug,
        role: membership?.role || 'member',
      };
    }
  }

  const token = generateToken(
    user._id.toString(),
    user.email,
    organizationId ? organizationId.toString() : undefined
  );

  if (organizationId) {
    await logActivity({
      organizationId,
      userId: user._id,
      action: 'login',
      details: { event: 'user_login' },
      ipAddress: req.ip,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      user: user.toJSON(),
      organization: orgData,
      token,
    },
  });
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const orgId = req.organizationId;

  let activeOrg: any = null;
  if (orgId) {
    const org = await Organization.findById(orgId);
    if (org) {
      activeOrg = {
        id: org._id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        storageUsed: org.storageUsed,
        storageLimit: org.storageLimit,
        role: req.membershipRole || 'member',
      };
    }
  }

  // Get all user memberships to allow switching
  const memberships = await Membership.find({
    userId: user._id,
    status: 'active',
  }).populate('organizationId', 'name slug plan');

  res.status(200).json({
    success: true,
    data: {
      user: user.toJSON(),
      activeOrganization: activeOrg,
      organizations: memberships
        .filter((m) => m.organizationId)
        .map((m: any) => ({
          id: m.organizationId._id,
          name: m.organizationId.name,
          slug: m.organizationId.slug,
          role: m.role,
        })),
    },
  });
};

export const switchOrganization = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { organizationId } = req.body;
  if (!organizationId) {
    res.status(400).json({ success: false, error: 'organizationId is required' });
    return;
  }

  const membership = await Membership.findOne({
    userId: req.user!._id,
    organizationId,
    status: 'active',
  });

  if (!membership) {
    res.status(403).json({
      success: false,
      error: 'You do not have access to this organization',
    });
    return;
  }

  req.user!.currentOrganizationId = organizationId;
  await req.user!.save();

  const org = await Organization.findById(organizationId);

  const token = generateToken(
    req.user!._id.toString(),
    req.user!.email,
    organizationId.toString()
  );

  res.status(200).json({
    success: true,
    data: {
      token,
      organization: {
        id: org!._id,
        name: org!.name,
        slug: org!.slug,
        role: membership.role,
      },
    },
  });
};

export const forgotPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { email } = forgotPasswordSchema.parse(req.body);

  const user = await User.findOne({ email });
  if (!user) {
    // Return success to avoid email enumeration
    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, reset instructions have been generated.',
    });
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // In production, send via SendGrid/SES. In dev, return resetToken for convenience
  res.status(200).json({
    success: true,
    message: 'Password reset token generated successfully.',
    data: {
      demoResetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
    },
  });
};

export const resetPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { token, password } = resetPasswordSchema.parse(req.body);

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    res.status(400).json({
      success: false,
      error: 'Invalid or expired password reset token',
    });
    return;
  }

  const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
  user.passwordHash = await bcrypt.hash(password, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password has been successfully updated. You can now login.',
  });
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (req.user && req.organizationId) {
    await logActivity({
      organizationId: req.organizationId,
      userId: req.user._id,
      action: 'logout',
      details: { event: 'user_logout' },
      ipAddress: req.ip,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};
