import { z } from 'zod';
import { ROLES, STORAGE_MODES } from '../constants/index.js';

export const RegisterSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100).trim(),
  lastName: z.string().min(1, 'Last name is required').max(100).trim(),
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  contactNumber: z.string().min(7, 'Contact number is required').max(25).trim(),
  dateOfBirth: z.string().min(1, 'Date of birth is required').trim(),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const CreateSubAdminSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100).trim(),
  lastName: z.string().min(1, 'Last name is required').max(100).trim(),
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  contactNumber: z.string().min(7, 'Contact number is required').max(25).trim(),
  dateOfBirth: z.string().min(1, 'Date of birth is required').trim(),
  password: z
    .string()
    .min(10, 'Temporary password must be at least 10 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
  portalRole: z.enum(['USER', 'ADMIN']).optional(),
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(4, 'Verification code or token is required').trim(),
});

export const MfaVerifySchema = z.object({
  token: z.string().min(6, 'Token must be at least 6 digits').max(10).trim(),
  isRecoveryCode: z.boolean().optional(),
});

export const EncryptedEnvelopeSchema = z.object({
  version: z.number().int().min(1),
  algorithm: z.string().min(1),
  iv: z.string().min(1), // Base64
  salt: z.string().min(1), // Base64
  ciphertext: z.string().min(1), // Base64
  tagLength: z.number().int().optional(),
  keyDerivation: z.enum(['HKDF-SHA-256', 'PBKDF2-SHA-256']),
  aad: z.string().optional(),
});

export const CredentialPayloadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  url: z.string().max(500).default(''),
  username: z.string().max(200).default(''),
  password: z.string().min(1, 'Password is required').max(500),
  notes: z.string().max(5000).optional().default(''),
  category: z.string().max(50).optional().default('General'),
  favorite: z.boolean().optional().default(false),
});

export const SyncPushItemSchema = z.object({
  itemId: z.string().uuid(),
  encryptedPayload: z.string().min(10), // stringified EncryptedEnvelope
  revision: z.number().int().min(1),
  isDeleted: z.boolean(),
  clientUpdatedAt: z.string().datetime(),
});

export const SyncPushBatchSchema = z.object({
  items: z.array(SyncPushItemSchema).max(500),
});

export const SyncPullQuerySchema = z.object({
  since: z.string().datetime().optional(),
});

export const AdminUserUpdateSchema = z.object({
  role: z.enum([ROLES.USER, ROLES.ADMIN, ROLES.SUB_ADMIN]).optional(),
  isSuspended: z.boolean().optional(),
});

export const PasswordGeneratorOptionsSchema = z.object({
  length: z.number().int().min(8).max(128).default(20),
  uppercase: z.boolean().default(true),
  lowercase: z.boolean().default(true),
  numbers: z.boolean().default(true),
  symbols: z.boolean().default(true),
  excludeAmbiguous: z.boolean().default(false),
});
