import { syncDb, LocalVaultRecord } from './db';
import { apiRequest } from './api-client';
import { SyncPushItem, SyncPullItem } from '@passvault/shared';

export interface SyncResult {
  success: boolean;
  pushedCount: number;
  pulledCount: number;
  conflicts: string[];
  error?: string;
  timestamp: string;
}

export class SyncService {
  /**
   * Performs zero-knowledge bidirectional synchronization.
   * STRICT GUARANTEE: Interacts exclusively with syncDb. Never reads or uploads from isolatedDb.
   */
  static async performSync(): Promise<SyncResult> {
    const timestamp = new Date().toISOString();

    try {
      // 1. Gather pending/updated items ONLY from syncDb
      const localRecords = await syncDb.items.toArray();

      const pushItems: SyncPushItem[] = localRecords.map((r) => ({
        itemId: r.id,
        encryptedPayload: JSON.stringify(r.envelope),
        revision: r.revision,
        isDeleted: r.isDeleted,
        clientUpdatedAt: r.clientUpdatedAt,
      }));

      // Push to cloud if we have local items
      let pushedCount = 0;
      let conflicts: string[] = [];

      if (pushItems.length > 0) {
        const pushResponse = await apiRequest<{
          success: boolean;
          createdCount: number;
          updatedCount: number;
          conflicts: string[];
        }>('/sync/push', {
          method: 'POST',
          body: JSON.stringify({ items: pushItems }),
        });

        pushedCount = pushResponse.createdCount + pushResponse.updatedCount;
        conflicts = pushResponse.conflicts || [];
      }

      // 2. Pull remote updates from cloud
      const pullResponse = await apiRequest<{
        items: SyncPullItem[];
        serverTime: string;
      }>('/sync/pull');

      let pulledCount = 0;

      for (const remoteItem of pullResponse.items) {
        const local = await syncDb.items.get(remoteItem.itemId);

        // Update local sync store if remote has newer revision or local does not exist
        if (!local || remoteItem.revision > local.revision) {
          try {
            const envelope = JSON.parse(remoteItem.encryptedPayload);
            const record: LocalVaultRecord = {
              id: remoteItem.itemId,
              storageMode: 'synchronized',
              envelope,
              revision: remoteItem.revision,
              isDeleted: remoteItem.isDeleted,
              clientUpdatedAt: remoteItem.clientUpdatedAt,
              createdAt: local?.createdAt || remoteItem.clientUpdatedAt,
            };

            await syncDb.items.put(record);
            pulledCount++;
          } catch (err) {
            console.error(`Failed to apply remote synced item ${remoteItem.itemId}:`, err);
          }
        }
      }

      return {
        success: true,
        pushedCount,
        pulledCount,
        conflicts,
        timestamp,
      };
    } catch (err: any) {
      return {
        success: false,
        pushedCount: 0,
        pulledCount: 0,
        conflicts: [],
        error: err.message || 'Synchronization failed',
        timestamp,
      };
    }
  }
}
