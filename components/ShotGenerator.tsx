
import React, { useState, useRef } from 'react';
import { Shot, Project } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Film, Trash2, Loader2, Plus, 
  Layers, X, Hash, Upload, Image as ImageIcon
} from 'lucide-react';
import { useTranslation } from '../App';

interface PendingPair {
  id: string;
  source: string | null;
  target: string | null;
  status: 'idle' | 'processing' | 'completed' | 'error';
}

interface ShotGeneratorProps {
  project: Project;
  isStudioBusy: boolean;
  setIsStudioBusy: (busy: boolean) => void;
  onUpdateProject: (updater: Project | ((prev: Project) => Project)) => void;
  onNavigateToExport: () => void;
  onApiError?: (error: any, context?: string) => void;
}

export const ShotGenerator: React.FC<ShotGeneratorProps> = ({ 
  project, isStudioBusy, setIsStudioBusy, onUpdateProject, onNavigateToExport, onApiError 
}) => {
  const { language } = useTranslation();
  const [pendingPairs, setPendingPairs] = useState<PendingPair[]>([
    { id: crypto.randomUUID(), source: null, target: null, status: 'idle' }
  ]);
  const [styleDirective, setStyleDirective] = useState<string>(
    "Cinematic storyboards, high-fidelity textures, detailed lighting, dynamic action sequence."
  );
  
  const [dragType, setDragType] = useState<'alpha' | 'beta' | 'mixed' | string | null>(null);
  
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const isRtl = language === 'ar';

  const addPair = () => {
    setPendingPairs(prev => [...prev, { id: crypto.randomUUID(), source: null, target: null, status: 'idle' }]);
  };

  const removePendingPair = (id: string) => {
    if (pendingPairs.length <= 1) {
      setPendingPairs([{ id: crypto.randomUUID(), source: null, target: null, status: 'idle' }]);
      return;
    }
    setPendingPairs(prev => prev.filter(p => p.id !== id));
  };

  const processFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (id: string, file: File, type: 'source' | 'target') => {
    if (!file.type.startsWith('image/')) return;
    const base64 = await processFile(file);
    setPendingPairs(prev => prev.map(p => 
      p.id === id ? { ...p, [type]: base64 } : p
    ));
  };

  const handleBatchDrop = async (e: React.DragEvent, type: 'alpha' | 'beta' | 'mixed') => {
    e.preventDefault();
    setDragType(null);
    
    const files = (Array.from(e.dataTransfer?.files || []) as File[]).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    const base64Files = await Promise.all(files.map(f => processFile(f)));

    setPendingPairs(prev => {
      let currentPairs = [...prev];
      
      if (type === 'alpha') {
        base64Files.forEach((img, i) => {
          if (currentPairs[i]) {
            currentPairs[i].source = img;
          } else {
            currentPairs.push({ id: crypto.randomUUID(), source: img, target: null, status: 'idle' });
          }
        });
      } else if (type === 'beta') {
        base64Files.forEach((img, i) => {
          if (currentPairs[i]) {
            currentPairs[i].target = img;
          } else {
            currentPairs.push({ id: crypto.randomUUID(), source: null, target: img, status: 'idle' });
          }
        });
      } else {
        const newPairs: PendingPair[] = [];
        for (let i = 0; i < base64Files.length; i += 2) {
          newPairs.push({
            id: crypto.randomUUID(),
            source: base64Files[i],
            target: base64Files[i+1] || null,
            status: 'idle'
          });
        }
        currentPairs = [...currentPairs.filter(p => p.source || p.target), ...newPairs];
      }
      
      return currentPairs;
    });
  };

  const handleDragOver = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragType(type);
  };

  const handleDropSlot = async (e: React.DragEvent, id: string, type: 'source' | 'target') => {
    e.preventDefault();
    e.stopPropagation();
    setDragType(null);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(id, file, type);
  };

  const triggerInput = (id: string, type: 'source' | 'target') => {
    const key = `${id}-${type}`;
    fileInputRefs.current[key]?.click();
  };

  const processBatch = async () => {
    const validPairs = pendingPairs.filter(p => p.source && p.target && p.status !== 'completed');
    if (validPairs.length === 0) return;

    setIsStudioBusy(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let currentSequenceCount = (project.startingSequenceNumber || 1) + project.shots.length;

    for (const pair of validPairs) {
      setPendingPairs(prev => prev.map(p => p.id === pair.id ? { ...p, status: 'processing' } : p));
      
      try {
        const systemInstruction = `Cinematic Sequence Analyzer. Style: ${styleDirective}. bridge frames with logical, high-fidelity motion. Output JSON.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { text: systemInstruction },
              { inlineData: { data: pair.source!.split(',')[1], mimeType: 'image/png' } },
              { inlineData: { data: pair.target!.split(',')[1], mimeType: 'image/png' } }
            ]
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                analysis: { type: Type.STRING },
                prompt: { type: Type.STRING }
              },
              required: ['topic', 'analysis', 'prompt']
            }
          }
        });

        const result = JSON.parse(response.text || "{}");
        
        const newShot: Shot = {
          id: crypto.randomUUID(),
          sequenceOrder: currentSequenceCount++,
          topic: result.topic || "Sequence Segment",
          visualAnalysis: result.analysis,
          actionPrompt: result.prompt,
          sourceImage: pair.source!,
          targetImage: pair.target!,
          model: 'veo-3.1-generate-preview',
          aspectRatio: '16:9',
          resolution: '1080p'
        };

        onUpdateProject(prev => ({
          ...prev,
          shots: [...prev.shots, newShot]
        }));

        setPendingPairs(prev => prev.map(p => p.id === pair.id ? { ...p, status: 'completed' } : p));
      } catch (err) {
        setPendingPairs(prev => prev.map(p => p.id === pair.id ? { ...p, status: 'error' } : p));
        if (onApiError) onApiError(err, "Analysis");
      }
    }

    setIsStudioBusy(false);
    setPendingPairs(prev => {
        const filtered = prev.filter(p => p.status !== 'completed');
        return filtered.length > 0 ? filtered : [{ id: crypto.randomUUID(), source: null, target: null, status: 'idle' }];
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Workbench Section */}
      <div className="lg:col-span-6 space-y-8">
        <div className="sketch-card p-10 texture-dots relative overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-black/10 pb-6 mb-8 gap-4">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-black text-white sketch-border">
                  <Layers size={24} />
               </div>
               <div>
                 <h2 className="text-xl font-black text-black uppercase tracking-tighter leading-tight">Drafting Table</h2>
                 <p className="text-[10px] text-black/40 font-black uppercase tracking-widest mt-0.5">Logic Hub</p>
               </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end group">
                <span className="text-[8px] font-black uppercase text-black/40 tracking-widest mb-1">Plate # Start</span>
                <div className="flex items-center gap-2 border-2 border-black/10 bg-white/50 px-2 py-1 sketch-border hover:border-black transition-colors">
                  <input 
                    type="number" 
                    value={project.startingSequenceNumber || 1}
                    onChange={(e) => onUpdateProject(prev => ({ ...prev, startingSequenceNumber: parseInt(e.target.value) || 1 }))}
                    className="w-12 bg-transparent text-xs font-black text-black outline-none border-none text-center"
                    placeholder="1"
                  />
                  <Hash size={14} className="text-black/20" />
                </div>
              </div>
              
              <button 
                onClick={addPair} 
                className="pencil-button px-6 py-4 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 h-full"
              >
                <Plus size={14} /> Add Plate
              </button>
            </div>
          </div>

          {/* New Batch Drop Zones */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div 
              onDragOver={e => handleDragOver(e, 'alpha')}
              onDragLeave={() => setDragType(null)}
              onDrop={e => handleBatchDrop(e, 'alpha')}
              className={`h-24 border-2 border-dashed flex flex-col items-center justify-center texture-hatch transition-all ${dragType === 'alpha' ? 'border-black bg-black/5 scale-[1.02]' : 'border-black/20 bg-black/5 opacity-60 hover:opacity-100'}`}
            >
              <Upload size={18} className="text-black/30 mb-2" />
              <span className="text-[10px] font-black uppercase text-black/60 tracking-widest">ALPHA BATCH</span>
              <span className="text-[7px] text-black/30 font-bold uppercase tracking-widest mt-1">Drop Start Frames</span>
            </div>
            <div 
              onDragOver={e => handleDragOver(e, 'beta')}
              onDragLeave={() => setDragType(null)}
              onDrop={e => handleBatchDrop(e, 'beta')}
              className={`h-24 border-2 border-dashed flex flex-col items-center justify-center texture-hatch transition-all ${dragType === 'beta' ? 'border-black bg-black/5 scale-[1.02]' : 'border-black/20 bg-black/5 opacity-60 hover:opacity-100'}`}
            >
              <Upload size={18} className="text-black/30 mb-2" />
              <span className="text-[10px] font-black uppercase text-black/60 tracking-widest">BETA BATCH</span>
              <span className="text-[7px] text-black/30 font-bold uppercase tracking-widest mt-1">Drop End Frames</span>
            </div>
          </div>

          {/* Mixed Project Drop */}
          <div 
            onDragOver={e => handleDragOver(e, 'mixed')}
            onDragLeave={() => setDragType(null)}
            onDrop={e => handleBatchDrop(e, 'mixed')}
            className={`h-12 border-2 border-dashed flex items-center justify-center mb-8 texture-hatch transition-all ${dragType === 'mixed' ? 'border-black bg-black/5' : 'border-black/10 opacity-40 hover:opacity-100'}`}
          >
            <span className="text-[9px] font-black uppercase text-black/20 tracking-[0.4em]">Mixed Sequential Drop Zone</span>
          </div>

          {/* Plate List */}
          <div className="space-y-8 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {pendingPairs.map((pair, idx) => (
              <div key={pair.id} className="relative p-6 border-2 border-black bg-white/50 group">
                <div className="absolute top-0 left-0 bg-black text-white text-[10px] font-black px-3 py-1">
                  PLATE {(project.startingSequenceNumber || 1) + project.shots.length + idx}
                </div>
                
                <div className="grid grid-cols-2 gap-6 pt-4">
                  {/* Fixed Alpha Drop Box */}
                  <div 
                    onClick={() => triggerInput(pair.id, 'source')}
                    onDragOver={e => handleDragOver(e, `slot-${pair.id}-alpha`)}
                    onDragLeave={() => setDragType(null)}
                    onDrop={e => handleDropSlot(e, pair.id, 'source')}
                    className={`aspect-video bg-[#D8D0C5] border-2 flex items-center justify-center overflow-hidden cursor-pointer relative shadow-inner transition-all ${dragType === `slot-${pair.id}-alpha` ? 'border-black scale-[1.02] bg-white' : 'border-black/30 hover:border-black/60'}`}
                  >
                    {pair.source ? <img src={pair.source} className="w-full h-full object-cover brightness-90 contrast-110" /> : <Plus size={24} className="text-black/30" />}
                    <div className="absolute bottom-1.5 right-1.5 text-[7px] font-black text-black/50 uppercase tracking-widest flex items-center gap-1">
                      <ImageIcon size={8} /> Alpha
                    </div>
                    <input 
                      type="file" 
                      ref={el => fileInputRefs.current[`${pair.id}-source`] = el}
                      className="hidden" 
                      onChange={e => e.target.files?.[0] && handleImageUpload(pair.id, e.target.files[0], 'source')} 
                    />
                  </div>

                  {/* Fixed Beta Drop Box */}
                  <div 
                    onClick={() => triggerInput(pair.id, 'target')}
                    onDragOver={e => handleDragOver(e, `slot-${pair.id}-beta`)}
                    onDragLeave={() => setDragType(null)}
                    onDrop={e => handleDropSlot(e, pair.id, 'target')}
                    className={`aspect-video bg-[#D8D0C5] border-2 flex items-center justify-center overflow-hidden cursor-pointer relative shadow-inner transition-all ${dragType === `slot-${pair.id}-beta` ? 'border-black scale-[1.02] bg-white' : 'border-black/30 hover:border-black/60'}`}
                  >
                    {pair.target ? <img src={pair.target} className="w-full h-full object-cover brightness-90 contrast-110" /> : <Plus size={24} className="text-black/30" />}
                    <div className="absolute bottom-1.5 right-1.5 text-[7px] font-black text-black/50 uppercase tracking-widest flex items-center gap-1">
                      <ImageIcon size={8} /> Beta
                    </div>
                    <input 
                      type="file" 
                      ref={el => fileInputRefs.current[`${pair.id}-target`] = el}
                      className="hidden" 
                      onChange={e => e.target.files?.[0] && handleImageUpload(pair.id, e.target.files[0], 'target')} 
                    />
                  </div>
                </div>
                
                <button onClick={() => removePendingPair(pair.id)} className="absolute top-2 right-2 text-black/20 hover:text-black transition-colors"><X size={16} /></button>
                {pair.status === 'processing' && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20 backdrop-blur-[1px]">
                    <Loader2 className="animate-spin text-black" size={32} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer Controls */}
          <div className="mt-10 pt-8 border-t-2 border-black/5">
            <label className="text-[9px] font-black uppercase text-black/40 tracking-widest block mb-3">Aesthetic Style Directive</label>
            <textarea 
              value={styleDirective}
              onChange={(e) => setStyleDirective(e.target.value)}
              className="w-full h-20 bg-white/30 border-2 border-black/10 p-4 text-[11px] text-black font-mono leading-relaxed outline-none focus:border-black transition-all resize-none mb-6"
            />
            <button 
              onClick={processBatch}
              disabled={isStudioBusy}
              className="w-full pencil-button py-6 font-black uppercase text-sm tracking-[0.4em]"
            >
              {isStudioBusy ? <Loader2 className="animate-spin mx-auto" /> : 'EXECUTE DRAFT'}
            </button>
          </div>
        </div>
      </div>

      {/* Plate Sequence Section */}
      <div className="lg:col-span-6 space-y-8">
        <h3 className="text-2xl font-black text-black uppercase italic flex items-center gap-4">
          <Film className="text-black/20" /> Series Sequence
        </h3>
        
        <div className="space-y-6 overflow-y-auto max-h-[85vh] pr-4 custom-scrollbar pb-20">
          {project.shots.length === 0 ? (
            <div className="py-32 text-center border-4 border-dashed border-black/5 texture-hatch opacity-20">
              <span className="font-black uppercase text-xs tracking-[0.5em]">No Plates Sketched</span>
            </div>
          ) : (
            [...project.shots].sort((a,b) => b.sequenceOrder - a.sequenceOrder).map((shot) => (
              <div key={shot.id} className="sketch-card p-8 group relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-black text-black/10 italic">#{shot.sequenceOrder}</span>
                    <span className="text-[10px] font-black uppercase text-black tracking-widest truncate max-w-[200px] border-b border-black/20">{shot.topic}</span>
                  </div>
                  <button onClick={() => onUpdateProject(prev => ({...prev, shots: prev.shots.filter(s => s.id !== shot.id)}))} className="text-black/10 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                </div>
                
                <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-5 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="aspect-video border-2 border-black/10 overflow-hidden"><img src={shot.sourceImage} className="w-full h-full object-cover" /></div>
                      <div className="aspect-video border-2 border-black/10 overflow-hidden"><img src={shot.targetImage} className="w-full h-full object-cover" /></div>
                    </div>
                  </div>
                  <div className="col-span-7 space-y-4">
                    <div className="p-3 bg-black/5 border-l-4 border-black/20">
                      <p className="text-[10px] text-black/60 italic leading-snug">{shot.visualAnalysis}</p>
                    </div>
                    <div className="p-4 border-2 border-black/10 bg-white/40 texture-hatch">
                      <p className="text-[11px] text-black font-mono leading-relaxed line-clamp-3">{shot.actionPrompt}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
