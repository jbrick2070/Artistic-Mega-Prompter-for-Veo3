
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9';
export type Resolution = '1080p' | '720p' | '4k';
export type VeoModel = 'veo-3.1-generate-preview' | 'veo-3.1-fast-generate-preview';

// Defined Character interface for cast management
export interface Character {
  id: string;
  name: string;
  description: string;
  color: string;
  visualAnchor?: string;
}

// Defined VisualAnchor interface for visual DNA library
export interface VisualAnchor {
  id: string;
  name: string;
  image: string;
  type: 'character' | 'scene' | 'prop';
}

export interface Shot {
  id: string;
  sequenceOrder: number;
  topic: string;
  actionPrompt: string; 
  visualAnalysis: string;
  sourceImage?: string; 
  targetImage?: string; 
  model: VeoModel;
  aspectRatio: AspectRatio;
  resolution: Resolution;
}

export interface Project {
  id: string;
  title: string;
  lastModified: number;
  shots: Shot[];
  startingSequenceNumber?: number; // Custom offset for sequencing
  // Added anchors to Project to support AnchorManager requirements
  anchors: VisualAnchor[];
}