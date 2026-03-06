import { useState, useCallback } from 'react';

export const useTestModals = () => {
  const [isManualTestModalOpen, setIsManualTestModalOpen] = useState(false);
  const [isAITestModalOpen, setIsAITestModalOpen] = useState(false);
  const [isViewTestModalOpen, setIsViewTestModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [testCreationContext, setTestCreationContext] = useState(null);
  const [viewingTest, setViewingTest] = useState(null);
  const [testToDelete, setTestToDelete] = useState(null);

  const openManualTestModal = useCallback((context) => {
    setTestCreationContext(context);
    setIsManualTestModalOpen(true);
  }, []);

  const openAITestModal = useCallback((context) => {
    setTestCreationContext(context);
    setIsAITestModalOpen(true);
  }, []);

  const closeManualTestModal = useCallback(() => {
    setIsManualTestModalOpen(false);
    setTestCreationContext(null);
    setViewingTest(null);
  }, []);

  const closeAITestModal = useCallback(() => {
    setIsAITestModalOpen(false);
    setTestCreationContext(null);
  }, []);

  const openViewTestModal = useCallback((test) => {
    setViewingTest(test);
    setIsViewTestModalOpen(true);
  }, []);

  const closeViewTestModal = useCallback(() => {
    setIsViewTestModalOpen(false);
    setViewingTest(null);
  }, []);

  const openDeleteConfirm = useCallback((testId) => {
    setTestToDelete(testId);
    setIsDeleteConfirmOpen(true);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setIsDeleteConfirmOpen(false);
    setTestToDelete(null);
  }, []);

  return {
    isManualTestModalOpen,
    isAITestModalOpen,
    isViewTestModalOpen,
    isDeleteConfirmOpen,
    testCreationContext,
    viewingTest,
    testToDelete,
    openManualTestModal,
    openAITestModal,
    closeManualTestModal,
    closeAITestModal,
    openViewTestModal,
    closeViewTestModal,
    openDeleteConfirm,
    closeDeleteConfirm,
    setViewingTest,
  };
};

