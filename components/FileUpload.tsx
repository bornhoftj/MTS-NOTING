
import React, { useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
  onFileChange: (files: File[] | null) => void;
  disabled?: boolean;
  uploadedFiles?: File[];
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, disabled, uploadedFiles }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (uploadedFiles && uploadedFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [uploadedFiles]);

  const handleFileSelection = useCallback((selectedFileList: FileList | null) => {
    if (selectedFileList && selectedFileList.length > 0) {
      const allowedExtensions = ['.docx', '.doc', '.pdf', '.txt', '.md'];
      const allowedTypes = [
        'audio/',
        'text/',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ];

      const allowedFiles = Array.from(selectedFileList).filter(file => {
        const typeMatch = allowedTypes.some(type => file.type.startsWith(type));
        const extensionMatch = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        return typeMatch || extensionMatch;
      });

      if (allowedFiles.length > 0) {
        onFileChange(allowedFiles);
      } else {
        onFileChange(null);
        alert("Please select valid files: Audio, Text, Word documents, or PDFs.");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  }, [onFileChange]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(event.target.files);
  };
  
  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  return (
    <>
      <input 
        ref={fileInputRef} 
        id="file-upload" 
        type="file" 
        accept="audio/*,text/plain,text/markdown,.txt,.md,.docx,.doc,application/pdf" 
        multiple 
        onChange={handleInputChange} 
        className="hidden" 
        disabled={disabled} 
      />
      <motion.button
        whileHover={!disabled ? { scale: 1.05, rotate: 5 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        onClick={openFileDialog}
        disabled={disabled}
        className="w-20 h-20 button-etched rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Upload files"
      >
        <UploadIcon className="w-8 h-8"/>
      </motion.button>
    </>
  );
};
