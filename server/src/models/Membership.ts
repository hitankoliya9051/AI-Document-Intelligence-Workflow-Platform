import mongoose, { Schema, Document as MongooseDoc, Model } from 'mongoose';

export type UserRole = 'owner' | 'admin' | 'reviewer' | 'member';

export interface IMembership extends MongooseDoc {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  role: UserRole;
  status: 'active' | 'invited' | 'suspended';
  invitedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'reviewer', 'member'],
      default: 'member',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'invited', 'suspended'],
      default: 'active',
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

MembershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export const Membership: Model<IMembership> = mongoose.model<IMembership>(
  'Membership',
  MembershipSchema
);
