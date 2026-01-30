'use client';

import { ChangeEvent } from 'react';
import { PROMPT_VALIDATION } from '@/types/prompt';

interface ContentInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ContentInput({
  value,
  onChange,
  disabled = false,
  placeholder = 'Paste your AI prompt here...',
}: ContentInputProps) {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const remainingChars = PROMPT_VALIDATION.maxContentLength - value.length;
  const isNearLimit = remainingChars < 1000;

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full min-h-[300px] p-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-y disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
        maxLength={PROMPT_VALIDATION.maxContentLength}
        aria-label="Prompt content input"
        aria-describedby="char-count"
      />
      <div id="char-count" className="flex justify-between text-sm" aria-live="polite">
        <span className="text-gray-600">
          {value.length.toLocaleString()} characters
        </span>
        {isNearLimit && (
          <span className={`${remainingChars < 100 ? 'text-red-600' : 'text-yellow-600'}`} role="status">
            {remainingChars.toLocaleString()} remaining
          </span>
        )}
      </div>
    </div>
  );
}
