
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { CalendarPlusIcon } from './icons/CalendarPlusIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { PencilIcon } from './icons/PencilIcon';
import { CheckIcon } from './icons/CheckIcon';
import { FreeMaterialsSelector } from './FreeMaterialsSelector';

interface NoteDisplayProps {
  notes: string;
  editedNotes: string;
  onNotesChange: (newNotes: string) => void;
  onToast: (msg: string) => void;
  initialQuoteNumber?: string;
}

// --- Helpers for Extraction ---

const provinceMap: Record<string, string> = {
  "ALBERTA": "AB",
  "BRITISH COLUMBIA": "BC",
  "MANITOBA": "MB",
  "NEW BRUNSWICK": "NB",
  "NEWFOUNDLAND": "NL",
  "LABRADOR": "NL",
  "NOVA SCOTIA": "NS",
  "ONTARIO": "ON",
  "PRINCE EDWARD ISLAND": "PE",
  "QUEBEC": "QC",
  "SASKATCHEWAN": "SK",
  "NORTHWEST TERRITORIES": "NT",
  "NUNAVUT": "NU",
  "YUKON": "YT"
};

const getOperationalBriefing = (fullNotes: string): string => {
  const lines = fullNotes.split('\n');
  // Look for clean header first, fallback to bold if legacy
  const start = lines.findIndex(line => line.trim().startsWith('## Operational Briefing') || line.trim().includes('**Operational Briefing:**'));
  if (start === -1) return "";
  
  const nextHeaders = [
      "## Action Items",
      "## Pain Points",
      "## Customer Pain Points",
      "## Checklist",
      "## Call Summary",
      "## Sentiment Analysis",
      "## CALENDAR TITLE DETAILS",
      "**Action Items:**", // Legacy fallback
      "**Customer Pain Points:**" // Legacy fallback
  ];
  
  let end = lines.findIndex((line, idx) => {
      if (idx <= start) return false;
      const trimmed = line.trim();
      return nextHeaders.some(h => trimmed.startsWith(h));
  });
  
  if (end === -1) end = lines.length;
  
  return lines.slice(start + 1, end).join('\n').trim();
};

const getChecklistNotes = (fullNotes: string): string => {
  const lines = fullNotes.split('\n');
  const start = lines.findIndex(line => line.trim().startsWith('## Checklist') || line.trim().includes('**Checklist:**'));
  if (start === -1) return "";
  
  const nextHeaders = [
      "## Action Items",
      "## Pain Points",
      "## Customer Pain Points",
      "## Call Summary",
      "## Sentiment Analysis",
      "## CALENDAR TITLE DETAILS",
  ];
  
  let end = lines.findIndex((line, idx) => {
      if (idx <= start) return false;
      const trimmed = line.trim();
      return nextHeaders.some(h => trimmed.startsWith(h));
  });
  
  if (end === -1) end = lines.length;
  
  return lines.slice(start + 1, end).join('\n').trim();
};

const extractCalendarDetail = (notes: string, detailName: string, defaultValue: string = "N/A"): string => {
  // Support new clean format (##) and legacy format (**)
  const calendarSectionRegex = /(?:##\s*CALENDAR TITLE DETAILS|(?:\*\*CALENDAR TITLE DETAILS:\*\*))\s*([\s\S]*?)(?=\n##|\n\*\*CALENDAR TITLE DETAILS END\*\*|\n\*\*|$)/i;
  const calendarSectionMatch = notes.match(calendarSectionRegex);
  
  if (calendarSectionMatch && calendarSectionMatch[1]) {
    const sectionContent = calendarSectionMatch[1];
    const escapedName = detailName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Regex to match "- Key: Value" or "Key: Value", allowing for optional bolding and extra text before colon
    const detailRegex = new RegExp(`^\\s*(?:-\\s*)?(?:\\*\\*)?${escapedName}.*?:\\s*(.*)$`, "im");
    
    const match = sectionContent.match(detailRegex);
    if (match && match[1]) {
        const value = match[1].trim();
        // Cleanup any lingering asterisks from the value itself
        const cleanValue = value.replace(/\*\*/g, '').trim();
        if (cleanValue && cleanValue.toLowerCase() !== '(n/a)') return cleanValue;
    }
  }
  return defaultValue;
};

const formatLocation = (locationString: string, defaultCity: string = "N/A_CITY", defaultProv: string = "N/A_PROV"): string => {
  // Clean input
  let cleanLoc = locationString.replace(/\*\*/g, '');
  
  if (cleanLoc.toLowerCase().includes("n/a") || !cleanLoc.includes(',')) {
    const cityPart = cleanLoc.includes("N/A") ? defaultCity : cleanLoc.split(',')[0].trim();
    const provPart = cleanLoc.includes("N/A") ? defaultProv : "";
    return `${cityPart.toUpperCase()}${provPart ? `(${provPart.toUpperCase()})` : ""}`;
  }
  
  const parts = cleanLoc.split(',');
  let city = (parts[0] || defaultCity).trim().toUpperCase();
  let province = (parts[1] || defaultProv).trim().toUpperCase();

  if (provinceMap[province]) {
    province = provinceMap[province];
  }

  return `${city}(${province})`;
};

const formatWeight = (weightString: string): string => {
  if (!weightString || weightString.toLowerCase().includes("n/a")) return "N/A";
  let weight = weightString.toLowerCase().replace(/lbs|pounds/gi, '').replace(/\*\*/g, '').trim();
  if (weight.match(/^\d+(\.\d+)?k$/i)) return weight.toUpperCase();
  const num = parseFloat(weight);
  if (!isNaN(num)) {
    if (num >= 1000) {
      const kValue = num / 1000;
      return (kValue % 1 === 0 ? kValue.toFixed(0) : kValue.toFixed(1)) + 'K';
    }
    return String(num);
  }
  return weightString.toUpperCase();
};

const getCalendarTitle = (notes: string, quoteNumber: string): string => {
  const customerFirstNameRaw = extractCalendarDetail(notes, "Customer First Name", "CUSTOMER");
  const customerFirstName = customerFirstNameRaw.includes("N/A") ? "CUSTOMER" : customerFirstNameRaw.toUpperCase();
  
  const estimatedWeightRaw = extractCalendarDetail(notes, "Estimated Weight", "N/A");
  const estimatedWeight = formatWeight(estimatedWeightRaw);
  
  const pickupLocationRaw = extractCalendarDetail(notes, "Pickup Location", "N/A, N/A");
  const pickupLocation = formatLocation(pickupLocationRaw, "P/U?", "?");
  
  const deliveryLocationRaw = extractCalendarDetail(notes, "Delivery Location", "N/A, N/A");
  const deliveryLocation = formatLocation(deliveryLocationRaw, "D/L?", "?");
  
  // Format: AHMAD (26890) 5.2K P/U BRAMPTON(ON) TO RED DEER(AB)
  return `${customerFirstName} (${quoteNumber}) ${estimatedWeight} P/U ${pickupLocation} TO ${deliveryLocation}`;
};

// --- Components ---

const DataCard: React.FC<{ label: string; value: string; icon?: React.ReactNode; highlight?: boolean }> = ({ label, value, icon, highlight }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02, y: -2 }}
    className={`flex flex-col p-3 rounded-xl border backdrop-blur-sm transition-colors ${highlight ? 'bg-accent-primary/10 border-accent-primary/30 shadow-[0_0_15px_rgba(140,29,29,0.15)]' : 'bg-white/40 dark:bg-black/40 border-white/50 dark:border-white/10'}`}
  >
    <div className="flex items-center text-xs font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-1">
      {icon && <span className="mr-1.5">{icon}</span>}
      {label}
    </div>
    <div className={`text-lg font-bold truncate ${highlight ? 'text-accent-primary' : 'text-text-main dark:text-text-main-dark'}`} title={value}>
      {value}
    </div>
  </motion.div>
);

const AccordionSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; sentiment?: 'positive'|'negative'|'neutral' }> = ({ title, children, defaultOpen = true, sentiment }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  let borderColor = "border-white/20 dark:border-white/10";
  if (sentiment === 'positive') borderColor = "border-green-400/30 dark:border-green-500/30";
  if (sentiment === 'negative') borderColor = "border-red-400/30 dark:border-red-500/30";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-surface rounded-xl mb-4 transition-colors duration-300 holographic-border overflow-hidden ${borderColor} ${isOpen ? 'bg-white/40 dark:bg-black/40' : 'bg-white/20 dark:bg-black/20'}`}
    >
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 text-left hover:bg-white/20 dark:hover:bg-zinc-900/20 transition-colors">
        <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark uppercase tracking-wide flex items-center">
            {sentiment === 'negative' && <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />}
            {title}
        </h3>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDownIcon className="w-5 h-5 text-text-muted dark:text-text-muted-dark" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: "auto" },
              collapsed: { opacity: 0, height: 0 }
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="p-4 pt-0 text-text-main dark:text-text-main-dark text-sm leading-relaxed">
                {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const NoteDisplay: React.FC<NoteDisplayProps> = ({ notes, editedNotes, onNotesChange, onToast, initialQuoteNumber }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [quoteNumber, setQuoteNumber] = useState(initialQuoteNumber || "");
  const [isMaterialsSelectorOpen, setIsMaterialsSelectorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'briefing' | 'checklist' | 'call_log'>('briefing');

  const safeEditedNotes = editedNotes || "";
  const titleRaw = getCalendarTitle(safeEditedNotes, quoteNumber);
  const weight = formatWeight(extractCalendarDetail(safeEditedNotes, "Estimated Weight"));
  const puLoc = formatLocation(extractCalendarDetail(safeEditedNotes, "Pickup Location"), "TBD");
  const dlLoc = formatLocation(extractCalendarDetail(safeEditedNotes, "Delivery Location"), "TBD");
  const customerName = extractCalendarDetail(safeEditedNotes, "Customer First Name", "Unknown");
  
  // Sentiment (Handles clean ## header or legacy **)
  const sentimentSection = safeEditedNotes.match(/(?:##|\*\*)\s*Sentiment Analysis(?:\s*\(Overall\))?:?\s*(.*)/i);
  const sentimentText = sentimentSection ? sentimentSection[1].toLowerCase() : "";
  const isNegative = sentimentText.includes("negative") || sentimentText.includes("concerned") || sentimentText.includes("worried");
  const isPositive = sentimentText.includes("positive") || sentimentText.includes("relieved");

  // --- Render Logic ---
  const formattedContent = (content: string, isChecklist = false) => {
    return content.split('\n').map((line, index) => {
      if (!line.trim()) return null;

      const lowerLine = line.toLowerCase();
      const isImportant = lowerLine.includes("fragile") || lowerLine.includes("urgent") || lowerLine.includes("warning") || lowerLine.includes("promise");
      const isCritical = lowerLine.includes("critical");

      // Clean line of markdown asterisks for display
      const cleanLine = line.replace(/^\s*-\s*/, '').replace(/\*\*/g, '');

      if (line.trim().startsWith('- ')) {
        // Smart Bolding for Key: Value pairs
        const keyMatch = cleanLine.match(/^([^:]+):\s*(.*)$/);
        
        if (isChecklist) {
            // Enhanced visual emphasis for YES, NO, MAYBE in checklists
            let valueContent = keyMatch ? keyMatch[2] : cleanLine;
            let formattedValue = <span dangerouslySetInnerHTML={{ __html: valueContent }} />;
            
            if (keyMatch) {
               const valLower = valueContent.toLowerCase();
               if (valLower.startsWith('no')) {
                   formattedValue = <span><strong className="text-red-600 dark:text-red-400 font-bold uppercase">NO</strong>{valueContent.substring(2)}</span>;
               } else if (valLower.startsWith('yes')) {
                   formattedValue = <span><strong className="text-green-600 dark:text-green-400 font-bold uppercase">YES</strong>{valueContent.substring(3)}</span>;
               } else if (valLower.startsWith('maybe')) {
                   formattedValue = <span><strong className="text-yellow-600 dark:text-yellow-400 font-bold uppercase">MAYBE</strong>{valueContent.substring(5)}</span>;
               }
            } else if (cleanLine.startsWith('PU ')) {
               formattedValue = <span><strong className="text-blue-600 dark:text-blue-400 font-bold">PU</strong>{cleanLine.substring(2)}</span>;
            } else if (cleanLine.startsWith('DL ')) {
               formattedValue = <span><strong className="text-purple-600 dark:text-purple-400 font-bold">DL</strong>{cleanLine.substring(2)}</span>;
            }

            return (
                <div key={index} className={`flex items-start mb-2 p-2 rounded-lg transition-colors hover:bg-white/40 dark:hover:bg-white/5 ${isImportant ? 'bg-red-50/50 dark:bg-red-900/20' : ''}`}>
                    <input type="checkbox" className="mt-1 mr-3 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-accent-primary focus:ring-accent-primary cursor-pointer flex-shrink-0" />
                    <span className={isImportant ? 'font-medium text-red-800 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}>
                        {keyMatch ? (
                             <span><strong className="font-bold text-gray-900 dark:text-gray-100">{keyMatch[1]}:</strong> {formattedValue}</span>
                        ) : (
                             <span>{formattedValue}</span>
                        )}
                    </span>
                </div>
            );
        }
        
        return (
            <li key={index} className={`mb-1 pl-2 border-l-2 ${isImportant ? 'border-red-400 bg-red-50/30 dark:bg-red-900/10' : 'border-gray-300 dark:border-gray-600'} py-1`}>
                {keyMatch ? (
                     <span className="text-gray-800 dark:text-gray-200">
                        <strong className={`font-bold ${isCritical ? 'text-red-600 dark:text-red-400 uppercase' : 'text-gray-900 dark:text-gray-100'}`}>{keyMatch[1]}:</strong> {keyMatch[2]}
                     </span>
                ) : (
                    <span dangerouslySetInnerHTML={{ __html: cleanLine }} />
                )}
            </li>
        );
      }
      
      return <p key={index} className="my-1 text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: cleanLine }} />;
    });
  };

  const handleCopy = (text: string, label: string) => {
    if (!text.trim()) return;
    navigator.clipboard.writeText(text).then(() => {
      onToast(`${label} copied!`);
    }).catch(err => console.error('Failed to copy: ', err));
  };

  // Split by "## " or legacy "**" 
  const sections = safeEditedNotes.split(/\n(?=## |(?:\*\*(?!.*End\*\*)))/g).filter(s => s.trim() !== '').map(section => {
    // Clean title extraction for ## and **
    let title = 'Note';
    let content = section;
    
    if (section.trim().startsWith('##')) {
        const firstLineEnd = section.indexOf('\n');
        if (firstLineEnd !== -1) {
            title = section.substring(0, firstLineEnd).replace(/##\s*/, '').trim();
            content = section.substring(firstLineEnd).trim();
        } else {
            title = section.replace(/##\s*/, '').trim();
            content = "";
        }
    } else {
        const match = section.match(/\*\*(.*?)\*\*/);
        if (match) {
             title = match[1].replace(':', '');
             content = section.replace(/\*\*(.*?)\*\*\n?/, '').trim();
        }
    }

    return { title, content };
  });

  const handleCreateCalendarEvent = (useChecklist: boolean = false) => {
    let details = "";
    if (useChecklist) {
      const checklistSection = sections.find(s => s.title.toUpperCase().includes("CHECKLIST"));
      
      if (checklistSection) {
        details += `## ${checklistSection.title}\n${checklistSection.content}`;
      }
      details = details.trim();
    } else {
      details = getOperationalBriefing(safeEditedNotes);
    }

    const pickupLocationRaw = extractCalendarDetail(safeEditedNotes, "Pickup Location", "");
    const moveDateRaw = extractCalendarDetail(safeEditedNotes, "Tentative Move Date", "N/A");

    let locationParam = "";
    // Clean location param
    const cleanPickup = pickupLocationRaw.replace(/\*\*/g, '');
    if (cleanPickup && !cleanPickup.includes("N/A")) {
         locationParam = `&location=${encodeURIComponent(cleanPickup)}`;
    }

    let datesParam = "";
    const dateRegex = /(\d{4})-(\d{2})-(\d{2})/;
    const match = moveDateRaw.match(dateRegex);
    
    if (match) {
        // Enforce 2026 year for all calendar events
        const year = 2026;
        const month = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        
        const startDate = new Date(year, month, day);
        const endDate = new Date(year, month, day);
        endDate.setDate(endDate.getDate() + 1); 

        const formatDate = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dt = String(d.getDate()).padStart(2, '0');
            return `${y}${m}${dt}`;
        }

        datesParam = `&dates=${formatDate(startDate)}/${formatDate(endDate)}`;
    }

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titleRaw)}&details=${encodeURIComponent(details)}${locationParam}${datesParam}`;
    window.open(calendarUrl, '_blank', 'noopener,noreferrer');
    onToast("Opening Google Calendar...");
  };

  const handleAddFreeMaterials = (materialsString: string) => {
    // Find the Operational Briefing section and append materials to it
    const rawSections = safeEditedNotes.split(/\n(?=## |(?:\*\*(?!.*End\*\*)))/g);
    
    let updated = false;
    const newSections = rawSections.map(section => {
      if (section.toLowerCase().includes("operational briefing")) {
        updated = true;
        return section.trim() + '\n' + materialsString + '\n';
      }
      return section;
    });

    let newNotes = newSections.join('\n');
    
    // Fallback if Operational Briefing section wasn't found
    if (!updated) {
      newNotes = safeEditedNotes.trim() + '\n\n' + materialsString;
    }

    onNotesChange(newNotes);
    onToast("Free materials added to Operational Briefing");
  };

  return (
    <div className="w-full h-full flex flex-col">
      
      {/* --- Header / Toolbar --- */}
      <div className="flex justify-between items-center mb-6 px-1">
        <div className="flex items-center space-x-3">
             <div className={`w-2 h-12 rounded-full ${isNegative ? 'bg-red-500 shadow-[0_0_10px_red]' : isPositive ? 'bg-green-500 shadow-[0_0_10px_lime]' : 'bg-accent-primary shadow-[0_0_10px_rgba(140,29,29,0.8)]'}`}></div>
             <div>
                 <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight">Mission Control</h2>
                 <p className="text-xs text-text-muted dark:text-text-muted-dark font-medium">MOVER TECHNICAL SYNTHESIS SYSTEM</p>
             </div>
        </div>
        <div className="flex items-center space-x-2 bg-white/30 dark:bg-black/30 p-1.5 rounded-xl border border-white/40 dark:border-white/10 shadow-sm relative">
            <button 
                onClick={() => setIsMaterialsSelectorOpen(!isMaterialsSelectorOpen)} 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isMaterialsSelectorOpen ? 'bg-accent-primary text-white' : 'text-text-muted dark:text-text-muted-dark hover:text-accent-primary hover:bg-white dark:hover:bg-zinc-900/50'}`}
                title="Add Free Materials"
            >
                + FREE MATERIALS
            </button>
            {isMaterialsSelectorOpen && (
                <FreeMaterialsSelector 
                    onAddMaterials={handleAddFreeMaterials} 
                    onClose={() => setIsMaterialsSelectorOpen(false)} 
                />
            )}
            <div className="w-px h-6 bg-gray-300/50 dark:bg-gray-600/50 mx-1"></div>
            <input
                type="text"
                placeholder="Quote #"
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                className="w-28 p-2 text-sm bg-white/40 dark:bg-black/40 border border-white/40 dark:border-white/10 rounded-lg text-text-main dark:text-text-main-dark placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 text-center font-medium placeholder:text-xs"
            />
            <div className="w-px h-6 bg-gray-300/50 dark:bg-gray-600/50 mx-1"></div>
            <button onClick={() => { setIsEditing(!isEditing); if (isEditing) onNotesChange(safeEditedNotes); }} className="p-2 rounded-lg text-text-muted dark:text-text-muted-dark hover:text-accent-primary hover:bg-white dark:hover:bg-zinc-900/50 transition-all" title={isEditing ? 'Save' : 'Edit'}>
                {isEditing ? <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400"/> : <PencilIcon className="w-5 h-5"/>}
            </button>
            <div className="w-px h-6 bg-gray-300/50 dark:bg-gray-600/50 mx-1"></div>
            <button onClick={() => handleCreateCalendarEvent(false)} className="p-2 rounded-lg text-text-muted dark:text-text-muted-dark hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all" title="Create Event">
                <CalendarPlusIcon className="w-5 h-5" />
            </button>
            <button onClick={() => handleCopy(titleRaw, 'Calendar Title')} className="p-2 rounded-lg text-text-muted dark:text-text-muted-dark hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all" title="Copy Title">
                <CalendarDaysIcon className="w-5 h-5" />
            </button>
            <button onClick={() => handleCopy(safeEditedNotes, 'Full Notes')} className="p-2 rounded-lg text-text-muted dark:text-text-muted-dark hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 transition-all" title="Copy Body">
                <ClipboardIcon className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* --- Quick Stats Grid --- */}
      {!isEditing && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
           <DataCard label="Customer" value={customerName} />
           <DataCard label="Est. Weight" value={weight} highlight={weight !== "N/A"} />
           <DataCard label="Origin" value={puLoc} />
           <DataCard label="Destination" value={dlLoc} />
        </motion.div>
      )}
      
      {/* --- Main Content Area --- */}
      {isEditing ? (
        <textarea
          value={safeEditedNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full flex-grow p-6 font-mono text-sm bg-white/60 dark:bg-black/60 border border-white/60 dark:border-white/10 rounded-xl shadow-inner focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary outline-none resize-none backdrop-blur-md text-text-main dark:text-text-main-dark"
        />
      ) : (
        <div className="flex-grow flex flex-col min-h-0">
          <div className="flex space-x-2 mb-4">
            <button 
              onClick={() => setActiveTab('briefing')} 
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'briefing' ? 'bg-accent-primary text-white shadow-md' : 'bg-white/40 dark:bg-black/40 text-text-muted dark:text-text-muted-dark hover:bg-white/60 dark:hover:bg-black/60'}`}
            >
              Briefing & Notes
            </button>
            <button 
              onClick={() => setActiveTab('call_log')} 
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'call_log' ? 'bg-accent-primary text-white shadow-md' : 'bg-white/40 dark:bg-black/40 text-text-muted dark:text-text-muted-dark hover:bg-white/60 dark:hover:bg-black/60'}`}
            >
              Call Log
            </button>
            <button 
              onClick={() => setActiveTab('checklist')} 
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'checklist' ? 'bg-accent-primary text-white shadow-md' : 'bg-white/40 dark:bg-black/40 text-text-muted dark:text-text-muted-dark hover:bg-white/60 dark:hover:bg-black/60'}`}
            >
              Checklist
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto pr-2 space-y-1 pb-10">
            {activeTab === 'briefing' && sections.map((section, index) => {
               if (section.title.toUpperCase().includes("CALENDAR TITLE") || section.title.toUpperCase().includes("CHECKLIST") || section.title.toUpperCase().includes("CALL LOG")) return null;
               
               const isChecklist = section.title.includes("Action Items") || section.title.includes("Next Steps");
               const isRisks = section.title.includes("Pain Points") || section.title.includes("Concerns");
               const sentiment = isRisks ? 'negative' : (section.title.includes("Briefing") ? 'neutral' : undefined);
               
               return (
                  <AccordionSection key={index} title={section.title} sentiment={sentiment} defaultOpen={!section.title.includes("Sentiment")}>
                      {isChecklist ? (
                          <div className="flex flex-col">
                              {formattedContent(section.content, true)}
                          </div>
                      ) : (
                          <ul className="space-y-1">
                              {formattedContent(section.content)}
                          </ul>
                      )}
                  </AccordionSection>
               )
            })}

            {activeTab === 'call_log' && (
              <div className="flex flex-col h-full">
                {sections.map((section, index) => {
                  if (section.title.toUpperCase().includes("CALL LOG")) {
                    return (
                      <div key={index} className="glass-surface rounded-xl p-6 border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/40 mb-4 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-300 dark:border-white/10 pb-2">
                            <h3 className="text-lg font-bold text-text-main dark:text-text-main-dark uppercase tracking-wide">
                              Call Log History
                            </h3>
                            <button onClick={() => handleCopy(section.content, 'Call Log')} className="p-2 inset-y-0 rounded-lg text-text-muted dark:text-text-muted-dark hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 transition-all font-bold tracking-tight text-xs flex items-center" title="Copy Call Log">
                                <ClipboardIcon className="w-4 h-4 mr-2" /> COPY TEXT
                            </button>
                        </div>
                        <div className="space-y-3 flex-grow overflow-y-auto">
                          {formattedContent(section.content)}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}

            {activeTab === 'checklist' && (
              <div className="flex flex-col h-full">
                <button 
                  onClick={() => handleCreateCalendarEvent(true)}
                  className="mb-6 w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center transition-all transform hover:scale-[1.02]"
                >
                  <CalendarPlusIcon className="w-8 h-8 mr-3" />
                  <span className="text-xl tracking-wide">ADD TO CALENDAR</span>
                </button>
                
                {sections.map((section, index) => {
                  if (section.title.toUpperCase().includes("CHECKLIST")) {
                    return (
                      <div key={index} className="glass-surface rounded-xl p-6 border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/40 mb-4">
                        <h3 className="text-lg font-bold text-text-main dark:text-text-main-dark uppercase tracking-wide mb-4 border-b border-gray-300 dark:border-white/10 pb-2">
                          Booking Checklist
                        </h3>
                        <div className="space-y-3">
                          {formattedContent(section.content)}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
