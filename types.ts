import React, { Dispatch, SetStateAction } from 'react';

export type ItemType = 'text' | 'table' | 'mindmap';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface NoteMetadata {
  id: string;
  title: string;
  updatedAt: number;
}

// Mind Map Data Structure
export interface MindMapNodeData {
  id: string;
  label: string;
  children: MindMapNodeData[];
}

export interface CanvasItem {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  content: string | string[][] | MindMapNodeData; // Text, Matrix, or Tree
  isGenerating?: boolean; // AI Loading state
}

export interface ToolbarProps {
  onAddItem: (type: ItemType) => void;
}

export interface CanvasProps {
  items: CanvasItem[];
  setItems: Dispatch<SetStateAction<CanvasItem[]>>;
}