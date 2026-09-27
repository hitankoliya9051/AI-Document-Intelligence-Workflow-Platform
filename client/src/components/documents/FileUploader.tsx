'use client';

import React, { useState, useRef } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { formatBytes } from '../../lib/utils';
import { IFolder } from '../../types';
import { Upload, X, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  folders: IFolder[];
  currentFolderId?: string;
  onUploadSuccess: () => void;
  onClose: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  folders,
  currentFolderId,
  onUploadSuccess,
  onClose,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [targetFolder, setTargetFolder] = useState<string>(currentFolderId || '');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/webp',
  ];

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const validFiles: File[] = [];

    Array.from(files).forEach((f) => {
      if (f.size > 25 * 1024 * 1024) {
        toast(`File "${f.name}" exceeds maximum allowed 25MB limit.`, 'error');
        return;
      }
      validFiles.push(f);
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setProgress(10);

    let successCount = 0;
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        if (targetFolder) {
          formData.append('folderId', targetFolder);
        }

        await api.upload('/documents/upload', formData);
        successCount++;
        setProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }

      toast(
        `Successfully uploaded ${successCount} document${successCount > 1 ? 's' : ''}. Pipeline processing started!`,
        'success'
      );
      onUploadSuccess();
      onClose();
    } catch (err: any) {
      toast(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl glass-dropdown p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Upload Documents</h3>
            <p className="text-xs text-slate-400">
              PDF, DOCX, XLSX, CSV, Images, or TXT (Max 25MB)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-4 border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-purple-200 dark:border-purple-800/80 hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
            Click to upload or drag and drop files here
          </div>
          <div className="text-[11px] text-purple-700 dark:text-purple-300 font-medium mt-1">
            Documents will be automatically parsed, classified, and indexed by AI.
          </div>
        </div>

        {/* Destination folder */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Destination Folder (Optional)
          </label>
          <select
            value={targetFolder}
            onChange={(e) => setTargetFolder(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-purple-50/30 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Root / General Directory</option>
            {folders.map((f) => (
              <option key={f._id} value={f._id}>
                📁 {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-purple-50/50 dark:bg-[#160f2a] border border-purple-100 dark:border-purple-900/40 text-xs"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                  <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                    {file.name}
                  </span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 shrink-0 font-mono">
                    ({formatBytes(file.size)})
                  </span>
                </div>
                {!uploading && (
                  <button
                    onClick={() => removeFile(idx)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-purple-700 dark:text-purple-300 font-medium">Uploading and queueing for AI...</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-purple-100 dark:bg-purple-950 overflow-hidden">
              <div
                className="h-full bg-purple-600 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-purple-100 dark:border-purple-900/40">
          <button
            type="button"
            disabled={uploading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={uploading || selectedFiles.length === 0}
            onClick={handleUploadSubmit}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Upload {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
