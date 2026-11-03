import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckIcon } from './icons/CheckIcon';

interface FreeMaterialsSelectorProps {
  onAddMaterials: (materialsString: string) => void;
  onClose: () => void;
}

const MATERIALS = [
  { id: 'tv_small', label: 'TV Box (Small)', output: 'SMALL TV BOXES' },
  { id: 'tv_large', label: 'TV Box (Large)', output: 'LARGE TV BOXES' },
  { id: 'dish_box', label: 'Dish Box', output: 'DISH BOXES' },
  { id: 'mattress_bag', label: 'Mattress Bag', output: 'MATTRESS BAGS' },
  { id: 'sofa_cover', label: 'Sofa Cover', output: 'SOFA COVERS' },
  { id: 'bubble_wrap', label: 'Bubble Wrap', output: 'ROLLS OF BUBBLE WRAP' },
  { id: 'mirror_glass', label: 'Mirror / Glass Pack', output: 'MIRROR / GLASS PACKS' },
];

export const FreeMaterialsSelector: React.FC<FreeMaterialsSelectorProps> = ({ onAddMaterials, onClose }) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleIncrement = (id: string) => {
    setQuantities(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleDecrement = (id: string) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      if (current <= 0) return prev;
      return { ...prev, [id]: current - 1 };
    });
  };

  const handleAdd = () => {
    const selected = MATERIALS.filter(m => quantities[m.id] > 0);
    if (selected.length === 0) {
      onClose();
      return;
    }

    const lines = selected.map(m => {
      const qty = quantities[m.id];
      // Handle singular vs plural roughly
      let outputLabel = m.output;
      if (qty === 1) {
        if (outputLabel.endsWith('ES')) outputLabel = outputLabel.slice(0, -2);
        else if (outputLabel.endsWith('S')) outputLabel = outputLabel.slice(0, -1);
      }
      return `- ${qty} ${outputLabel} FREE`;
    });

    onAddMaterials(lines.join('\n'));
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 z-50 overflow-hidden"
    >
      <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-black/40">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Add Free Materials</h3>
      </div>
      <div className="max-h-64 overflow-y-auto p-2">
        {MATERIALS.map(material => (
          <div key={material.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{material.label}</span>
            <div className="flex items-center space-x-3 bg-gray-100 dark:bg-black/50 rounded-lg p-1">
              <button 
                onClick={() => handleDecrement(material.id)}
                className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white dark:hover:bg-white/10 rounded"
              >
                -
              </button>
              <span className="text-sm font-bold w-4 text-center text-gray-800 dark:text-gray-200">
                {quantities[material.id] || 0}
              </span>
              <button 
                onClick={() => handleIncrement(material.id)}
                className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-green-500 hover:bg-white dark:hover:bg-white/10 rounded"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-black/40 flex justify-end space-x-2">
        <button onClick={onClose} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors">
          CANCEL
        </button>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAdd} 
          className="px-3 py-1.5 text-xs font-bold text-white bg-accent-primary hover:bg-accent-primary/90 rounded-lg transition-colors flex items-center"
        >
          <CheckIcon className="w-3 h-3 mr-1" />
          ADD TO NOTES
        </motion.button>
      </div>
    </motion.div>
  );
};
