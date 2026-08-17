'use client';

/**
 * hooks/useContractCompare.ts
 * Encapsulates all state and logic for the Compare tab in Contracts.
 */

import { useState, useRef } from 'react';
import { generateContent } from '@/lib/ai';
import { extractTextFromFile } from '@/lib/pdf-parser';
import type { CompareResult } from '../types';

export function useContractCompare() {
  const [compareFile1, setCompareFile1] = useState<File | null>(null);
  const [compareFile1Text, setCompareFile1Text] = useState<string | null>(null);
  const [compareFile2, setCompareFile2] = useState<File | null>(null);
  const [compareFile2Text, setCompareFile2Text] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);

  const compareInput1Ref = useRef<HTMLInputElement>(null);
  const compareInput2Ref = useRef<HTMLInputElement>(null);

  const handleFile1Upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setCompareFile1(file);
      const text = await extractTextFromFile(file);
      setCompareFile1Text(text);
    } catch (err: unknown) {
      setCompareError(`Error reading file 1: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleFile2Upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setCompareFile2(file);
      const text = await extractTextFromFile(file);
      setCompareFile2Text(text);
    } catch (err: unknown) {
      setCompareError(`Error reading file 2: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleCompare = async () => {
    if (!compareFile1Text || !compareFile2Text) {
      setCompareError('Please upload both files before comparing.');
      return;
    }
    setIsComparing(true);
    setCompareError(null);
    try {
      const prompt = `Compare these two contracts and provide a detailed analysis. Highlight the key differences between them.

Return ONLY valid JSON in this exact format:
{
  "keyDifferences": ["difference 1", "difference 2", ...],
  "addedClauses": ["clause 1", "clause 2", ...],
  "removedClauses": ["clause 1", "clause 2", ...],
  "modifiedTerms": [{ "term": "string", "original": "string", "revised": "string" }],
  "summary": "brief overall summary of changes"
}

Contract 1 (Original):
${compareFile1Text.substring(0, 5000)}

Contract 2 (Revised):
${compareFile2Text.substring(0, 5000)}`;

      const response = await generateContent({ prompt, jsonMode: true });
      if (response?.text) {
        setCompareResult(JSON.parse(response.text) as CompareResult);
      } else {
        throw new Error('No response received from the AI.');
      }
    } catch (err: unknown) {
      setCompareError(err instanceof Error ? err.message : 'An error occurred while comparing contracts.');
    } finally {
      setIsComparing(false);
    }
  };

  const resetCompare = () => {
    setCompareResult(null);
    setCompareFile1(null);
    setCompareFile2(null);
    setCompareFile1Text(null);
    setCompareFile2Text(null);
    setCompareError(null);
  };

  return {
    // State
    compareFile1, compareFile2, isComparing,
    compareResult, compareError,
    compareInput1Ref, compareInput2Ref,
    // Actions
    handleFile1Upload, handleFile2Upload, handleCompare, resetCompare,
    triggerFile1: () => compareInput1Ref.current?.click(),
    triggerFile2: () => compareInput2Ref.current?.click(),
  };
}
