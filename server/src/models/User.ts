import mongoose, { Schema, Document as MongooseDoc, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends MongooseDoc {
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  currentOrganizationId?: mongoose.Types.ObjectId;
  settings: {
    theme: 'dark' | 'light' | 'system';
    emailNotifications: boolean;
    inAppNotifications: boolean;
    autoProcessUploads: boolean;
  };
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
  toJSON(): any;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    currentOrganizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    settings: {
      theme: {
        type: String,
        enum: ['dark', 'light', 'system'],
        default: 'dark',
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      inAppNotifications: {
        type: Boolean,
        default: true,
      },
      autoProcessUploads: {
        type: Boolean,
        default: true,
      },
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
