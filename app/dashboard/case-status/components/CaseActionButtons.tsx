"use client";

import { Bell, BellOff, RefreshCw, Trash2, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import Link from 'next/link';
import type { TrackedCase } from '../types';

interface CaseActionButtonsProps {
  trackedCase: TrackedCase;
  isRefreshing: boolean;
  isExpanded: boolean;
  onToggleNotification: () => void;
  onRefresh: () => void;
  onRemove: () => void;
  onToggleExpand: () => void;
  /** 'desktop' shows buttons on hover only; 'mobile' always visible */
  variant?: 'desktop' | 'mobile';
}

export function CaseActionButtons({
  trackedCase,
  isRefreshing,
  isExpanded,
  onToggleNotification,
  onRefresh,
  onRemove,
  onToggleExpand,
  variant = 'desktop',
}: CaseActionButtonsProps) {
  const status = trackedCase.status;

  const caseDetails = status
    ? `${status.case_title || trackedCase.case_name || 'Case'} (CNR: ${trackedCase.cnr_number || 'N/A'}). Status: ${status.status || 'Unknown'}. Next hearing: ${status.next_hearing_date || 'Not scheduled'}. Case stage: ${status.case_stage || 'Unknown'}. Petitioner: ${status.petitioner || 'Not specified'}. Respondent: ${status.respondent || 'Not specified'}. Court: ${status.court_name || 'Unknown'}.`
    : trackedCase.case_name || trackedCase.cnr_number || '';

  const ghost = variant === 'desktop' ? 'opacity-0 group-hover:opacity-100' : '';

  const wrapperCls =
    variant === 'desktop'
      ? 'flex items-center justify-end gap-1'
      : 'flex items-center gap-0.5 flex-shrink-0';

  return (
    <div className={wrapperCls}>
      {/* Notifications */}
      <button
        onClick={onToggleNotification}
        className={`p-1.5 rounded-lg transition-all ${ghost} ${
          trackedCase.notification_enabled
            ? 'text-[var(--accent)] hover:bg-[var(--accent)]/10'
            : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
        }`}
        title={trackedCase.notification_enabled ? 'Notifications on' : 'Notifications off'}
      >
        {trackedCase.notification_enabled
          ? <Bell className="w-3.5 h-3.5" />
          : <BellOff className="w-3.5 h-3.5" />
        }
      </button>

      {/* Refresh */}
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className={`p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg disabled:opacity-50 ${ghost} transition-all`}
        title="Refresh"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>

      {/* Draft Email */}
      <Link
        href={`/dashboard/research-3?draft=email&case=${encodeURIComponent(caseDetails)}`}
        className={`p-1.5 text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg ${ghost} transition-all`}
        title="Research & Draft Client Email"
      >
        <Mail className="w-3.5 h-3.5" />
      </Link>

      {/* Remove */}
      <button
        onClick={onRemove}
        className={`p-1.5 text-red-500 hover:bg-red-50 rounded-lg ${ghost} transition-all`}
        title="Remove"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Expand / Collapse — always visible */}
      <button
        onClick={onToggleExpand}
        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-all"
        title={isExpanded ? 'Collapse' : 'Expand details'}
      >
        {isExpanded
          ? <ChevronUp className="w-4 h-4" />
          : <ChevronDown className="w-4 h-4" />
        }
      </button>
    </div>
  );
}

export default CaseActionButtons;
