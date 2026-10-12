import { UserRole, StorageMode, AuditEventType } from '../constants/index.js';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  isSuspended: boolean;
  mfaEnabled: boolean;
  createdAt: string;
}

export interface SessionInfo {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface EncryptedEnvelope {
  version: number;
  algorithm: string;
  iv: string; // Base64
  salt: string; // Base64
  ciphertext: string; // Base64
  tagLength?: number;
  keyDerivation: 'HKDF-SHA-256' | 'PBKDF2-SHA-256';
  aad?: string; // Optional authenticated additional data identifier
}

export interface CredentialPayload {
  title: string;
  url: string;
  username: string;
  password: string;
  notes?: string;
  category?: string;
  favorite?: boolean;
}

export interface VaultItemDecrypted extends CredentialPayload {
  id: string;
  storageMode: StorageMode;
  revision: number;
  isDeleted: boolean;
  clientUpdatedAt: string;
  createdAt: string;
}

export interface VaultItemEncrypted {
  id: string;
  storageMode: StorageMode;
  envelope: EncryptedEnvelope;
  revision: number;
  isDeleted: boolean;
  clientUpdatedAt: string;
  createdAt: string;
}

export interface SyncPushItem {
  itemId: string;
  encryptedPayload: string; // Serialized EncryptedEnvelope
  revision: number;
  isDeleted: boolean;
  clientUpdatedAt: string;
}

export interface SyncPullItem {
  id: string;
  itemId: string;
  encryptedPayload: string;
  revision: number;
  isDeleted: boolean;
  clientUpdatedAt: string;
  updatedAt: string;
}

export interface AuditLogItem {
  id: string;
  userId: string | null;
  actorEmail: string | null;
  eventType: AuditEventType;
  status: 'SUCCESS' | 'FAILURE';
  ipAddress: string | null;
  userAgent: string | null;
  detailsJson: string | null;
  createdAt: string;
}

export interface SystemMonitoringStats {
  serverTime: string;
  uptimeSeconds: number;
  databaseStatus: 'healthy' | 'unhealthy';
  activeSessionsCount: number;
  totalUsersCount: number;
  totalEncryptedItemsCount: number;
  auditEventsCount: number;
  recentErrorsCount: number;
}
