
import React, { useState, useCallback, useRef, useReducer, DragEvent, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { motion, AnimatePresence } from 'motion/react';
import { FileUpload } from './components/FileUpload';
import { NoteDisplay } from './components/NoteDisplay';
import { FunFactLoader } from './components/FunFactLoader';
import { ErrorMessage } from './components/ErrorMessage';
import { generateNotesFromFiles, generateSpecificInfoFromFiles } from './services/geminiService';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { ArrowPathIcon } from './components/icons/ArrowPathIcon';
import { ChatQuery } from './components/ChatQuery';
import { UploadIcon } from './components/icons/UploadIcon';
import { MoonIcon } from './components/icons/MoonIcon';
import { SunIcon } from './components/icons/SunIcon';

type Status = 'idle' | 'processing' | 'success' | 'error';
type Query = {
  text: string;
  answer: string;
  isLoading: boolean;
  error: string | null;
};

interface State {
  status: Status;
  uploadedFiles: File[];
  processedInitialAudios: File[] | null;
  generatedNotes: string | null;
  editedNotes: string | null;
  error: string | null;
  queries: Query[];
  processingMessage: string;
}

type Action =
  | { type: 'START_PROCESSING'; message: string }
  | { type: 'PROCESSING_SUCCESS'; notes: string; processedAudios: File[] }
  | { type: 'PROCESSING_ERROR'; error: string }
  | { type: 'SET_UPLOADED_FILES'; files: File[] }
  | { type: 'RESET' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'START_QUERY'; queryText: string }
  | { type: 'QUERY_SUCCESS'; queryText: string; answer: string }
  | { type: 'QUERY_ERROR'; queryText: string; error: string }
  | { type: 'UPDATE_EDITED_NOTES'; notes: string };

const initialState: State = {
  status: 'idle',
  uploadedFiles: [],
  processedInitialAudios: null,
  generatedNotes: null,
  editedNotes: null,
  error: null,
  queries: [],
  processingMessage: 'Analyzing files...',
};

function appReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_PROCESSING':
      return { ...state, status: 'processing', processingMessage: action.message, error: null };
    case 'PROCESSING_SUCCESS':
      return { ...state, status: 'success', generatedNotes: action.notes, editedNotes: action.notes, processedInitialAudios: action.processedAudios, error: null };
    case 'PROCESSING_ERROR':
      return { ...state, status: 'error', error: action.error };
    case 'SET_UPLOADED_FILES':
      return { ...state, uploadedFiles: action.files };
    case 'RESET':
      return initialState;
    case 'CLEAR_ERROR':
       return { ...state, error: null, status: state.generatedNotes ? 'success' : 'idle' };
    case 'START_QUERY':
      return { ...state, queries: [...state.queries, { text: action.queryText, answer: '', isLoading: true, error: null }] };
    case 'QUERY_SUCCESS':
      return {
        ...state,
        queries: state.queries.map(q => q.text === action.queryText ? { ...q, answer: action.answer, isLoading: false } : q)
      };
    case 'QUERY_ERROR':
      return {
        ...state,
        queries: state.queries.map(q => q.text === action.queryText ? { ...q, error: action.error, isLoading: false } : q)
      };
    case 'UPDATE_EDITED_NOTES':
      return { ...state, editedNotes: action.notes };
    default:
      return state;
  }
}

// --- Toast Component ---
const Toast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-stagger">
            <div className="bg-gray-900/90 text-white px-6 py-3 rounded-full shadow-2xl backdrop-blur-md flex items-center border border-white/10">
                <SparklesIcon className="w-4 h-4 text-accent-primary mr-3" />
                <span className="text-sm font-medium">{message}</span>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isDragging, setIsDragging] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [quoteNumber, setQuoteNumber] = useState("");

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  const showToast = (msg: string) => setToastMessage(msg);

  const handleFileChange = useCallback((files: File[] | null) => {
    dispatch({ type: 'SET_UPLOADED_FILES', files: files || [] });
  }, []);

  const processFilesForNotes = async (sources: File[]) => {
    const message = "Extracting Intelligence...";
    dispatch({ type: 'START_PROCESSING', message });

    try {
      const notes = await generateNotesFromFiles(sources);
      dispatch({ type: 'PROCESSING_SUCCESS', notes, processedAudios: sources });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      dispatch({ type: 'PROCESSING_ERROR', error: errorMessage });
    }
  };

  const handleGenerateNotes = () => {
    if (state.uploadedFiles.length > 0) {
      processFilesForNotes(state.uploadedFiles);
    }
  };
  
  const handleSpecificQuerySubmit = async (queryText: string) => {
    if (!state.processedInitialAudios || !queryText.trim()) return;
    dispatch({ type: 'START_QUERY', queryText });
    try {
      const result = await generateSpecificInfoFromFiles(state.processedInitialAudios, queryText);
      dispatch({ type: 'QUERY_SUCCESS', queryText, answer: result });
    } catch (err) {
      const error = err instanceof Error ? err.message : "An unknown error occurred.";
      dispatch({ type: 'QUERY_ERROR', queryText, error });
    }
  };

  const handleReset = () => {
    setQuoteNumber("");
    dispatch({ type: 'RESET' });
    dispatch({ type: 'SET_UPLOADED_FILES', files: [] });

    // Try to reset the actual file input since state alone doesn't clear the input's visual value if there is one on the dom though we use a custom uploader, we may want to be safe here. Or just leave it as the state reset will trickle down to the child component
  };
  
  const canGenerate = state.uploadedFiles.length > 0;

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const allowedExtensions = ['.docx', '.doc', '.pdf', '.txt', '.md'];
      const allowedFiles = Array.from(files).filter((file: File) => {
        const isAudio = file.type.startsWith('audio/');
        const isText = file.type.startsWith('text/');
        const isDoc = file.type === 'application/pdf' || 
                      file.type.includes('wordprocessingml') || 
                      file.type === 'application/msword' ||
                      allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        return isAudio || isText || isDoc;
      });

      if (allowedFiles.length > 0) {
        handleFileChange(allowedFiles);
      } else {
        alert("No valid audio, document, or text files dropped.");
      }
    }
  };

  const renderContent = () => {
    return (
      <AnimatePresence mode="wait">
        {state.status === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full h-full"
          >
            <FunFactLoader />
          </motion.div>
        )}

        {state.status === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full h-full flex flex-col"
          >
            {/* Fixed Height Note Display */}
            <div className="flex-grow min-h-0 relative">
                <div className="absolute inset-0 overflow-y-auto pr-2 scrollbar-hide">
                    <NoteDisplay
                        notes={state.generatedNotes!}
                        editedNotes={state.editedNotes!}
                        onNotesChange={(newNotes) => dispatch({ type: 'UPDATE_EDITED_NOTES', notes: newNotes })}
                        onToast={showToast}
                        initialQuoteNumber={quoteNumber}
                    />
                </div>
            </div>
            
            {/* Bottom Control Bar */}
            <div className="flex-shrink-0 pt-4 mt-4 border-t border-white/20 dark:border-white/10 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-end">
               {/* Left: New Session */}
               <div className="order-3 lg:order-1 flex justify-center lg:justify-start">
                   <button onClick={handleReset} className="text-text-muted dark:text-text-muted-dark hover:text-text-main dark:hover:text-text-main-dark flex items-center text-sm px-4 py-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-colors">
                      <ArrowPathIcon className="w-4 h-4 mr-2" />
                      New Session
                  </button>
               </div>

               {/* Center: Chat */}
               <div className="order-1 lg:order-2 w-full">
                  <ChatQuery
                    onQuerySubmit={handleSpecificQuerySubmit}
                    queries={state.queries}
                    disabled={!state.processedInitialAudios}
                  />
               </div>
               
               {/* Right Spacer for balance */}
               <div className="hidden lg:block order-3"></div>
            </div>
          </motion.div>
        )}

        {(state.status === 'idle' || state.status === 'error') && (
           <motion.div
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full flex flex-col items-center justify-center text-center relative z-10"
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
           >
                {isDragging && (
                  <div className="absolute inset-0 bg-accent-primary/5 backdrop-blur-sm border-2 border-dashed border-accent-primary rounded-3xl flex flex-col items-center justify-center z-20 pointer-events-none animate-pulse">
                      <UploadIcon className="w-16 h-16 text-accent-primary mb-4" />
                      <p className="text-xl font-bold text-accent-primary tracking-wide">Drop intelligence files here</p>
                  </div>
                )}
                
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="mb-12"
                >
                    <div className="inline-flex items-center justify-center p-4 bg-accent-primary/10 dark:bg-accent-primary/20 rounded-full mb-6 ring-1 ring-accent-primary/30 shadow-[0_0_30px_rgba(140,29,29,0.2)]">
                        <SparklesIcon className="w-10 h-10 text-accent-primary" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-text-main dark:text-text-main-dark mb-4 tracking-tight">MTS Noting Pro</h1>
                    <p className="text-text-muted dark:text-text-muted-dark text-lg font-light">Advanced Moving Logistics Synthesis</p>
                </motion.div>

                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="my-10 flex flex-col items-center justify-center space-y-8 w-full max-w-2xl"
                >
                    <div className="w-full max-w-xs relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-primary to-red-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
                        <input
                            type="text"
                            placeholder="Enter Quote Number (Optional)"
                            value={quoteNumber}
                            onChange={(e) => setQuoteNumber(e.target.value)}
                            className="relative w-full p-4 text-center bg-white/80 dark:bg-black/60 border border-gray-300 dark:border-white/10 rounded-xl text-text-main dark:text-text-main-dark focus:ring-2 focus:ring-accent-primary focus:outline-none placeholder-gray-500 dark:placeholder-gray-400 font-medium shadow-sm transition-all"
                        />
                    </div>
                    
                    <div className="flex items-center justify-center space-x-12 w-full">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex flex-col items-center space-y-4 group">
                             <FileUpload onFileChange={handleFileChange} uploadedFiles={state.uploadedFiles} />
                             <span className="text-xs font-bold tracking-widest text-text-muted dark:text-text-muted-dark group-hover:text-accent-primary dark:group-hover:text-accent-primary transition-colors">UPLOAD FILES</span>
                        </motion.div>
                    </div>
                </motion.div>
                
                <div className="h-12 flex items-center justify-center">
                    {state.uploadedFiles.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 py-2 bg-white/50 dark:bg-black/50 rounded-full border border-white/60 dark:border-white/10 shadow-sm">
                            <p className="text-sm text-text-main dark:text-text-main-dark font-medium">{state.uploadedFiles.length} file(s) ready for analysis.</p>
                        </motion.div>
                    )}
                </div>

                {canGenerate && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="mt-8 w-full text-center"
                >
                    <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 6px 25px rgba(140,29,29,0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGenerateNotes}
                    className="px-10 py-4 bg-accent-primary text-white font-bold rounded-2xl shadow-[0_4px_20px_rgba(140,29,29,0.3)] transition-all flex items-center justify-center mx-auto text-lg"
                    >
                    <SparklesIcon className="w-6 h-6 mr-2 animate-pulse" />
                    Initialize Synthesis
                    </motion.button>
                </motion.div>
                )}
           </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 md:p-8 selection:bg-accent-primary/30 selection:text-text-main overflow-hidden relative">
      
      {/* Watermark Logo */}
      <div className="absolute bottom-8 right-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none z-0 flex flex-col items-end select-none">
        <svg width="300" height="120" viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Red Arrow Background */}
          <path d="M0 0H100L150 80L100 160H0L50 80L0 0Z" fill="currentColor" />
          {/* White Maple Leaf (simplified) */}
          <path d="M75 40L80 55L95 50L85 65L100 75L85 80L90 95L75 85L60 95L65 80L50 75L65 65L55 50L70 55L75 40Z" fill="var(--aether-bg)" className="dark:fill-[#121212]" />
          {/* MTS Text */}
          <text x="160" y="100" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="100" fill="currentColor" fontStyle="italic" letterSpacing="-5">MTS</text>
          {/* Horizontal Cut Line */}
          <rect x="150" y="65" width="250" height="8" fill="var(--aether-bg)" className="dark:fill-[#121212]" />
          {/* Subtitle */}
          <text x="15" y="145" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="24" fill="currentColor" letterSpacing="2">MOVING AND STORAGE INC.</text>
        </svg>
      </div>

      {/* Dark Mode Toggle */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/50 dark:bg-black/30 border border-black/5 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-300 z-50 text-text-main dark:text-text-main-dark"
        aria-label="Toggle Dark Mode"
      >
        {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
      </button>

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      {state.status === 'error' && <ErrorMessage message={state.error!} onClear={() => dispatch({ type: 'CLEAR_ERROR' })} />}
      
      <main className={`glass-surface holographic-border rounded-3xl flex flex-col items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] relative overflow-hidden
        ${state.status === 'success' ? 'w-full max-w-6xl h-[92vh] p-6 md:p-8' : 'w-full max-w-2xl h-auto min-h-[600px] p-10'}
        `}
      >
        {/* Background Decorative Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-40 dark:opacity-60 pointer-events-none">
             <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent-primary/20 rounded-full blur-3xl animate-pulse-glow"></div>
             <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-red-900/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
        </div>

        {renderContent()}
      </main>
    </div>
  );
};

export default App;
