
import React from 'react';
import { XCircleIcon } from './icons/XCircleIcon';

interface ErrorMessageProps {
  message: string;
  onClear?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClear }) => {
  if (!message) return null;

  return (
    <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-fade-in-stagger" role="alert">
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800/50 rounded-lg shadow-lg flex items-start justify-between glass-surface" style={{'--surface-bg': 'rgba(255, 235, 238, 0.7)', '--surface-bg-dark': 'rgba(127, 29, 29, 0.3)'} as React.CSSProperties}>
            <div className="flex items-start">
                <XCircleIcon className="w-6 h-6 mr-3 text-red-500 dark:text-red-400 flex-shrink-0" />
                <span className="text-sm font-medium">{message}</span>
            </div>
            {onClear && (
                <button
                onClick={onClear}
                className="ml-4 p-1 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200 rounded-full hover:bg-red-200/50 dark:hover:bg-red-800/50 transition-colors"
                aria-label="Clear error message"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                </button>
            )}
        </div>
    </div>
  );
};
