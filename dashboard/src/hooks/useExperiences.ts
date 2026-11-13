'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Experience } from '../types/api';
import { experiencesService } from '../services/experiences.service';

export function useExperiences() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedQrExp, setSelectedQrExp] = useState<any>(null);

  const fetchExperiences = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await experiencesService.getAll();
    if (result.ok) {
      setExperiences(result.value);
    } else {
      setError(result.error.message);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]);

  const deleteExperience = useCallback(async (id: string): Promise<boolean> => {
    const result = await experiencesService.delete(id);
    if (result.ok) {
      setExperiences(prev => prev.filter(exp => exp.id !== id));
      return true;
    } else {
      setError(result.error.message);
      return false;
    }
  }, []);

  const filteredExperiences = useMemo(() => {
    if (!searchQuery.trim()) return experiences;
    const q = searchQuery.toLowerCase();
    return experiences.filter(exp => 
      exp.name.toLowerCase().includes(q) ||
      (exp.place?.name && exp.place.name.toLowerCase().includes(q)) ||
      (exp.type && exp.type.toLowerCase().includes(q))
    );
  }, [experiences, searchQuery]);

  return {
    experiences: filteredExperiences,
    rawExperiences: experiences,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedQrExp,
    setSelectedQrExp,
    deleteExperience,
    refresh: fetchExperiences,
  };
}
