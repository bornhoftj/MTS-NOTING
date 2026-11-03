
import React, { useState, useEffect } from 'react';

const LoadingMessages = [
  "Calibrating synthesis engine...",
  "Parsing phonetic data...",
  "Weaving informational threads...",
  "Constructing knowledge codex...",
];

interface ProcessingAnimationProps {
  message: string;
}

const ArcReactor: React.FC = () => (
  <div className="relative w-32 h-32">
    <div className="absolute inset-0 rounded-full border-2 border-accent-primary/30 animate-[spin_10s_linear_infinite]"></div>
    <div className="absolute inset-2 rounded-full border-2 border-accent-primary/40 animate-[spin_8s_linear_infinite_reverse]"></div>
    <div className="absolute inset-4 rounded-full border-2 border-accent-primary/60 animate-[spin_6s_linear_infinite]"></div>
    <div className="absolute inset-6 rounded-full bg-accent-primary/10 animate-pulse"></div>
    <div className="absolute inset-10 rounded-full bg-accent-primary/80 shadow-[0_0_20px_theme('colors.accent-glow')]"></div>
     <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
  </div>
);


export const ProcessingAnimation: React.FC<ProcessingAnimationProps> = ({ message }) => {
    const [currentMessage, setCurrentMessage] = useState(message || LoadingMessages[0]);
    
    useEffect(() => {
        if (!message) {
            const interval = setInterval(() => {
                setCurrentMessage(prev => {
                    const currentIndex = LoadingMessages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % LoadingMessages.length;
                    return LoadingMessages[nextIndex];
                });
            }, 2500);
            return () => clearInterval(interval);
        } else {
             setCurrentMessage(message);
        }
    }, [message]);

    return (
        <div className="flex flex-col items-center justify-center text-center w-full animate-fade-in-stagger">
            <ArcReactor />
            <p className="mt-6 text-lg text-text-muted transition-all duration-500">{currentMessage}</p>
        </div>
    );
};
