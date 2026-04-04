'use client';

/**
 * hooks/useContractTemplate.ts
 * Encapsulates all state and logic for the Templates tab in Contracts.
 */

import { useState } from 'react';
import { generateContent } from '@/lib/ai';
import type { ContractTemplate } from '../types';

export function useContractTemplate() {
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [partyA, setPartyA] = useState('');
  const [partyB, setPartyB] = useState('');
  const [keyTerms, setKeyTerms] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedTemplate || !partyA || !partyB) {
      setError('Please fill in all required fields (Party A, Party B).');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const prompt = `Generate a ${selectedTemplate.name} contract between ${partyA} and ${partyB} with these key terms: ${keyTerms || 'Standard terms'}. Make it professional, legally sound, and properly formatted. Use clear legal language.`;
      const response = await generateContent({ prompt, jsonMode: false });
      if (response?.text) {
        setPreview(response.text);
      } else {
        throw new Error('No response received from the AI.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating the contract.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPreview = () => {
    if (!preview || !selectedTemplate) return;
    const blob = new Blob([preview], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetTemplate = () => {
    setSelectedTemplate(null);
    setPartyA('');
    setPartyB('');
    setKeyTerms('');
    setPreview(null);
    setError(null);
  };

  return {
    // State
    selectedTemplate, setSelectedTemplate,
    partyA, setPartyA,
    partyB, setPartyB,
    keyTerms, setKeyTerms,
    isGenerating, preview, error,
    // Actions
    handleGenerate, downloadPreview, resetTemplate,
  };
}
