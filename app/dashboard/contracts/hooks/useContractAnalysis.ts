'use client';

/**
 * hooks/useContractAnalysis.ts
 * Encapsulates all state and logic for the Analyze tab in Contracts.
 */

import { useState, useRef, useEffect } from 'react';
import { generateContent } from '@/lib/ai';
import { extractTextFromFile } from '@/lib/pdf-parser';
import { getStoredData, setStoredData } from '@/lib/storage';
import type { AnalysisResult, SavedContractAnalysis } from '../types';

export function useContractAnalysis() {
  const [isUploaded, setIsUploaded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisTab, setAnalysisTab] = useState('Red Flags');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [savedAnalyses, setSavedAnalyses] = useState<SavedContractAnalysis[]>([]);
  const [amendmentStates, setAmendmentStates] = useState<Map<number, 'accepted' | 'rejected' | null>>(new Map());
  const [showMyContracts, setShowMyContracts] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSavedAnalyses(getStoredData<SavedContractAnalysis[]>('lexram_contract_analyses', []));
  }, []);

  const saveAnalysis = (name: string, result: AnalysisResult) => {
    const entry: SavedContractAnalysis = {
      id: `CA-${Date.now()}`,
      name,
      date: new Date().toISOString(),
      score: result.riskScore,
      result,
    };
    const updated = [entry, ...savedAnalyses].slice(0, 20);
    setSavedAnalyses(updated);
    setStoredData('lexram_contract_analyses', updated);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsAnalyzing(true);
    setIsUploaded(true);
    setError(null);

    try {
      const parsedText = await extractTextFromFile(file);
      const mimeType = file.type || 'application/pdf';

      const ai_prompt = `Analyze this contract. Identify key clauses, red flags (unfair or risky terms), missing standard clauses, and suggest amendments to make it more balanced or favorable.

Respond ONLY with valid JSON in this exact format:
{
  "riskScore": <number 0-100>,
  "riskLevel": "Low Risk" | "Medium Risk" | "High Risk",
  "redFlags": [{ "clause": "string", "issue": "string", "explanation": "string" }],
  "keyClauses": [{ "clause": "string", "summary": "string", "riskLevel": "Low" | "Medium" | "High" }],
  "missingClauses": [{ "name": "string", "explanation": "string" }],
  "suggestedAmendments": [{ "clause": "string", "suggestion": "string", "amendedText": "string" }]
}`;

      const response = await generateContent({
        prompt: ai_prompt,
        jsonMode: true,
        fileData: { text: parsedText, mimeType },
      });

      const resultText = response?.text;
      if (resultText) {
        const parsedResult = JSON.parse(resultText) as AnalysisResult;
        setAnalysisResult(parsedResult);
        saveAnalysis(file.name, parsedResult);
        setAmendmentStates(new Map());
      } else {
        throw new Error('No response received from the AI.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during analysis.';
      setError(msg);
      setIsUploaded(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportAnalysis = () => {
    if (!analysisResult) return;
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><style>body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.8;margin:1in}h1,h2,h3{color:#0F172A}table{border-collapse:collapse;width:100%;margin:10px 0}th,td{border:1px solid #E2E8F0;padding:8px;text-align:left}th{background-color:#F1F5F9}</style></head>
<body>
<h1>Contract Analysis Report</h1>
<p><strong>File:</strong> ${fileName}</p>
<p><strong>Risk Score:</strong> ${analysisResult.riskScore}/100 (${analysisResult.riskLevel})</p>
<h2>Red Flags</h2>
<table><tr><th>Clause</th><th>Issue</th><th>Explanation</th></tr>
${analysisResult.redFlags.map(rf => `<tr><td>${rf.clause}</td><td>${rf.issue}</td><td>${rf.explanation}</td></tr>`).join('')}
</table>
<h2>Key Clauses</h2>
<table><tr><th>Clause</th><th>Summary</th><th>Risk Level</th></tr>
${analysisResult.keyClauses.map(kc => `<tr><td>${kc.clause}</td><td>${kc.summary}</td><td>${kc.riskLevel}</td></tr>`).join('')}
</table>
<h2>Missing Clauses</h2>
<table><tr><th>Name</th><th>Explanation</th></tr>
${analysisResult.missingClauses.map(mc => `<tr><td>${mc.name}</td><td>${mc.explanation}</td></tr>`).join('')}
</table>
<h2>Suggested Amendments</h2>
<table><tr><th>Clause</th><th>Suggestion</th><th>Amended Text</th></tr>
${analysisResult.suggestedAmendments.map(sa => `<tr><td>${sa.clause}</td><td>${sa.suggestion}</td><td>${sa.amendedText}</td></tr>`).join('')}
</table>
</body></html>`;
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.[^/.]+$/, '')}_analysis.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAmendmentAction = (index: number, action: 'accepted' | 'rejected' | null) => {
    setAmendmentStates(prev => new Map(prev).set(index, action));
  };

  const loadSavedAnalysis = (doc: SavedContractAnalysis) => {
    setAnalysisResult(doc.result);
    setFileName(doc.name);
    setIsUploaded(true);
    setAmendmentStates(new Map());
    setShowMyContracts(false);
  };

  const resetAnalysis = () => {
    setIsUploaded(false);
    setAnalysisResult(null);
    setError(null);
    setFileName('');
    setAmendmentStates(new Map());
  };

  return {
    // State
    isUploaded, isAnalyzing, analysisTab, setAnalysisTab,
    analysisResult, error, fileName,
    savedAnalyses, amendmentStates,
    showMyContracts, setShowMyContracts,
    fileInputRef,
    // Actions
    handleFileUpload, handleExportAnalysis, handleAmendmentAction,
    loadSavedAnalysis, resetAnalysis,
    triggerFileInput: () => fileInputRef.current?.click(),
  };
}
