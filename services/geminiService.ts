
import { fileToBase64, readTextFile, readDocxFile } from '../utils/fileUtils'; 

const months = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];
const monthAbbreviations = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec"
];

function extractDateFromFileName(fileName: string): Date | null {
  const name = fileName.toLowerCase();
  
  // 1. Try to find ISO-like date: YYYY-MM-DD or MM-DD-YYYY or DD-MM-YYYY
  const ymdMatch = name.match(/(\d{4})[-_/](\d{1,2})[-_/](\d{1,2})/);
  if (ymdMatch) {
    return new Date(parseInt(ymdMatch[1]), parseInt(ymdMatch[2]) - 1, parseInt(ymdMatch[3]));
  }
  
  const mdyMatch = name.match(/(\d{1,2})[-_/](\d{1,2})[-_/](\d{4})/);
  if (mdyMatch) {
    return new Date(parseInt(mdyMatch[3]), parseInt(mdyMatch[1]) - 1, parseInt(mdyMatch[2]));
  }

  // 2. Try to find MM-DD or MM_DD
  const mdMatch = name.match(/(?:^|[^0-9])(\d{1,2})[-_/](\d{1,2})(?:$|[^0-9])/);
  if (mdMatch) {
    const month = parseInt(mdMatch[1]);
    const day = parseInt(mdMatch[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(2026, month - 1, day); // Assume 2026
    }
  }

  // 3. Try to find Month Name + Day (e.g., June 15, June 15th, Jun 15)
  for (let i = 0; i < months.length; i++) {
    const monthName = months[i];
    const monthAbbrev = monthAbbreviations[i];
    
    const regexStr = `\\b(${monthName}|${monthAbbrev})\\s*([0-9]{1,2})(?:st|nd|rd|th)?\\b`;
    const regex = new RegExp(regexStr, 'i');
    const match = name.match(regex);
    if (match) {
      const day = parseInt(match[2]);
      if (day >= 1 && day <= 31) {
        return new Date(2026, i, day); // Assume 2026
      }
    }
  }

  // 4. Try to find day numbers followed by month name (e.g., 15th June, 15 June)
  for (let i = 0; i < months.length; i++) {
    const monthName = months[i];
    const monthAbbrev = monthAbbreviations[i];
    
    const regexStr = `\\b([0-9]{1,2})(?:st|nd|rd|th)?\\s+(${monthName}|${monthAbbrev})\\b`;
    const regex = new RegExp(regexStr, 'i');
    const match = name.match(regex);
    if (match) {
      const day = parseInt(match[1]);
      if (day >= 1 && day <= 31) {
        return new Date(2026, i, day);
      }
    }
  }

  return null;
}

function sortFilesChronologically(files: File[]): File[] {
  return [...files].sort((a, b) => {
    const dateA = extractDateFromFileName(a.name);
    const dateB = extractDateFromFileName(b.name);
    if (dateA && dateB) {
      return dateA.getTime() - dateB.getTime();
    }
    if (dateA) return -1;
    if (dateB) return 1;
    return a.name.localeCompare(b.name);
  });
}

export const generateNotesFromFiles = async (
  files: File[]
): Promise<string> => {
  if (!files || files.length === 0) {
    throw new Error("No files provided for note generation.");
  }
  try {
    const sorted = sortFilesChronologically(files);
    const parts: any[] = [];
    const fileNames: string[] = sorted.map(file => file.name);

    for (const file of sorted) {
      const fileName = file.name.toLowerCase();
      
      if (file.type.startsWith('audio/')) {
        const base64Audio = await fileToBase64(file);
        const audioMimeType = file.type || 'audio/webm';
        parts.push({ text: `\n\n--- START ATTACHMENT AUDIO RECORDING: "${file.name}" ---\n` });
        parts.push({ inlineData: { mimeType: audioMimeType, data: base64Audio } });
        parts.push({ text: `\n--- END ATTACHMENT AUDIO RECORDING: "${file.name}" ---\n\n` });
      
      } else if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
        const base64Data = await fileToBase64(file);
        parts.push({ text: `\n\n--- START ATTACHMENT PDF DOCUMENT: "${file.name}" ---\n` });
        parts.push({ inlineData: { mimeType: 'application/pdf', data: base64Data } });
        parts.push({ text: `\n--- END ATTACHMENT PDF DOCUMENT: "${file.name}" ---\n\n` });
      
      } else if (file.type.includes('wordprocessingml') || fileName.endsWith('.docx')) {
        try {
            const docText = await readDocxFile(file);
            parts.push({ text: `\n\n--- START CONTENT FROM WORD DOCUMENT: "${file.name}" ---\n${docText}\n--- END CONTENT: "${file.name}" ---\n\n` });
        } catch (e) {
            console.warn(`Failed to read docx ${fileName}, skipping.`, e);
        }

      } else if (file.type.startsWith('text/') || fileName.endsWith('.md') || fileName.endsWith('.txt')) {
        const textContent = await readTextFile(file);
        parts.push({ text: `\n\n--- START CONTENT FROM FILE: "${file.name}" ---\n${textContent}\n--- END CONTENT: "${file.name}" ---\n\n` });
      
      } else {
        if (file.size < 1024 * 1024) { 
           try {
               const textContent = await readTextFile(file);
               parts.push({ text: `\n\n--- START CONTENT FROM UNKNOWN FILE: "${file.name}" ---\n${textContent}\n--- END CONTENT: "${file.name}" ---\n\n` });
           } catch (e) {
               console.warn(`Could not read file ${fileName} as text.`);
           }
        }
      }
    }
    
    if (parts.length === 0) {
        throw new Error("No valid content could be extracted from the provided files.");
    }
    
    const response = await fetch('/api/generate-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ parts, fileNames })
    });

    if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 413 || errorText.includes("413") || errorText.includes("Request Entity Too Large")) {
            throw new Error("The uploaded files are too large. Please upload smaller or fewer files at once.");
        }
        if (response.status === 502 || response.status === 503 || response.status === 504 || errorText.trim().startsWith("<")) {
            throw new Error("The AI service is currently busy or warming up. Please try again in a few moments.");
        }
        let errorData;
        try { errorData = JSON.parse(errorText); } catch { errorData = { error: errorText }; }
        throw new Error(errorData.error || "Failed to generate notes.");
    }

    const responseText = await response.text();
    const trimmed = responseText.trim();

    // Check if the server or gateway returned HTML (e.g. warmup page or proxy error)
    if (trimmed.startsWith("<")) {
      throw new Error("The AI processing service is currently warming up or experiencing high demand. Please try again in a few moments.");
    }

    let data;
    try {
      data = JSON.parse(trimmed);
    } catch {
      throw new Error("Received an unexpected response from the server. Please try again.");
    }
    
    if (data.error) {
       let cleanMsg = String(data.error);
       try {
         const jsonMatch = cleanMsg.match(/\{[\s\S]*\}/);
         if (jsonMatch) {
           const parsedJson = JSON.parse(jsonMatch[0]);
           if (parsedJson?.error?.message) {
             cleanMsg = parsedJson.error.message;
           }
         }
       } catch {
         // Keep original message if parsing fails
       }
       if (cleanMsg.includes("503") || cleanMsg.includes("high demand") || cleanMsg.includes("unavailable")) {
         cleanMsg = "The AI service is currently experiencing high demand. Please try again in a moment.";
       }
       throw new Error(cleanMsg);
    }
    
    return data.result;

  } catch (error: unknown) {
    console.error("Error with Gemini API (Notes):", error);
    if (error instanceof Error) {
        if (error.message.includes("API key")) throw new Error("Invalid Gemini API Key.");
        if (error.message.includes("SAFETY")) throw new Error("Content blocked by safety settings.");
        throw new Error(error.message);
    }
    throw new Error("An unknown error occurred while communicating with the AI service.");
  }
};


export const generateSpecificInfoFromFiles = async (
  initialFiles: File[],
  userQuery: string
): Promise<string> => {
  if (!initialFiles || initialFiles.length === 0) {
      throw new Error("No initial files provided for specific query.");
  }
  try {
    const sorted = sortFilesChronologically(initialFiles);
    const parts: any[] = [];
    for (const file of sorted) {
        const fileName = file.name.toLowerCase();
        
        if (file.type.startsWith('audio/')) {
            const base64Audio = await fileToBase64(file);
            const audioMimeType = file.type || 'audio/webm';
            parts.push({ text: `\n\n--- START ATTACHMENT AUDIO RECORDING: "${file.name}" ---\n` });
            parts.push({ inlineData: { mimeType: audioMimeType, data: base64Audio } });
            parts.push({ text: `\n--- END ATTACHMENT AUDIO RECORDING: "${file.name}" ---\n\n` });
        
        } else if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
             const base64Data = await fileToBase64(file);
             parts.push({ text: `\n\n--- START ATTACHMENT PDF DOCUMENT: "${file.name}" ---\n` });
             parts.push({ inlineData: { mimeType: 'application/pdf', data: base64Data } });
             parts.push({ text: `\n--- END ATTACHMENT PDF DOCUMENT: "${file.name}" ---\n\n` });
        
        } else if (file.type.includes('wordprocessingml') || fileName.endsWith('.docx')) {
             try {
                const docText = await readDocxFile(file);
                parts.push({ text: `\n\n--- START CONTENT FROM WORD DOCUMENT: "${file.name}" ---\n${docText}\n--- END CONTENT: "${file.name}" ---\n\n` });
             } catch (e) {
                 console.warn(`Failed to read docx ${fileName} for query.`, e);
             }

        } else if (file.type.startsWith('text/') || fileName.endsWith('.md') || fileName.endsWith('.txt')) {
            const textContent = await readTextFile(file);
            parts.push({ text: `\n\n--- START CONTENT FROM FILE: "${file.name}" ---\n${textContent}\n--- END CONTENT: "${file.name}" ---\n\n` });
        }
    }
    
    if (parts.length === 0) {
        return "No readable content found in files.";
    }

    const fileNames = sorted.map(file => file.name);

    const response = await fetch('/api/generate-specific', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ parts, userQuery, fileNames })
    });

    if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 413 || errorText.includes("413") || errorText.includes("Request Entity Too Large")) {
            throw new Error("The uploaded files are too large. Please upload smaller or fewer files at once.");
        }
        if (response.status === 502 || response.status === 503 || response.status === 504 || errorText.trim().startsWith("<")) {
            throw new Error("The AI service is currently busy or warming up. Please try again in a few moments.");
        }
        let errorData;
        try { errorData = JSON.parse(errorText); } catch { errorData = { error: errorText }; }
        throw new Error(errorData.error || "Failed to query specific info.");
    }
    
    const responseText2 = await response.text();
    const trimmed2 = responseText2.trim();

    if (trimmed2.startsWith("<")) {
      throw new Error("The AI service is currently warming up or experiencing high demand. Please try again in a few moments.");
    }

    let data;
    try {
      data = JSON.parse(trimmed2);
    } catch {
      throw new Error("Received an unexpected response from the server. Please try again.");
    }
    
    if (data.error) {
       let cleanMsg = String(data.error);
       try {
         const jsonMatch = cleanMsg.match(/\{[\s\S]*\}/);
         if (jsonMatch) {
           const parsedJson = JSON.parse(jsonMatch[0]);
           if (parsedJson?.error?.message) {
             cleanMsg = parsedJson.error.message;
           }
         }
       } catch {
         // Keep original message if parsing fails
       }
       if (cleanMsg.includes("503") || cleanMsg.includes("high demand") || cleanMsg.includes("unavailable")) {
         cleanMsg = "The AI service is currently experiencing high demand. Please try again in a moment.";
       }
       throw new Error(cleanMsg);
    }
    
    return data.result;

  } catch (error: unknown) {
    console.error("Error with Gemini API (Specific Info):", error);
    if (error instanceof Error) {
       if (error.message.includes("Failed to read file")) return `Error: ${error.message}`;
       return `Error: ${error.message}`;
    }
    return "An unknown error occurred.";
  }
};
