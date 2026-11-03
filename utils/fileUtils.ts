
import mammoth from 'mammoth';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // result is in format: "data:<mime_type>;base64,<base64_data>"
      // We need to strip the prefix "data:<mime_type>;base64,"
      if (result && result.includes(',')) {
        const base64String = result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error(`Failed to parse base64 string from file: ${file.name}`));
      }
    };
    reader.onerror = () => {
      const error = reader.error;
      const errorMessage = error?.message || "Unknown FileReader error";
      console.error(`FileReader error reading ${file.name}:`, error);
      reject(new Error(`Failed to read file "${file.name}": ${errorMessage}`));
    };
  });
};

export const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      const error = reader.error;
      const errorMessage = error?.message || "Unknown FileReader error";
      console.error(`FileReader error reading ${file.name}:`, error);
      reject(new Error(`Failed to read text file "${file.name}": ${errorMessage}`));
    };
  });
};

export const readDocxFile = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } catch (error) {
        console.error("Error reading DOCX file:", error);
        throw new Error(`Failed to extract text from Word document: ${file.name}. Please ensure it is a valid .docx file.`);
    }
};
