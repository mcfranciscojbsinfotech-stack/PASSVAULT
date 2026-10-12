import Dexie, { type Table } from 'dexie';
import { EncryptedEnvelope, StorageMode } from '@passvault/shared';

export interface LocalVaultRecord {
  id: string; // UUID
  storageMode: StorageMode;
  envelope: EncryptedEnvelope;
  revision: number;
  isDeleted: boolean;
  clientUpdatedAt: string;
  createdAt: string;
}

/**
 * DATABASE 1: Synchronized Records Repository
 * Exclusively used for cloud-synced encrypted credentials.
 */
export class PassVaultSyncDatabase extends Dexie {
  items!: Table<LocalVaultRecord, string>;

  constructor() {
    super('PassVault_SyncRepository');
    this.version(1).stores({
      items: 'id, revision, isDeleted, clientUpdatedAt',
    });
  }
}

/**
 * DATABASE 2: Isolated Records Repository (ISOLATE MODE)
 * Physically separate IndexedDB database strictly partitioned from the sync pipeline.
 * The online sync module does not possess access or hooks into this database.
 */
export class PassVaultIsolatedDatabase extends Dexie {
  items!: Table<LocalVaultRecord, string>;

  constructor() {
    super('PassVault_IsolatedRepository_LocalOnly');
    this.version(1).stores({
      items: 'id, revision, isDeleted, clientUpdatedAt',
    });
  }
}

export const syncDb = new PassVaultSyncDatabase();
export const isolatedDb = new PassVaultIsolatedDatabase();
