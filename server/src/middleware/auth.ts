import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { config } from '../config';
import { User, IUser, Membership, UserRole } from '../models';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  userId?: string;
  organizationId?: string;
  membershipRole?: UserRole;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authentication token required',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      email: string;
      organizationId?: string;
    };

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found or session expired',
      });
      return;
    }

    req.user = user;
    req.userId = user._id.toString();

    // Check organization header or user currentOrganizationId or token organizationId
    const headerOrgId = req.headers['x-organization-id'] as string;
    const activeOrgId =
      headerOrgId ||
      decoded.organizationId ||
      (user.currentOrganizationId ? user.currentOrganizationId.toString() : undefined);

    if (activeOrgId && mongoose.Types.ObjectId.isValid(activeOrgId)) {
      req.organizationId = activeOrgId;

      // Verify membership
      const membership = await Membership.findOne({
        userId: user._id,
        organizationId: new mongoose.Types.ObjectId(activeOrgId),
        status: 'active',
      });

      if (membership) {
        req.membershipRole = membership.role;
      }
    }

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token',
    });
  }
};

export const requireOrganization = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.organizationId) {
    res.status(400).json({
      success: false,
      error: 'Organization context is required for this action',
    });
    return;
  }

  if (!req.membershipRole) {
    res.status(403).json({
      success: false,
      error: 'Access denied: You are not an active member of this organization',
    });
    return;
  }

  next();
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.membershipRole || !allowedRoles.includes(req.membershipRole)) {
      res.status(403).json({
        success: false,
        error: `Insufficient permissions. Requires one of: [${allowedRoles.join(', ')}]`,
      });
      return;
    }
    next();
  };
};
