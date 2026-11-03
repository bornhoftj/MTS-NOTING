
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

type Query = {
  text: string;
  answer: string;
  isLoading: boolean;
  error: string | null;
};

interface ChatQueryProps {
  onQuerySubmit: (queryText: string) => void;
  queries: Query[];
  disabled?: boolean;
}

export const ChatQuery: React.FC<ChatQueryProps> = ({ onQuerySubmit, queries, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
    }
  }, [queries, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentQuery.trim() && !disabled) {
      onQuerySubmit(currentQuery.trim());
      setCurrentQuery('');
    }
  };

  const isQuerying = queries.some(q => q.isLoading);

  if (!isOpen) {
    return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl mx-auto"
        >
             <motion.button 
                whileHover={!disabled ? { scale: 1.02 } : {}}
                whileTap={!disabled ? { scale: 0.98 } : {}}
                onClick={() => setIsOpen(true)} 
                className="w-full button-etched py-3 rounded-lg flex items-center justify-center text-sm"
                disabled={disabled}
             >
                <ChatBubbleIcon className="w-5 h-5 mr-2" />
                Ask a Follow-up Question
            </motion.button>
        </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="h-full flex flex-col glass-surface holographic-border rounded-xl p-4 max-w-xl mx-auto w-full" 
      style={{'--surface-bg': 'rgba(255, 255, 255, 0.4)', '--surface-bg-dark': 'rgba(10, 10, 10, 0.4)'} as React.CSSProperties}
    >
       <div className="flex justify-between items-center mb-3 flex-shrink-0">
         <h3 className="text-lg font-semibold text-text-main dark:text-text-main-dark">Nexus Q&A</h3>
         <button onClick={() => setIsOpen(false)} className="p-1 text-text-muted dark:text-text-muted-dark hover:text-accent-primary transition-colors">
            <ChevronDownIcon className="w-6 h-6" />
         </button>
       </div>
      <div className="flex-grow overflow-y-auto pr-2 space-y-4 h-64">
        {queries.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex items-center justify-center">
            <p className="text-center text-text-muted dark:text-text-muted-dark text-sm p-4">Ask about the audio content. e.g., "What was the customer's main concern?"</p>
          </motion.div>
        )}
        <AnimatePresence>
          {queries.map((q, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* User Query */}
              <div className="flex justify-end">
                <p className="max-w-[80%] bg-accent-primary text-white p-2.5 rounded-xl rounded-br-none text-sm font-medium shadow-md shadow-accent-primary/20">{q.text}</p>
              </div>
              {/* AI Response */}
              <div className="mt-2 flex justify-start">
                 <div className="max-w-[80%]">
                    {q.isLoading ? (
                        <div className="inline-block bg-gray-200/80 dark:bg-white/10 p-2.5 rounded-xl rounded-bl-none text-sm text-text-muted dark:text-text-muted-dark">
                            <div className="flex items-center space-x-1.5">
                                <span className="w-2 h-2 bg-text-muted dark:bg-text-muted-dark rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-text-muted dark:bg-text-muted-dark rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-text-muted dark:bg-text-muted-dark rounded-full animate-pulse"></span>
                            </div>
                        </div>
                    ) : q.error ? (
                        <p className="text-sm text-red-700 dark:text-red-400 p-2.5 bg-red-100/80 dark:bg-red-900/30 rounded-xl rounded-bl-none">Error: {q.error}</p>
                    ) : (
                        <p className="inline-block bg-gray-200/80 dark:bg-white/10 p-2.5 rounded-xl rounded-bl-none text-sm whitespace-pre-wrap text-text-main dark:text-text-main-dark">{q.answer}</p>
                    )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="mt-4 flex items-center space-x-2 flex-shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={currentQuery}
          onChange={(e) => setCurrentQuery(e.target.value)}
          placeholder={disabled ? "Process audio first..." : "Ask a question..."}
          className="flex-grow p-3 bg-white/50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-lg shadow-inner text-sm focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors placeholder-text-muted dark:placeholder-text-muted-dark text-text-main dark:text-text-main-dark outline-none"
          disabled={disabled || isQuerying}
        />
        <motion.button
          whileHover={(!isQuerying && !disabled && currentQuery.trim()) ? { scale: 1.05 } : {}}
          whileTap={(!isQuerying && !disabled && currentQuery.trim()) ? { scale: 0.95 } : {}}
          type="submit"
          disabled={disabled || isQuerying || !currentQuery.trim()}
          className="p-3 bg-accent-primary hover:opacity-80 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:shadow-none text-white font-bold rounded-lg shadow-[0_0_15px_theme('colors.accent-glow')] transition-all duration-200 ease-in-out h-[46px] w-[46px] flex items-center justify-center"
          aria-label="Submit question"
        >
          {isQuerying ? (
             <SparklesIcon className="w-6 h-6 animate-pulse" />
          ) : (
            <PaperAirplaneIcon className="w-6 h-6" />
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};
