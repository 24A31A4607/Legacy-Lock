import { z } from 'zod';

export type UserRole = 'owner' | 'reviewer' | 'beneficiary';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  passwordHash: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt: string;
}

export type AssetCategory =
  | 'Documents'
  | 'Photos & Memories'
  | 'Account Records'
  | 'Personal Notes'
  | 'Other';

export interface Asset {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: AssetCategory;
  tags: string[];
  fileName: string;
  fileSize: number; // in bytes
  mimeType: string;
  filePath: string;
  previewUrl?: string;
  isEncryptedPreview?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BeneficiaryAccessLevel = 'full' | 'specific_assets' | 'instructions_only';
export type BeneficiaryStatus = 'pending' | 'invited' | 'confirmed';

export interface Beneficiary {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  relationship: string;
  phone?: string;
  notes?: string;
  assignedAssetIds: string[];
  assignedCategories: AssetCategory[];
  futureAccessLevel: BeneficiaryAccessLevel;
  status: BeneficiaryStatus;
  avatarUrl?: string;
  createdAt: string;
}

export type InstructionType =
  | 'personal_message'
  | 'general_directive'
  | 'asset_distribution'
  | 'digital_accounts';

export interface LegacyInstruction {
  id: string;
  userId: string;
  beneficiaryId?: string | null;
  type: InstructionType;
  title: string;
  content: string;
  isLockedUntilInheritance: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CheckInStatus = 'active' | 'warning' | 'missed';

export interface CheckInSettings {
  id: string;
  userId: string;
  frequencyDays: number;
  gracePeriodDays: number;
  lastCheckInAt: string;
  nextCheckInDue: string;
  status: CheckInStatus;
  reminderEmail: string;
  notifyBeneficiariesOnMissed: boolean;
}

export interface CheckInEvent {
  id: string;
  userId: string;
  eventType: 'user_confirmed' | 'reminder_sent' | 'missed_flagged' | 'frequency_updated';
  timestamp: string;
  ipOrOrigin: string;
  notes?: string;
}

export type WorkflowStatus =
  | 'No request'
  | 'Request submitted'
  | 'Awaiting review'
  | 'Approved'
  | 'Rejected'
  | 'Access granted'
  | 'Access revoked';

export interface InheritanceEvidence {
  declarationType: string;
  legalAttestationNotes: string;
  certificateReference?: string;
  submittedAt: string;
}

export interface InheritanceRequest {
  id: string;
  userId: string; // The vault owner whose assets are requested
  beneficiaryId: string; // The beneficiary record ID
  beneficiaryEmail: string;
  beneficiaryName: string;
  status: WorkflowStatus;
  evidenceMetadata: InheritanceEvidence;
  reviewerId?: string;
  reviewerNotes?: string;
  decidedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  ip: string;
  timestamp: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
  createdAt: string;
}

// Zod Validation Schemas
export const RegisterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Name must be at least 2 characters long'),
  role: z.enum(['owner', 'reviewer', 'beneficiary']).default('owner'),
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const AssetCreateSchema = z.object({
  title: z.string().min(2, 'Title is required (min 2 chars)').max(100),
  description: z.string().max(1000).default(''),
  category: z.enum([
    'Documents',
    'Photos & Memories',
    'Account Records',
    'Personal Notes',
    'Other',
  ]),
  tags: z.array(z.string()).default([]),
});

export const BeneficiarySchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  relationship: z.string().min(2, 'Relationship is required'),
  phone: z.string().optional(),
  notes: z.string().max(1000).optional(),
  assignedAssetIds: z.array(z.string()).default([]),
  assignedCategories: z.array(z.string()).default([]),
  futureAccessLevel: z.enum(['full', 'specific_assets', 'instructions_only']).default('specific_assets'),
});

export const InstructionSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  content: z.string().min(5, 'Content must be at least 5 characters'),
  type: z.enum([
    'personal_message',
    'general_directive',
    'asset_distribution',
    'digital_accounts',
  ]),
  beneficiaryId: z.string().nullable().optional(),
  isLockedUntilInheritance: z.boolean().default(true),
});

export const CheckInUpdateSchema = z.object({
  frequencyDays: z.number().int().min(1).max(365),
  gracePeriodDays: z.number().int().min(1).max(90),
  reminderEmail: z.string().email(),
  notifyBeneficiariesOnMissed: z.boolean(),
});

export const RequestSubmissionSchema = z.object({
  beneficiaryId: z.string().min(1, 'Beneficiary selection is required'),
  declarationType: z.string().min(2, 'Declaration type is required'),
  legalAttestationNotes: z.string().min(10, 'Attestation notes must be at least 10 characters'),
  certificateReference: z.string().optional(),
});

export const ReviewDecisionSchema = z.object({
  decision: z.enum(['Approved', 'Rejected', 'Access granted', 'Access revoked']),
  notes: z.string().min(5, 'Reviewer rationale notes are required (min 5 characters)'),
});
