'use client';

import { useState } from 'react';
import { History } from 'lucide-react';
import { useContractAnalysis } from './hooks/useContractAnalysis';
import { useContractCompare } from './hooks/useContractCompare';
import { useContractTemplate } from './hooks/useContractTemplate';
import { AnalyzeTab } from './components/AnalyzeTab';
import { CompareTab } from './components/CompareTab';
import { TemplateTab } from './components/TemplateTab';

export default function ContractsPage() {
  const [activeTab, setActiveTab] = useState<'Analyze' | 'Compare' | 'Templates'>('Analyze');

  const analysisHook = useContractAnalysis();
  const compareHook = useContractCompare();
  const templateHook = useContractTemplate();

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Top Row: Tabs & My Contracts */}
      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2 bg-[var(--surface-glass)] backdrop-blur-md p-1 rounded-xl border border-[var(--border-default)]/50 shadow-sm">
          {(['Analyze', 'Compare', 'Templates'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                analysisHook.resetAnalysis();
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-[var(--bg-sidebar)] text-[var(--accent)] shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={() => analysisHook.setShowMyContracts(true)}
          className="flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors bg-[var(--surface-glass)] backdrop-blur-md px-3 py-1.5 rounded-lg border border-[var(--border-default)]/50 shadow-sm"
        >
          <History className="w-4 h-4" /> My Contracts
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-24">
        <div className="max-w-[800px] mx-auto w-full animate-in fade-in duration-500">
          {activeTab === 'Analyze' && (
            <AnalyzeTab
              isUploaded={analysisHook.isUploaded}
              isAnalyzing={analysisHook.isAnalyzing}
              analysisTab={analysisHook.analysisTab}
              setAnalysisTab={analysisHook.setAnalysisTab}
              analysisResult={analysisHook.analysisResult}
              error={analysisHook.error}
              fileName={analysisHook.fileName}
              savedAnalyses={analysisHook.savedAnalyses}
              amendmentStates={analysisHook.amendmentStates}
              showMyContracts={analysisHook.showMyContracts}
              setShowMyContracts={analysisHook.setShowMyContracts}
              fileInputRef={analysisHook.fileInputRef}
              handleFileUpload={analysisHook.handleFileUpload}
              handleExportAnalysis={analysisHook.handleExportAnalysis}
              handleAmendmentAction={analysisHook.handleAmendmentAction}
              loadSavedAnalysis={analysisHook.loadSavedAnalysis}
              triggerFileInput={analysisHook.triggerFileInput}
            />
          )}

          {activeTab === 'Compare' && (
            <CompareTab
              compareFile1={compareHook.compareFile1}
              compareFile2={compareHook.compareFile2}
              isComparing={compareHook.isComparing}
              compareResult={compareHook.compareResult}
              compareError={compareHook.compareError}
              compareInput1Ref={compareHook.compareInput1Ref}
              compareInput2Ref={compareHook.compareInput2Ref}
              handleFile1Upload={compareHook.handleFile1Upload}
              handleFile2Upload={compareHook.handleFile2Upload}
              handleCompare={compareHook.handleCompare}
              resetCompare={compareHook.resetCompare}
              triggerFile1={compareHook.triggerFile1}
              triggerFile2={compareHook.triggerFile2}
            />
          )}

          {activeTab === 'Templates' && (
            <TemplateTab
              selectedTemplate={templateHook.selectedTemplate}
              setSelectedTemplate={templateHook.setSelectedTemplate}
              partyA={templateHook.partyA}
              setPartyA={templateHook.setPartyA}
              partyB={templateHook.partyB}
              setPartyB={templateHook.setPartyB}
              keyTerms={templateHook.keyTerms}
              setKeyTerms={templateHook.setKeyTerms}
              isGenerating={templateHook.isGenerating}
              preview={templateHook.preview}
              error={templateHook.error}
              handleGenerate={templateHook.handleGenerate}
              downloadPreview={templateHook.downloadPreview}
              resetTemplate={templateHook.resetTemplate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
