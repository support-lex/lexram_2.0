'use client';

import { useEffect, useRef } from 'react';

interface OtpInputProps {
  length?: number;
  value: string[];
  onChange: (digits: string[]) => void;
  onComplete?: (otp: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * 6-digit OTP input with auto-advance, backspace navigation and paste support.
 * Owns no state — the parent holds the digits array so it can read / clear them.
 */
export default function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus = true,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => refs.current[0]?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  const fireCompleteIfFull = (digits: string[]) => {
    if (digits.every((d) => d) && digits.length === length) {
      onComplete?.(digits.join(''));
    }
  };

  const handleChange = (index: number, raw: string) => {
    if (!/^\d*$/.test(raw)) return;
    const char = raw.slice(-1);
    const next = [...value];
    next[index] = char;
    onChange(next);
    if (char && index < length - 1) refs.current[index + 1]?.focus();
    fireCompleteIfFull(next);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < length - 1) refs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    const next = Array(length).fill('');
    pasted.split('').forEach((c, i) => { next[i] = c; });
    onChange(next);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
    fireCompleteIfFull(next);
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          className="w-11 text-center text-xl font-bold rounded-xl border border-[var(--border-default)] bg-white text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)] focus:border-[var(--accent)] transition-all disabled:opacity-50"
          style={{ height: '3.25rem' }}
        />
      ))}
    </div>
  );
}
