import mongoose from 'mongoose';
import { Notification, NotificationType, Membership, UserRole } from '../models';

export interface CreateNotificationParams {
  userId: mongoose.Types.ObjectId | string;
  organizationId: mongoose.Types.ObjectId | string;
  title: string;
  message: string;
  type: NotificationType;
  documentId?: mongoose.Types.ObjectId | string;
  link?: string;
}

export const createNotification = async (
  params: CreateNotificationParams
): Promise<void> => {
  try {
    await Notification.create({
      userId: new mongoose.Types.ObjectId(params.userId),
      organizationId: new mongoose.Types.ObjectId(params.organizationId),
      title: params.title,
      message: params.message,
      type: params.type,
      documentId: params.documentId ? new mongoose.Types.ObjectId(params.documentId) : undefined,
      link: params.link,
      isRead: false,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const notifyOrganizationRoles = async (params: {
  organizationId: mongoose.Types.ObjectId | string;
  roles: UserRole[];
  title: string;
  message: string;
  type: NotificationType;
  documentId?: mongoose.Types.ObjectId | string;
  link?: string;
  excludeUserId?: mongoose.Types.ObjectId | string;
}): Promise<void> => {
  try {
    const orgId = new mongoose.Types.ObjectId(params.organizationId);
    const memberships = await Membership.find({
      organizationId: orgId,
      role: { $in: params.roles },
      status: 'active',
    });

    const notificationsToCreate = memberships
      .filter((m) => !params.excludeUserId || m.userId.toString() !== params.excludeUserId.toString())
      .map((m) => ({
        userId: m.userId,
        organizationId: orgId,
        title: params.title,
        message: params.message,
        type: params.type,
        documentId: params.documentId ? new mongoose.Types.ObjectId(params.documentId) : undefined,
        link: params.link,
        isRead: false,
      }));

    if (notificationsToCreate.length > 0) {
      await Notification.insertMany(notificationsToCreate);
    }
  } catch (error) {
    console.error('Error broadcasting notification to roles:', error);
  }
};
