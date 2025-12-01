import React, { useRef, useEffect, useState } from 'react';
import { CanvasItem, MindMapNodeData } from '../types';
import { SparklesIcon, PlusIcon, MinusIcon } from './Icons';
import { generateMindMap } from '../services/geminiService';

interface Props {
  item: CanvasItem;
  updateItem: (id: string, content: any, isGenerating?: boolean) => void;
}

interface TreeNodeProps { 
    node: MindMapNodeData; 
    path: number[]; 
    onUpdate: (path: number[], val: string) => void; 
    onAddChild: (path: number[]) => void;
    onAddSibling: (path: number[]) => void;
    focusPath: string | null;
}

// Recursive Tree Node Component
const TreeNode: React.FC<TreeNodeProps> = ({ node, path, onUpdate, onAddChild, onAddSibling, focusPath }) => {
  const isRoot = path.length === 0;
  const inputRef = useRef<HTMLInputElement>(null);
  const pathStr = path.join('-');

  // Auto-focus when this node is created via keyboard shortcuts
  useEffect(() => {
    if (focusPath === pathStr && inputRef.current) {
        inputRef.current.focus();
    }
  }, [focusPath, pathStr]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        onAddChild(path);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!isRoot) {
            onAddSibling(path);
        }
    }
  };

  // Base styles for both input and invisible span
  const baseInputStyles = `
    text-sm transition-all text-center select-none font-['Special_Elite']
    ${isRoot 
        ? 'font-bold px-4 py-2 min-w-[140px]' 
        : 'px-2 py-1 min-w-[80px]'
    }
  `;

  // Specific styles for visual appearance
  const visualInputStyles = `
    focus:outline-none bg-transparent w-full h-full
    ${isRoot
        ? 'text-black'
        : 'text-black focus:bg-neutral-100'
    }
  `;

  return (
    <div className="flex items-center font-['Special_Elite']">
      <div className="flex flex-col items-center">
        <div className={`relative group/node flex items-center z-10 ${isRoot ? 'bg-white border-2 border-dashed border-black' : 'bg-white border-b border-black'}`}>
             
             {/* 
                Auto-expanding input hack:
                1. Grid layout places items on top of each other.
                2. Invisible span contains the text and dictates the width.
                3. Input is absolute or centered and fills the width.
             */}
             <div className="inline-grid items-center justify-items-center relative">
                 {/* Invisible Span for Sizing */}
                 <span className={`${baseInputStyles} invisible whitespace-pre border-transparent col-start-1 row-start-1`}>
                     {node.label || (isRoot ? "SUBJECT" : "item...")}
                 </span>
                 
                 {/* Actual Input */}
                 <input
                    ref={inputRef}
                    className={`${baseInputStyles} ${visualInputStyles} col-start-1 row-start-1 absolute inset-0`}
                    value={node.label}
                    onChange={(e) => onUpdate(path, e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isRoot ? "SUBJECT" : "item..."}
                />
             </div>

            <button 
                onClick={() => onAddChild(path)}
                className="absolute -right-6 opacity-0 group-hover/node:opacity-100 p-0.5 border border-black hover:bg-black hover:text-white transition-colors"
                title="Add Child (Tab)"
            >
                <PlusIcon />
            </button>
        </div>
      </div>
      
      {node.children && node.children.length > 0 && (
        <div className="flex items-center">
            {/* Horizontal Line from Parent - Thin Solid Black */}
            <div className="w-8 h-px bg-black"></div>
            
            {/* Children Container */}
            <div className="flex flex-col justify-center">
                {node.children.map((child, idx) => {
                     const isFirst = idx === 0;
                     const isLast = idx === node.children.length - 1;
                     const isSingle = node.children.length === 1;

                    return (
                        <div key={child.id} className="flex items-center relative pl-0">
                            {/* Vertical Line Connector Logic - Thin Solid Black */}
                            <div className={`w-0 border-l border-black absolute left-0 ${
                                isSingle ? 'h-0' : 
                                isFirst ? 'top-1/2 bottom-0 h-1/2' : 
                                isLast ? 'top-0 bottom-1/2 h-1/2' : 'top-0 bottom-0 h-full'
                            }`}></div>

                            {/* Horizontal Line to Child - Thin Solid Black */}
                            <div className="w-6 h-px bg-black my-3"></div>

                            <TreeNode 
                                node={child} 
                                path={[...path, idx]} 
                                onUpdate={onUpdate}
                                onAddChild={onAddChild}
                                onAddSibling={onAddSibling}
                                focusPath={focusPath}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
      )}
    </div>
  );
};

export const MindMapEditor: React.FC<Props> = ({ item, updateItem }) => {
  const rootData = item.content as MindMapNodeData;
  const [focusPath, setFocusPath] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  const updateNode = (path: number[], newLabel: string) => {
    const newData = JSON.parse(JSON.stringify(rootData));
    const updateRecursive = (node: MindMapNodeData, currentPath: number[], depth: number) => {
        if (depth === path.length) {
            node.label = newLabel;
            return;
        }
        updateRecursive(node.children[currentPath[depth]], currentPath, depth + 1);
    };
    
    updateRecursive(newData, path, 0);
    updateItem(item.id, newData);
  };

  const addChild = (path: number[]) => {
      const newData = JSON.parse(JSON.stringify(rootData));
      
      const updateRecursive = (node: MindMapNodeData, currentPath: number[], depth: number) => {
        if (depth === path.length) {
            node.children.push({
                id: Math.random().toString(36).substr(2, 9),
                label: '',
                children: []
            });
            setFocusPath([...path, node.children.length - 1].join('-'));
            return;
        }
        updateRecursive(node.children[currentPath[depth]], currentPath, depth + 1);
      };

      updateRecursive(newData, path, 0);
      updateItem(item.id, newData);
  }

  const addSibling = (path: number[]) => {
      if (path.length === 0) return; 
      const newData = JSON.parse(JSON.stringify(rootData));
      
      const parentPath = path.slice(0, -1);
      const childIndex = path[path.length - 1];

      const updateRecursive = (node: MindMapNodeData, currentPath: number[], depth: number) => {
        if (depth === parentPath.length) {
             node.children.splice(childIndex + 1, 0, {
                 id: Math.random().toString(36).substr(2, 9),
                 label: '',
                 children: []
             });
             setFocusPath([...parentPath, childIndex + 1].join('-'));
             return;
        }
        updateRecursive(node.children[currentPath[depth]], currentPath, depth + 1);
      };

      updateRecursive(newData, parentPath, 0);
      updateItem(item.id, newData);
  };

  const handleAI = async () => {
      const topic = window.prompt("TOPIC:", rootData.label || "Project Planning");
      if (!topic) return;

      updateItem(item.id, rootData, true);
      const newMap = await generateMindMap(topic);
      updateItem(item.id, newMap, false);
      setFocusPath(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
          e.stopPropagation();
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          setScale(s => Math.max(0.1, Math.min(3, s + delta)));
      }
  };

  const zoomIn = () => setScale(s => Math.min(3, s + 0.1));
  const zoomOut = () => setScale(s => Math.max(0.1, s - 0.1));
  const resetZoom = () => setScale(1);

  return (
    <div className="h-full flex flex-col overflow-hidden relative group bg-white" onWheel={handleWheel}>
         <div className="absolute top-3 left-3 z-20">
             <button 
                onClick={handleAI}
                className="px-2 py-1 text-xs font-bold border border-black hover:bg-black hover:text-white transition-colors flex items-center gap-1 bg-white"
            >
                <SparklesIcon /> [ AUTO_MAP ]
            </button>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <button onClick={zoomOut} className="p-1 border border-black hover:bg-black hover:text-white transition-colors bg-white">
                 <MinusIcon />
             </button>
             <button onClick={resetZoom} className="text-xs font-bold border border-black w-12 text-center py-1 bg-white">
                 {Math.round(scale * 100)}%
             </button>
             <button onClick={zoomIn} className="p-1 border border-black hover:bg-black hover:text-white transition-colors bg-white">
                 <PlusIcon />
             </button>
        </div>

        <div className="flex-1 overflow-auto bg-transparent custom-scrollbar relative">
            <div className="min-w-full min-h-full flex items-center justify-center p-12">
                <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center', transition: 'transform 0.1s ease-out' }}>
                    <TreeNode 
                        node={rootData} 
                        path={[]} 
                        onUpdate={updateNode} 
                        onAddChild={addChild} 
                        onAddSibling={addSibling} 
                        focusPath={focusPath}
                    />
                </div>
            </div>
        </div>
    </div>
  );
};