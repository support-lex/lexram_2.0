'use client';

/**
 * hooks/useModalForm.ts
 *
 * Generic reusable hook for managing modal open/close state together with
 * a form data object.  Eliminates the repeated pattern of:
 *   const [showXModal, setShowXModal] = useState(false);
 *   const [formData, setFormData] = useState(initialData);
 *
 * Usage:
 *   const { isOpen, formData, open, close, update, reset } = useModalForm({
 *     title: '', description: '',
 *   });
 */

import { useState, useCallback } from 'react';

export function useModalForm<T extends Record<string, unknown>>(initialData: T) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<T>(initialData);

  const open = useCallback((prefill?: Partial<T>) => {
    if (prefill) setFormData({ ...initialData, ...prefill });
    else setFormData(initialData);
    setIsOpen(true);
  }, [initialData]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const reset = useCallback(() => {
    setFormData(initialData);
    setIsOpen(false);
  }, [initialData]);

  const update = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateMany = useCallback((partial: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...partial }));
  }, []);

  return { isOpen, formData, open, close, reset, update, updateMany, setFormData };
}
