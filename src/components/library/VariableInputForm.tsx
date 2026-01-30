'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Prompt } from '@/types/prompt';

interface VariableInputFormProps {
  template: Prompt;
  onSubmit: (filledContent: string) => void;
  onCancel: () => void;
}

export default function VariableInputForm({ template, onSubmit, onCancel }: VariableInputFormProps) {
  const extractVariables = (content: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  };

  const variables = extractVariables(template.content);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(variables.map((v) => [v, '']))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let filledContent = template.content;
    Object.entries(values).forEach(([variable, value]) => {
      const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
      filledContent = filledContent.replace(regex, value);
    });
    
    onSubmit(filledContent);
  };

  const allFieldsFilled = variables.every((v) => values[v]?.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/50"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="variable-form-title"
      >
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <h2 id="variable-form-title" className="text-2xl font-bold text-gray-900 mb-1">
              Fill Template Variables
            </h2>
            <p className="text-sm text-gray-600">
              {template.title}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close form"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {variables.map((variable) => (
              <div key={variable}>
                <label
                  htmlFor={`var-${variable}`}
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {variable}
                </label>
                <input
                  id={`var-${variable}`}
                  type="text"
                  value={values[variable]}
                  onChange={(e) => setValues({ ...values, [variable]: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Enter ${variable}`}
                  required
                />
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Preview:</h3>
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-600">
              {Object.entries(values).reduce((content, [variable, value]) => {
                const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
                return content.replace(regex, value || `{{${variable}}}`);
              }, template.content)}
            </pre>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Back
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!allFieldsFilled}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Use Template
          </button>
        </div>
      </motion.div>
    </div>
  );
}
