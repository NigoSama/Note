import React from 'react';
import { CanvasItem } from '../types';
import { SparklesIcon } from './Icons';
import { enhanceText } from '../services/geminiService';

interface Props {
  item: CanvasItem;
  updateItem: (id: string, content: any, isGenerating?: boolean) => void;
}

export const TextEditor: React.FC<Props> = ({ item, updateItem }) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateItem(item.id, e.target.value);
  };

  const handleAI = async () => {
    const prompt = window.prompt("INSTRUCTION:", "Summarize it");
    if (!prompt) return;

    updateItem(item.id, item.content, true);
    const newText = await enhanceText(item.content as string, prompt);
    updateItem(item.id, newText, false);
  };

  return (
    <div className="flex flex-col h-full relative group p-3 bg-white">
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
        <button 
            onClick={handleAI} 
            className="px-2 py-1 text-xs font-bold border border-black hover:bg-black hover:text-white transition-colors flex items-center gap-1 bg-white"
            title="AI Enhance"
        >
            <SparklesIcon /> [ ENHANCE ]
        </button>
      </div>
      <textarea
        className="w-full h-full bg-transparent resize-none focus:outline-none p-1 font-['Special_Elite'] text-neutral-800 text-lg leading-relaxed selection:bg-black selection:text-white"
        value={item.content as string}
        onChange={handleChange}
        placeholder="Type here..."
        style={{ minHeight: '100px' }}
      />
    </div>
  );
};