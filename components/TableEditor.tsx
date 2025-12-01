import React from 'react';
import { CanvasItem } from '../types';
import { SparklesIcon, PlusIcon } from './Icons';
import { generateTableData } from '../services/geminiService';

interface Props {
  item: CanvasItem;
  updateItem: (id: string, content: any, isGenerating?: boolean) => void;
}

export const TableEditor: React.FC<Props> = ({ item, updateItem }) => {
  const data = item.content as string[][];

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...data];
    newData[rowIndex] = [...newData[rowIndex]];
    newData[rowIndex][colIndex] = value;
    updateItem(item.id, newData);
  };

  const addRow = () => {
    const cols = data[0]?.length || 2;
    updateItem(item.id, [...data, Array(cols).fill('')]);
  };

  const addCol = () => {
    const newData = data.map(row => [...row, '']);
    updateItem(item.id, newData);
  };

  const handleAI = async () => {
     const topic = window.prompt("TABLE TOPIC:", "Comparison of Apple, Google, Microsoft");
     if (!topic) return;
     
     updateItem(item.id, data, true);
     const newData = await generateTableData(topic);
     updateItem(item.id, newData, false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative group p-2 bg-white font-['Special_Elite']">
        <div className="flex justify-end mb-2 absolute top-2 right-2 z-10">
             <button 
                onClick={handleAI}
                className="px-2 py-1 text-xs font-bold border border-black hover:bg-black hover:text-white transition-colors flex items-center gap-1 bg-white opacity-0 group-hover:opacity-100"
            >
                <SparklesIcon /> [ FILL_DATA ]
            </button>
        </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar pt-2 px-1">
        <table className="w-full border-collapse text-sm">
          <tbody>
            {data.map((row, rIndex) => (
              <tr key={rIndex}>
                {row.map((cell, cIndex) => (
                  <td key={`${rIndex}-${cIndex}`} className={`
                        border border-neutral-400 p-0 min-w-[100px] relative
                        ${rIndex === 0 ? 'bg-black' : 'bg-white'}
                  `}>
                    <input
                      className={`w-full h-full px-2 py-1 bg-transparent focus:outline-none font-['Special_Elite']
                        ${rIndex===0 ? 'text-center text-white font-bold' : 'text-black'}
                      `}
                      value={cell}
                      onChange={(e) => updateCell(rIndex, cIndex, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 mt-2 pt-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity border-t border-dashed border-neutral-300">
        <button onClick={addRow} className="text-xs flex items-center gap-1 border border-black hover:bg-black hover:text-white px-2 py-1 transition-colors uppercase font-bold">
            <PlusIcon /> Row
        </button>
        <button onClick={addCol} className="text-xs flex items-center gap-1 border border-black hover:bg-black hover:text-white px-2 py-1 transition-colors uppercase font-bold">
            <PlusIcon /> Col
        </button>
      </div>
    </div>
  );
};