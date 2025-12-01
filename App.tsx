import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CanvasItem, ItemType, Position, NoteMetadata } from './types';
import { TextEditor } from './components/TextEditor';
import { TableEditor } from './components/TableEditor';
import { MindMapEditor } from './components/MindMapEditor';
import { MoveIcon, TextIcon, TableIcon, MindMapIcon, TrashIcon, MenuIcon, ChevronLeftIcon, FileIcon, PlusIcon } from './components/Icons';

function App() {
  // --- Sidebar & Note Management State ---
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notes, setNotes] = useState<NoteMetadata[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  
  // --- Canvas State ---
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const maxZIndex = useRef(1);

  // --- Initialization: Migrate legacy data or load notes list ---
  useEffect(() => {
    try {
      const savedNotesMeta = localStorage.getItem('notes_metadata');
      
      if (savedNotesMeta) {
        const parsedNotes = JSON.parse(savedNotesMeta);
        setNotes(parsedNotes);
        if (parsedNotes.length > 0) {
          setActiveNoteId(parsedNotes[0].id);
        } else {
            createFirstNote();
        }
      } else {
        // Migration Logic: Check for old 'canvas_items'
        const legacyItems = localStorage.getItem('canvas_items');
        if (legacyItems) {
            const firstNoteId = Math.random().toString(36).substr(2, 9);
            const firstNote: NoteMetadata = {
                id: firstNoteId,
                title: 'My First Note',
                updatedAt: Date.now()
            };
            
            // Save metadata
            localStorage.setItem('notes_metadata', JSON.stringify([firstNote]));
            // Save content to new key format
            localStorage.setItem(`note_content_${firstNoteId}`, legacyItems);
            // Clean up old key
            localStorage.removeItem('canvas_items');
            
            setNotes([firstNote]);
            setActiveNoteId(firstNoteId);
        } else {
            createFirstNote();
        }
      }
    } catch (e) {
      console.error("Initialization error", e);
      createFirstNote();
    }
  }, []);

  const createFirstNote = () => {
    // Generate ID manually to avoid dependency on state in useEffect
    const id = Math.random().toString(36).substr(2, 9);
    const newNote: NoteMetadata = {
        id,
        title: 'Untitled Note',
        updatedAt: Date.now()
    };
    setNotes([newNote]);
    localStorage.setItem('notes_metadata', JSON.stringify([newNote]));
    setActiveNoteId(id);
    return id;
  }

  // --- Load Content when Active Note Changes ---
  useEffect(() => {
    if (!activeNoteId) return;

    try {
      const savedContent = localStorage.getItem(`note_content_${activeNoteId}`);
      if (savedContent) {
        const parsed = JSON.parse(savedContent);
        // Reset generating state to avoid stuck spinners
        setItems(parsed.map((item: CanvasItem) => ({ ...item, isGenerating: false })));
        
        // Sync Z-Index
        if (parsed.length > 0) {
            const max = parsed.reduce((acc: number, item: CanvasItem) => Math.max(acc, item.zIndex), 0);
            maxZIndex.current = Math.max(1, max);
        } else {
            maxZIndex.current = 1;
        }
      } else {
        setItems([]);
        maxZIndex.current = 1;
      }
    } catch (e) {
      console.error("Failed to load note content", e);
      setItems([]);
    }
  }, [activeNoteId]);

  // --- Save Content when Items Change ---
  useEffect(() => {
    if (!activeNoteId) return;

    const timer = setTimeout(() => {
      localStorage.setItem(`note_content_${activeNoteId}`, JSON.stringify(items));
      
      // Update timestamp
      setNotes(prev => {
          const updated = prev.map(n => n.id === activeNoteId ? { ...n, updatedAt: Date.now() } : n);
          localStorage.setItem('notes_metadata', JSON.stringify(updated));
          return updated;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [items, activeNoteId]);

  // --- Note Operations ---

  const createNewNote = () => {
      const id = Math.random().toString(36).substr(2, 9);
      const newNote: NoteMetadata = {
          id,
          title: 'Untitled Note',
          updatedAt: Date.now()
      };
      
      const newNotesList = [...notes, newNote];
      setNotes(newNotesList);
      localStorage.setItem('notes_metadata', JSON.stringify(newNotesList));
      setActiveNoteId(id);
      return id;
  };

  const deleteNote = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (!window.confirm("Are you sure you want to delete this note?")) return;

      const newNotes = notes.filter(n => n.id !== id);
      setNotes(newNotes);
      localStorage.setItem('notes_metadata', JSON.stringify(newNotes));
      localStorage.removeItem(`note_content_${id}`);

      if (activeNoteId === id) {
          if (newNotes.length > 0) {
              setActiveNoteId(newNotes[0].id);
          } else {
              createFirstNote();
          }
      }
  };

  const updateNoteTitle = (id: string, newTitle: string) => {
      const newNotes = notes.map(n => n.id === id ? { ...n, title: newTitle } : n);
      setNotes(newNotes);
      localStorage.setItem('notes_metadata', JSON.stringify(newNotes));
  };


  // --- Item Operations ---

  const addItem = useCallback((type: ItemType) => {
    if (!activeNoteId) return; // Guard against no active note

    const id = Math.random().toString(36).substr(2, 9);
    let content: any = "";
    let width = 300;
    let height = 200;

    // Center relative to window, accounting for sidebar
    const x = window.innerWidth / 2 - width / 2 + (Math.random() * 40 - 20) - (sidebarOpen ? 120 : 0);
    const y = window.innerHeight / 2 - height / 2 + (Math.random() * 40 - 20);

    if (type === 'text') {
        content = "";
        width = 280;
        height = 180;
    } else if (type === 'table') {
        content = [["Header 1", "Header 2"], ["", ""]];
        width = 420;
        height = 320;
    } else if (type === 'mindmap') {
        content = { id: 'root', label: 'Central Topic', children: [] };
        width = 600;
        height = 450;
    }

    const newItem: CanvasItem = {
      id,
      type,
      x: Math.max(20, x), // Prevent spawning off-screen left
      y: Math.max(20, y),
      width,
      height,
      zIndex: ++maxZIndex.current,
      content,
    };

    setItems((prev) => [...prev, newItem]);
  }, [activeNoteId, sidebarOpen]);

  const updateItem = (id: string, content: any, isGenerating?: boolean) => {
    setItems((prev) => prev.map(item => item.id === id ? { ...item, content, isGenerating } : item));
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter(item => item.id !== id));
  };

  const bringToFront = (id: string) => {
      setItems(prev => {
          const newZ = ++maxZIndex.current;
          return prev.map(item => item.id === id ? { ...item, zIndex: newZ } : item);
      })
  }

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Use Meta (Cmd) for Mac, Ctrl for Windows
        if (e.metaKey || e.ctrlKey) {
            switch(e.key.toLowerCase()) {
                case 't':
                    e.preventDefault();
                    addItem('text');
                    break;
                case 's':
                    e.preventDefault();
                    addItem('table');
                    break;
                case 'm':
                    e.preventDefault();
                    addItem('mindmap');
                    break;
                default:
                    break;
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addItem]);

  // --- Drag Logic ---
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    bringToFront(id);
    setDraggingId(id);
    const item = items.find((i) => i.id === id);
    if (item) {
      setOffset({
        x: e.clientX - item.x,
        y: e.clientY - item.y,
      });
    }
  };

  const handleCardMouseDown = (e: React.MouseEvent, id: string) => {
      // Smart Drag: Allow dragging from background, but pass interactions to inputs/buttons
      const target = e.target as HTMLElement;
      if (
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.tagName === 'BUTTON' || 
          target.closest('button') ||
          target.closest('.no-drag')
      ) {
          bringToFront(id);
          return;
      }
      handleMouseDown(e, id);
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingId) {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === draggingId) {
            return {
              ...item,
              x: e.clientX - offset.x,
              y: e.clientY - offset.y,
            };
          }
          return item;
        })
      );
    }
  }, [draggingId, offset]);

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
          addItem('text');
      }
  }

  return (
    <div 
        className="w-full h-screen overflow-hidden bg-[#f0e6d2] relative text-black flex font-['Special_Elite']"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
    >
        {/* --- Sidebar --- */}
        <div 
            className={`
                flex-shrink-0 h-full bg-[#f0e6d2] border-r border-dashed border-black transition-all duration-300 ease-in-out z-[60] flex flex-col relative
                ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0 pointer-events-none'}
            `}
        >
            <div className="p-4 border-b border-dashed border-black flex items-center justify-between">
                <span className="font-bold text-xl tracking-tight uppercase">Type.Notes</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-black hover:text-white transition-colors">
                    <ChevronLeftIcon />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                {notes.map(note => (
                    <div 
                        key={note.id}
                        className={`
                            group flex items-center justify-between p-2 mb-1 cursor-pointer transition-all border border-transparent
                            ${activeNoteId === note.id 
                                ? 'bg-black text-white' 
                                : 'hover:border-black text-neutral-600 hover:text-black'
                            }
                        `}
                        onClick={() => setActiveNoteId(note.id)}
                        onDoubleClick={() => setEditingTitleId(note.id)}
                    >
                        <div className="flex items-center gap-3 overflow-hidden w-full">
                            <div className={activeNoteId === note.id ? 'text-white' : 'text-neutral-500'}>
                                <FileIcon />
                            </div>
                            
                            {editingTitleId === note.id ? (
                                <input 
                                    autoFocus
                                    className="bg-transparent border-b border-white focus:outline-none text-base w-full py-0.5 text-white"
                                    value={note.title}
                                    onChange={(e) => updateNoteTitle(note.id, e.target.value)}
                                    onBlur={() => setEditingTitleId(null)}
                                    onKeyDown={(e) => e.key === 'Enter' && setEditingTitleId(null)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span className="text-sm truncate">
                                    {note.title}
                                </span>
                            )}
                        </div>
                        
                        {notes.length > 1 && (
                            <button 
                                onClick={(e) => deleteNote(e, note.id)}
                                className={`opacity-0 group-hover:opacity-100 p-1 transition-all ${activeNoteId === note.id ? 'hover:text-red-300' : 'hover:text-red-600'}`}
                            >
                                <TrashIcon />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-dashed border-black">
                <button 
                    onClick={createNewNote}
                    className="w-full py-2 border border-black hover:bg-black hover:text-white text-sm font-bold flex items-center justify-center gap-2 transition-all uppercase"
                >
                    <PlusIcon /> New Sheet
                </button>
            </div>
        </div>

        {/* --- Toggle Sidebar Button (Floating) --- */}
        {!sidebarOpen && (
            <button 
                onClick={() => setSidebarOpen(true)}
                className="absolute top-4 left-4 z-50 p-2 bg-white border border-black hover:bg-black hover:text-white transition-all"
            >
                <MenuIcon />
            </button>
        )}

        {/* --- Canvas Area --- */}
        <div className="flex-1 relative h-full overflow-hidden">
            {/* Background Pattern */}
            <div 
                className="absolute inset-0 z-0 pointer-events-none opacity-10"
                style={{
                    backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            />

            {/* Floating Toolbar */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 flex gap-0 bg-white border border-black shadow-sm">
                <button 
                    onClick={() => addItem('text')}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-black hover:text-white transition-colors border-r border-black last:border-r-0 group"
                >
                    <TextIcon />
                    <span className="text-xs font-bold uppercase">Text</span>
                    <span className="hidden group-hover:inline text-[10px] ml-1 opacity-50">⌘T</span>
                </button>
                <button 
                    onClick={() => addItem('table')}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-black hover:text-white transition-colors border-r border-black last:border-r-0 group"
                >
                    <TableIcon />
                    <span className="text-xs font-bold uppercase">Table</span>
                    <span className="hidden group-hover:inline text-[10px] ml-1 opacity-50">⌘S</span>
                </button>
                <button 
                    onClick={() => addItem('mindmap')}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-black hover:text-white transition-colors group"
                >
                    <MindMapIcon />
                    <span className="text-xs font-bold uppercase">Map</span>
                    <span className="hidden group-hover:inline text-[10px] ml-1 opacity-50">⌘M</span>
                </button>
            </div>

            {/* Canvas Items */}
            <div 
                ref={canvasRef}
                className="w-full h-full relative z-0"
                onDoubleClick={handleCanvasDoubleClick}
            >
                {items.map((item) => (
                    <div
                        key={item.id}
                        style={{
                            position: 'absolute',
                            left: item.x,
                            top: item.y,
                            width: item.width,
                            height: item.height,
                            zIndex: item.zIndex,
                        }}
                        className={`
                            bg-white flex flex-col group/card border border-black
                            ${draggingId === item.id 
                                ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' 
                                : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]'
                            }
                            transition-all duration-200 ease-out
                        `}
                        onMouseDown={(e) => handleCardMouseDown(e, item.id)}
                    >
                        {/* Header */}
                        <div 
                            className={`
                                h-8 absolute -top-8 left-0 right-0 flex items-center justify-between px-0
                                opacity-0 group-hover/card:opacity-100 transition-opacity duration-200
                                cursor-grab active:cursor-grabbing
                            `}
                            onMouseDown={(e) => handleMouseDown(e, item.id)}
                        >
                            <div className="flex items-center gap-2 bg-black text-white px-2 py-0.5 text-xs">
                                <MoveIcon />
                                {item.isGenerating && (
                                    <span className="animate-pulse">PROCESSING...</span>
                                )}
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                                className="bg-white border border-black text-black hover:bg-black hover:text-white p-1 transition-colors"
                            >
                                <TrashIcon />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto p-0 relative">
                            {item.type === 'text' && <TextEditor item={item} updateItem={updateItem} />}
                            {item.type === 'table' && <TableEditor item={item} updateItem={updateItem} />}
                            {item.type === 'mindmap' && <MindMapEditor item={item} updateItem={updateItem} />}
                            
                            {/* Resizer Handle */}
                            <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize opacity-0 group-hover/card:opacity-100 transition-opacity flex items-end justify-end p-0.5 no-drag">
                                <div className="w-2 h-2 border-r border-b border-black"></div>
                            </div>
                        </div>
                    </div>
                ))}
                
                {items.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center text-neutral-400 opacity-50">
                            <h2 className="text-2xl font-bold tracking-widest uppercase mb-2 border-b border-neutral-400 pb-2 inline-block">No Data</h2>
                            <p className="text-sm font-mono mt-2">INSERT PAPER (DOUBLE CLICK)</p>
                            <div className="mt-4 text-xs space-y-1">
                                <p>⌘T : TEXT</p>
                                <p>⌘S : TABLE</p>
                                <p>⌘M : MAP</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}

export default App;