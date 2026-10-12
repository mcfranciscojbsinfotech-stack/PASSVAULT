'use client';

import React, { useState } from 'react';
import { BackupService, RestorePreview, BackupPayload } from '@/lib/backup-service';
import { useVault } from '@/lib/vault-context';
import {
  HardDriveDownload,
  UploadCloud,
  FileCode,
  FileArchive,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ShieldCheck,
} from 'lucide-react';

export default function BackupsPage() {
  const { credentials, isolatedCredentials, refreshVault } = useVault();

  // Export state
  const [exportPassword, setExportPassword] = useState('');
  const [exportFormat, setExportFormat] = useState<'zip' | 'json'>('zip');
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Restore state
  const [restoreFileContent, setRestoreFileContent] = useState<string | null>(null);
  const [restoreFileName, setRestoreFileName] = useState<string | null>(null);
  const [restorePassword, setRestorePassword] = useState('');
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [previewPayload, setPreviewPayload] = useState<BackupPayload | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preserveExisting, setPreserveExisting] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState('');

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportPassword) return;
    setExporting(true);

    try {
      let blob: Blob;
      let filename: string;
      const dateStr = new Date().toISOString().slice(0, 10);

      if (exportFormat === 'zip') {
        blob = await BackupService.exportEncryptedZipBackup(exportPassword);
        filename = `passvault-backup-${dateStr}.zip`;
      } else {
        blob = await BackupService.exportEncryptedJsonBackup(exportPassword);
        filename = `passvault-backup-${dateStr}.json`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        setExportPassword('');
      }, 3000);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFileName(file.name);
    setPreview(null);
    setPreviewPayload(null);
    setRestoreError('');

    if (file.name.endsWith('.json')) {
      const text = await file.text();
      setRestoreFileContent(text);
    } else if (file.name.endsWith('.zip')) {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(file);
      const jsonFile = zip.file('passvault-backup-encrypted.json');
      if (jsonFile) {
        const text = await jsonFile.async('string');
        setRestoreFileContent(text);
      } else {
        setRestoreError('Invalid ZIP archive: missing passvault-backup-encrypted.json');
      }
    } else {
      setRestoreError('Unsupported backup file extension. Please select a .json or .zip backup.');
    }
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFileContent || !restorePassword) return;

    setPreviewLoading(true);
    setRestoreError('');
    try {
      const { preview: p, data } = await BackupService.previewBackup(
        restoreFileContent,
        restorePassword
      );

      setPreview(p);
      if (data && p.valid) {
        setPreviewPayload(data);
      } else {
        setRestoreError(p.error || 'Failed to decrypt backup preview');
      }
    } catch (err: any) {
      setRestoreError(err.message || 'Error parsing backup');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!previewPayload) return;
    setRestoring(true);
    setRestoreError('');

    try {
      await BackupService.restoreBackup(previewPayload, preserveExisting);
      await refreshVault();
      setRestoreSuccess(true);
      setTimeout(() => {
        setRestoreSuccess(false);
        setPreview(null);
        setPreviewPayload(null);
        setRestoreFileContent(null);
        setRestoreFileName(null);
        setRestorePassword('');
      }, 3000);
    } catch (err: any) {
      setRestoreError(err.message || 'Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Encrypted Backup & Recovery</h1>
        <p className="text-xs text-slate-500 mt-1">
          Export protected archives with PBKDF2 passwords or safely restore previous vaults
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyber-50 text-cyber-600 flex items-center justify-center">
              <HardDriveDownload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Create Encrypted Backup</h2>
              <p className="text-xs text-slate-500">
                Saves {credentials.length + isolatedCredentials.length} total credentials
              </p>
            </div>
          </div>

          {exportSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center space-y-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
              <p className="font-bold">Backup downloaded successfully!</p>
              <p className="text-[11px] text-emerald-700">
                Encrypted with AES-256-GCM and protected with your password.
              </p>
            </div>
          ) : (
            <form onSubmit={handleExport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Backup Archive Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportFormat('zip')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      exportFormat === 'zip'
                        ? 'border-cyber-600 bg-cyber-50 text-cyber-700 ring-2 ring-cyber-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FileArchive className="h-4 w-4" />
                    <span>ZIP Archive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat('json')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      exportFormat === 'json'
                        ? 'border-cyber-600 bg-cyber-50 text-cyber-700 ring-2 ring-cyber-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FileCode className="h-4 w-4" />
                    <span>JSON File</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Set Backup Protection Password
                </label>
                <input
                  type="password"
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  placeholder="Enter a strong password for this backup"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Derives 256-bit AES key via PBKDF2-SHA-256 (600,000 iterations).
                </p>
              </div>

              <button
                type="submit"
                disabled={exporting}
                className="w-full py-2.5 px-4 rounded-xl bg-cyber-600 hover:bg-cyber-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-cyber-600/20 transition-all"
              >
                {exporting ? 'Generating Archive...' : 'Download Encrypted Backup'}
              </button>
            </form>
          )}
        </div>

        {/* Restore Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Restore Vault Backup</h2>
              <p className="text-xs text-slate-500">
                Preview and restore from .zip or .json encrypted backup
              </p>
            </div>
          </div>

          {restoreSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center space-y-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
              <p className="font-bold">Vault restored successfully!</p>
              <p className="text-[11px] text-emerald-700">
                Credentials have been populated into their respective storage partitions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Backup File (.zip or .json)
                </label>
                <input
                  type="file"
                  accept=".json,.zip"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyber-50 file:text-cyber-700 hover:file:bg-cyber-100 cursor-pointer"
                />
                {restoreFileName && (
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">{restoreFileName}</p>
                )}
              </div>

              {restoreFileContent && !preview?.valid && (
                <form onSubmit={handlePreview} className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Backup Password
                    </label>
                    <input
                      type="password"
                      value={restorePassword}
                      onChange={(e) => setRestorePassword(e.target.value)}
                      placeholder="Password entered during backup export"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-cyber-500 focus:outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={previewLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>{previewLoading ? 'Verifying...' : 'Preview Backup Contents'}</span>
                  </button>
                </form>
              )}

              {restoreError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{restoreError}</span>
                </div>
              )}

              {/* Restore Preview Confirmation */}
              {preview?.valid && previewPayload && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Backup Verified: Ready to Restore</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                    <div className="p-2 rounded bg-white border border-slate-200">
                      Synced Items: <strong>{preview.synchronizedCount}</strong>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200">
                      Isolated Items: <strong>{preview.isolatedCount}</strong>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={preserveExisting}
                      onChange={(e) => setPreserveExisting(e.target.checked)}
                      className="rounded text-cyber-600 focus:ring-cyber-500"
                    />
                    <span>Preserve existing credentials (merge)</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleExecuteRestore}
                    disabled={restoring}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm"
                  >
                    {restoring ? 'Restoring Vault...' : 'Confirm and Restore Records'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
