import {
  VaultItemDecrypted,
  StorageMode,
  STORAGE_MODES,
  CredentialPayload,
} from '@passvault/shared';
import {
  encryptPayloadToEnvelope,
  decryptPayloadFromEnvelope,
} from '@passvault/crypto';
import { syncDb, isolatedDb, LocalVaultRecord } from './db';

export class VaultService {
  /**
   * Encrypts and saves or updates a credential into its designated partitioned database.
   */
  static async saveCredential(
    credential: {
      id?: string;
      title: string;
      url: string;
      username: string;
      password: string;
      notes?: string;
      category?: string;
      favorite?: boolean;
      storageMode: StorageMode;
      revision?: number;
    },
    recoveryCode: string
  ): Promise<VaultItemDecrypted> {
    const id = credential.id || crypto.randomUUID();
    const storageMode = credential.storageMode;
    const now = new Date().toISOString();

    const payload: CredentialPayload = {
      title: credential.title,
      url: credential.url || '',
      username: credential.username || '',
      password: credential.password,
      notes: credential.notes || '',
      category: credential.category || 'General',
      favorite: credential.favorite || false,
    };

    // Encrypt sensitive credential payload on the client with AES-256-GCM
    const envelope = await encryptPayloadToEnvelope(payload, recoveryCode, {
      keyDerivation: 'HKDF-SHA-256',
      aad: id, // Bind record ID as Authenticated Additional Data
    });

    const targetDb = storageMode === STORAGE_MODES.ISOLATED ? isolatedDb : syncDb;
    const existing = await targetDb.items.get(id);

    const revision = (existing?.revision || 0) + 1;

    const record: LocalVaultRecord = {
      id,
      storageMode,
      envelope,
      revision,
      isDeleted: false,
      clientUpdatedAt: now,
      createdAt: existing?.createdAt || now,
    };

    await targetDb.items.put(record);

    return {
      id,
      ...payload,
      storageMode,
      revision,
      isDeleted: false,
      clientUpdatedAt: now,
      createdAt: record.createdAt,
    };
  }

  /**
   * Retrieves and decrypts all records from a specific storage partition.
   */
  static async getCredentialsByMode(
    mode: StorageMode,
    recoveryCode: string
  ): Promise<VaultItemDecrypted[]> {
    const db = mode === STORAGE_MODES.ISOLATED ? isolatedDb : syncDb;
    const records = await db.items.filter((r) => !r.isDeleted).toArray();

    const decryptedList: VaultItemDecrypted[] = [];

    for (const record of records) {
      try {
        const payload = await decryptPayloadFromEnvelope<CredentialPayload>(
          record.envelope,
          recoveryCode
        );

        decryptedList.push({
          id: record.id,
          title: payload.title,
          url: payload.url,
          username: payload.username,
          password: payload.password,
          notes: payload.notes,
          category: payload.category,
          favorite: payload.favorite,
          storageMode: record.storageMode,
          revision: record.revision,
          isDeleted: record.isDeleted,
          clientUpdatedAt: record.clientUpdatedAt,
          createdAt: record.createdAt,
        });
      } catch (err) {
        console.error(`Failed to decrypt item ${record.id}:`, err);
      }
    }

    return decryptedList;
  }

  /**
   * Soft deletes a record from its designated storage database.
   */
  static async deleteCredential(id: string, mode: StorageMode): Promise<void> {
    const db = mode === STORAGE_MODES.ISOLATED ? isolatedDb : syncDb;
    const record = await db.items.get(id);

    if (record) {
      if (mode === STORAGE_MODES.ISOLATED) {
        // Isolated items can be hard-deleted or tombstoned locally
        await db.items.delete(id);
      } else {
        // Synced items are tombstoned so deletion propagates cleanly to the cloud
        await db.items.put({
          ...record,
          isDeleted: true,
          revision: record.revision + 1,
          clientUpdatedAt: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Converts a credential between Isolated Mode and Synchronized Mode.
   * Requires explicit confirmation and migrates across database boundaries.
   */
  static async migrateStorageMode(
    id: string,
    currentMode: StorageMode,
    targetMode: StorageMode,
    recoveryCode: string
  ): Promise<void> {
    if (currentMode === targetMode) return;

    const sourceDb = currentMode === STORAGE_MODES.ISOLATED ? isolatedDb : syncDb;
    const targetDb = targetMode === STORAGE_MODES.ISOLATED ? isolatedDb : syncDb;

    const record = await sourceDb.items.get(id);
    if (!record) throw new Error('Record not found in source database');

    // Decrypt payload with recovery code
    const payload = await decryptPayloadFromEnvelope<CredentialPayload>(
      record.envelope,
      recoveryCode
    );

    // Remove or tombstone in source database
    if (currentMode === STORAGE_MODES.SYNCHRONIZED) {
      // Tombstone in sync database so cloud marks it deleted
      await sourceDb.items.put({
        ...record,
        isDeleted: true,
        revision: record.revision + 1,
        clientUpdatedAt: new Date().toISOString(),
      });
    } else {
      await sourceDb.items.delete(id);
    }

    // Save into new target database with updated mode
    await this.saveCredential(
      {
        id: record.id,
        ...payload,
        storageMode: targetMode,
      },
      recoveryCode
    );
  }
}
