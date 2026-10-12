import JSZip from 'jszip';
import { syncDb, isolatedDb, LocalVaultRecord } from './db';
import {
  encryptPayloadToEnvelope,
  decryptPayloadFromEnvelope,
} from '@passvault/crypto';
import { EncryptedEnvelope, StorageMode } from '@passvault/shared';

export interface BackupPayload {
  formatVersion: number;
  exportedAt: string;
  source: 'PassVault_Backup_Engine';
  synchronizedItems: LocalVaultRecord[];
  isolatedItems: LocalVaultRecord[];
}

export interface RestorePreview {
  valid: boolean;
  synchronizedCount: number;
  isolatedCount: number;
  exportedAt: string;
  error?: string;
}

export class BackupService {
  /**
   * Exports an encrypted JSON backup file.
   * Encrypts the entire export container using the user-chosen backup password (PBKDF2-SHA-256 + AES-GCM).
   */
  static async exportEncryptedJsonBackup(backupPassword: string): Promise<Blob> {
    const syncRecords = await syncDb.items.filter((r) => !r.isDeleted).toArray();
    const isolatedRecords = await isolatedDb.items.filter((r) => !r.isDeleted).toArray();

    const backupData: BackupPayload = {
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      source: 'PassVault_Backup_Engine',
      synchronizedItems: syncRecords,
      isolatedItems: isolatedRecords,
    };

    // Encrypt the backup envelope with PBKDF2 derived key from the backup password
    const backupEnvelope = await encryptPayloadToEnvelope(backupData, backupPassword, {
      keyDerivation: 'PBKDF2-SHA-256',
    });

    const jsonString = JSON.stringify(backupEnvelope, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  /**
   * Exports an encrypted ZIP archive containing the encrypted backup payload and metadata.
   */
  static async exportEncryptedZipBackup(backupPassword: string): Promise<Blob> {
    const jsonBlob = await this.exportEncryptedJsonBackup(backupPassword);
    const jsonText = await jsonBlob.text();

    const zip = new JSZip();
    zip.file('passvault-backup-encrypted.json', jsonText);
    zip.file(
      'README.txt',
      'PassVault Encrypted Archive\nAll vault payloads are protected with AES-256-GCM and PBKDF2-SHA-256 key derivation.\nRequires your backup password to decrypt and restore.'
    );

    const zipContent = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    return zipContent;
  }

  /**
   * Previews backup contents without overwriting local databases.
   */
  static async previewBackup(
    fileContent: string,
    backupPassword: string
  ): Promise<{ preview: RestorePreview; data?: BackupPayload }> {
    try {
      const envelope: EncryptedEnvelope = JSON.parse(fileContent);

      const decrypted = await decryptPayloadFromEnvelope<BackupPayload>(
        envelope,
        backupPassword
      );

      if (decrypted.source !== 'PassVault_Backup_Engine') {
        return {
          preview: {
            valid: false,
            synchronizedCount: 0,
            isolatedCount: 0,
            exportedAt: '',
            error: 'Unrecognized backup file format',
          },
        };
      }

      return {
        preview: {
          valid: true,
          synchronizedCount: decrypted.synchronizedItems?.length || 0,
          isolatedCount: decrypted.isolatedItems?.length || 0,
          exportedAt: decrypted.exportedAt,
        },
        data: decrypted,
      };
    } catch (err: any) {
      return {
        preview: {
          valid: false,
          synchronizedCount: 0,
          isolatedCount: 0,
          exportedAt: '',
          error: 'Incorrect backup password or corrupted backup file',
        },
      };
    }
  }

  /**
   * Restores records from a verified backup payload into the respective partitioned databases.
   */
  static async restoreBackup(data: BackupPayload, preserveExisting = true): Promise<void> {
    if (!preserveExisting) {
      await syncDb.items.clear();
      await isolatedDb.items.clear();
    }

    if (data.synchronizedItems && data.synchronizedItems.length > 0) {
      for (const item of data.synchronizedItems) {
        await syncDb.items.put(item);
      }
    }

    if (data.isolatedItems && data.isolatedItems.length > 0) {
      for (const item of data.isolatedItems) {
        await isolatedDb.items.put(item);
      }
    }
  }
}
