'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Place } from '../types/api';
import { placesService } from '../services/places.service';

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedParent, setSelectedParent] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Modals & Drawers State
  const [deletingPlace, setDeletingPlace] = useState<Place | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);

  // Feedback Notification State
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const triggerNotification = useCallback((type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const fetchPlaces = useCallback(async () => {
    setIsLoading(true);
    const result = await placesService.getAll();
    if (result.ok) {
      setPlaces(result.value);
    } else {
      triggerNotification('error', result.error.message || 'Failed to fetch places');
    }
    setIsLoading(false);
  }, [triggerNotification]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const handleRefresh = useCallback(() => {
    fetchPlaces();
    triggerNotification('success', 'Places list synchronized successfully.');
  }, [fetchPlaces, triggerNotification]);

  const handleSaveEdit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlace) return;

    const result = await placesService.update(editingPlace.id, { name: editingPlace.name });
    if (result.ok) {
      setPlaces(prev => prev.map(p => p.id === editingPlace.id ? editingPlace : p));
      setEditingPlace(null);
      triggerNotification('success', `Place "${editingPlace.name}" updated successfully.`);
    } else {
      triggerNotification('error', result.error.message || 'Failed to update place');
    }
  }, [editingPlace, triggerNotification]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingPlace) return;

    if (deleteConfirmationInput.trim() !== deletingPlace.name) {
      triggerNotification('error', 'Confirmation name does not match.');
      return;
    }

    const result = await placesService.delete(deletingPlace.id);
    if (result.ok) {
      setPlaces(prev => prev.filter(p => p.id !== deletingPlace.id));
      setDeletingPlace(null);
      setDeleteConfirmationInput('');
      triggerNotification('success', `Place "${deletingPlace.name}" deleted successfully.`);
    } else {
      triggerNotification('error', result.error.message || 'Failed to delete place');
    }
  }, [deletingPlace, deleteConfirmationInput, triggerNotification]);

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const status = place.status || 'Active';
      const type = place.type || 'Location';
      const parent = place.parentId || '-';

      // Tab Filter
      if (activeTab !== 'all' && status.toLowerCase() !== activeTab) return false;
      
      // Type Filter
      if (selectedType !== 'all' && type.toLowerCase() !== selectedType.toLowerCase()) return false;
      
      // Parent Filter
      if (selectedParent !== 'all' && parent.toLowerCase() !== selectedParent.toLowerCase()) return false;
      
      // Text Search
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          place.name.toLowerCase().includes(query) ||
          (place.qrTargetId && place.qrTargetId.toLowerCase().includes(query)) ||
          type.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [places, activeTab, selectedType, selectedParent, searchQuery]);

  return {
    places: filteredPlaces,
    rawPlaces: places,
    isLoading,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    selectedType,
    setSelectedType,
    selectedParent,
    setSelectedParent,
    showFilters,
    setShowFilters,
    deletingPlace,
    setDeletingPlace,
    deleteConfirmationInput,
    setDeleteConfirmationInput,
    editingPlace,
    setEditingPlace,
    notification,
    triggerNotification,
    handleRefresh,
    handleSaveEdit,
    handleDeleteConfirm,
  };
}
