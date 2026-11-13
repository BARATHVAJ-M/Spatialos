'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { contentService } from '../services/content.service';

export function useContentAssets() {
  const [contents, setContents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadStep, setUploadStep] = useState<'idle' | 'uploading' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchContents = useCallback(async () => {
    setIsLoading(true);
    const result = await contentService.getAll();
    if (result.ok) {
      setContents(result.value || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  }, []);

  const startUpload = useCallback(async () => {
    if (!selectedFile) return;

    setUploadStep('uploading');
    setErrorMessage('');

    const result = await contentService.upload(selectedFile);
    if (result.ok) {
      setUploadStep('completed');
      fetchContents();
    } else {
      setErrorMessage(result.error.message || 'Upload failed');
      setUploadStep('error');
    }
  }, [selectedFile, fetchContents]);

  const resetUpload = useCallback(() => {
    setShowUploadModal(false);
    setUploadStep('idle');
    setSelectedFile(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const deleteContent = useCallback(async (id: string) => {
    const result = await contentService.delete(id);
    if (result.ok) {
      setContents(prev => prev.filter(c => c.id !== id));
      return true;
    }
    return false;
  }, []);

  const filteredContents = contents.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = item.name || item.url || '';
    return name.toLowerCase().includes(q);
  });

  return {
    contents: filteredContents,
    rawContents: contents,
    isLoading,
    searchQuery,
    setSearchQuery,
    showUploadModal,
    setShowUploadModal,
    uploadStep,
    setUploadStep,
    errorMessage,
    selectedFile,
    setSelectedFile,
    fileInputRef,
    handleFileChange,
    startUpload,
    resetUpload,
    deleteContent,
    refresh: fetchContents,
  };
}
