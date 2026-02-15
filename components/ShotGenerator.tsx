
import React, { useState, useRef } from 'react';
import { Shot, Project } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Film, Trash2, Loader2, Plus, 
  Layers, X, Hash, Upload, Image as ImageIcon,
  ArrowRight, ArrowDownLeft, Link as LinkIcon, Link2Off, RotateCcw,
  RefreshCw
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

type BatchProcessingMode = 'standard' | 'chained' | 'looper';

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
  const [batchMode, setBatchMode] = useState<BatchProcessingMode>('chained');
  const [dragType, setDragType] = useState<'alpha' | 'beta' | 'mixed' | string | null>(null);
  
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const isRtl = language === 'ar';

  const addPair = () => {
    setPendingPairs(prev => [...prev, { id: crypto.randomUUID(), source: null, target: null, status: 'idle' }]);
  };

  const resetTable = () => {
    if (window.confirm("Are you sure you want to clear the entire Drafting Table? This cannot be undone.")) {
      setPendingPairs([{ id: crypto.randomUUID(), source: null, target: null, status: 'idle' }]);
    }
  };

  const removePendingPair = (id: string) => {
    if (pendingPairs.length <= 1) {
      setPendingPairs([{ id: crypto.randomUUID(), source: null, target: null, status: 'idle' }]);
      return;
    }
    setPendingPairs(prev => prev.filter(p => p.id !== id));
  };

  const syncAlphaToBeta = (id: string) => {
    setPendingPairs(prev => prev.map(p => 
      p.id === id ? { ...p, target: p.source } : p
    ));
  };

  const syncBetaToNext = (id: string) => {
    setPendingPairs(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx !== -1 && idx < prev.length - 1) {
        const currentTarget = prev[idx].target;
        return prev.map((p, i) => i === idx + 1 ? { ...p, source: currentTarget } : p);
      }
      return prev;
    });
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
      let currentPairs = prev.filter(p => p.source || p.target);
      
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
        if (batchMode === 'chained') {
          const chained: PendingPair[] = [];
          for (let i = 0; i < base64Files.length; i++) {
            const current = base64Files[i];
            const next = base64Files[i + 1];

            chained.push({
              id: crypto.randomUUID(),
              source: current,
              target: current,
              status: 'idle'
            });

            if (next) {
              chained.push({
                id: crypto.randomUUID(),
                source: current,
                target: next,
                status: 'idle'
              });
            }
          }
          currentPairs = [...currentPairs, ...chained];
        } else if (batchMode === 'looper') {
          const looped: PendingPair[] = base64Files.map(img => ({
            id: crypto.randomUUID(),
            source: img,
            target: img,
            status: 'idle'
          }));
          currentPairs = [...currentPairs, ...looped];
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
          currentPairs = [...currentPairs, ...newPairs];
        }
      }
      
      return currentPairs.length > 0 ? currentPairs : [{ id: crypto.randomUUID(), source: null, target: null, status: 'idle' }];
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
        <div className="sketch-card texture-dots relative flex flex-col h-[90vh]">
          {/* Sticky Header Area */}
          <div className="sticky top-0 z-40 bg-[#F5F1EA] border-b-2 border-black/10 px-8 pt-8 pb-4 rounded-t-[3rem] shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-black text-white sketch-border">
                  <Layers size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-black uppercase tracking-tighter leading-tight">Drafting Table</h2>
                  <p className="text-[9px] text-black/60 font-black uppercase tracking-widest mt-0.5">Logic Hub</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[7px] font-black uppercase text-black/50 tracking-widest mb-0.5">Start #</span>
                  <div className="flex items-center gap-1 border border-black/30 bg-white px-1.5 py-0.5 sketch-border hover:border-black transition-colors">
                    <input 
                      type="number" 
                      value={project.startingSequenceNumber || 1}
                      onChange={(e) => onUpdateProject(prev => ({ ...prev, startingSequenceNumber: parseInt(e.target.value) || 1 }))}
                      className="w-10 bg-transparent text-[10px] font-black text-black outline-none border-none text-center"
                    />
                    <Hash size={12} className="text-black/40" />
                  </div>
                </div>
                
                <div className="flex gap-2 h-full">
                  <button 
                    onClick={addPair} 
                    title="Add new plate"
                    className="pencil-button px-4 py-2 font-black uppercase text-[9px] tracking-widest flex items-center gap-2 shadow-md bg-white hover:bg-black hover:text-white transition-all"
                  >
                    <Plus size={12} /> Add Plate
                  </button>
                  <button 
                    onClick={resetTable} 
                    title="Reset drafting table"
                    className="pencil-button px-4 py-2 font-black uppercase text-[9px] tracking-widest flex items-center gap-2 shadow-md bg-red-500/5 hover:bg-red-600 hover:text-white transition-all text-red-600 border-red-500/20"
                  >
                    <Trash2 size={12} /> Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Batch Drop Zones */}
            <div className="grid grid-cols-2 gap-3">
              <div 
                onDragOver={e => handleDragOver(e, 'alpha')}
                onDragLeave={() => setDragType(null)}
                onDrop={e => handleBatchDrop(e, 'alpha')}
                className={`h-14 border-2 border-dashed flex flex-col items-center justify-center texture-hatch transition-all ${dragType === 'alpha' ? 'border-black bg-black/10 scale-[1.02]' : 'border-black/30 bg-black/5 hover:opacity-100 hover:border-black'}`}
              >
                <div className="flex items-center gap-2">
                  <Upload size={14} className="text-black/60" />
                  <span className="text-[9px] font-black uppercase text-black/80 tracking-widest">Alpha Batch</span>
                </div>
              </div>
              <div 
                onDragOver={e => handleDragOver(e, 'beta')}
                onDragLeave={() => setDragType(null)}
                onDrop={e => handleBatchDrop(e, 'beta')}
                className={`h-14 border-2 border-dashed flex flex-col items-center justify-center texture-hatch transition-all ${dragType === 'beta' ? 'border-black bg-black/10 scale-[1.02]' : 'border-black/30 bg-black/5 hover:opacity-100 hover:border-black'}`}
              >
                <div className="flex items-center gap-2">
                  <Upload size={14} className="text-black/60" />
                  <span className="text-[9px] font-black uppercase text-black/80 tracking-widest">Beta Batch</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div 
                onDragOver={e => handleDragOver(e, 'mixed')}
                onDragLeave={() => setDragType(null)}
                onDrop={e => handleBatchDrop(e, 'mixed')}
                className={`flex-grow h-10 border-2 border-dashed flex items-center justify-center texture-hatch transition-all ${dragType === 'mixed' ? 'border-black bg-black/10' : 'border-black/30 hover:border-black/60'}`}
              >
                <span className="text-[8px] font-black uppercase text-black/50 tracking-[0.4em]">Mixed Sequential Drop</span>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setBatchMode(batchMode === 'chained' ? 'standard' : 'chained')}
                  className={`h-10 px-4 border-2 flex items-center gap-2 transition-all ${batchMode === 'chained' ? 'bg-black text-white border-black' : 'bg-white text-black/60 border-black/30 hover:border-black'}`}
                  title={batchMode === 'chained' ? "Chained Mode: Creates Hold -> Action sequence" : "Standard Mode: Pairing images by two"}
                >
                  {batchMode === 'chained' ? <LinkIcon size={14} /> : <Link2Off size={14} />}
                  <span className="text-[7px] font-black uppercase tracking-widest">Chain</span>
                </button>

                <button 
                  onClick={() => setBatchMode(batchMode === 'looper' ? 'standard' : 'looper')}
                  className={`h-10 px-4 border-2 flex items-center gap-2 transition-all ${batchMode === 'looper' ? 'bg-[#C6934B] text-black border-black' : 'bg-white text-black/60 border-black/30 hover:border-black'}`}
                  title="Looper Mode: Each file creates a Hold plate (A->A)"
                >
                  <RotateCcw size={14} />
                  <span className="text-[7px] font-black uppercase tracking-widest">Looper</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Area */}
          <div className="flex-grow overflow-y-auto p-8 custom-scrollbar space-y-8">
            {pendingPairs.map((pair, idx) => (
              <div key={pair.id} className="relative p-6 border-2 border-black bg-white group animate-in slide-in-from-left-2 duration-300 shadow-sm">
                <div className="absolute top-0 left-0 bg-black text-white text-[9px] font-black px-3 py-1">
                  PLATE {(project.startingSequenceNumber || 1) + project.shots.length + idx}
                </div>
                
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 pt-4">
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

                  <button 
                    onClick={() => syncAlphaToBeta(pair.id)}
                    title="Copy Alpha to Beta"
                    className="p-1.5 bg-black/5 rounded-full hover:bg-black hover:text-white transition-all text-black/30"
                  >
                    <ArrowRight size={14} />
                  </button>

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

                {idx < pendingPairs.length - 1 && (
                  <div className="flex justify-center -mb-2 mt-4 relative z-10">
                    <button 
                      onClick={() => syncBetaToNext(pair.id)}
                      title="Push Beta to Next Alpha"
                      className="flex items-center gap-2 px-3 py-1 bg-white border border-black/10 rounded-full text-[8px] font-black uppercase tracking-widest text-black/30 hover:text-black hover:border-black transition-all shadow-sm"
                    >
                      <ArrowDownLeft size={10} /> Push to Next Alpha
                    </button>
                  </div>
                )}
                
                <button onClick={() => removePendingPair(pair.id)} className="absolute top-2 right-2 text-black/20 hover:text-black transition-colors"><X size={16} /></button>
                {pair.status === 'processing' && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20 backdrop-blur-[1px]">
                    <Loader2 className="animate-spin text-black" size={32} />
                  </div>
                )}
              </div>
            ))}

            <div className="pt-8 border-t-2 border-black/5 pb-12">
              <label className="text-[9px] font-black uppercase text-black/40 tracking-widest block mb-2">Aesthetic Style Directive</label>
              <textarea 
                value={styleDirective}
                onChange={(e) => setStyleDirective(e.target.value)}
                className="w-full h-24 bg-white border-2 border-black/10 p-4 text-[11px] text-black font-mono leading-relaxed outline-none focus:border-black transition-all resize-none mb-6 custom-scrollbar"
              />
              <button 
                onClick={processBatch}
                disabled={isStudioBusy}
                className="w-full pencil-button py-6 font-black uppercase text-sm tracking-[0.4em] shadow-lg active:scale-[0.98]"
              >
                {isStudioBusy ? <Loader2 className="animate-spin mx-auto" /> : 'EXECUTE DRAFT'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Plate Sequence Section */}
      <div className="lg:col-span-6 space-y-8">
        <h3 className="text-2xl font-black text-black uppercase italic flex items-center gap-4">
          <Film className="text-black/20" /> Series Sequence
        </h3>
        
        <div className="space-y-6 overflow-y-auto h-[85vh] pr-4 custom-scrollbar pb-20">
          {project.shots.length === 0 ? (
            <div className="py-32 text-center border-4 border-dashed border-black/5 texture-hatch opacity-20">
              <span className="font-black uppercase text-xs tracking-[0.5em]">No Plates Sketched</span>
            </div>
          ) : (
            [...project.shots].sort((a,b) => b.sequenceOrder - a.sequenceOrder).map((shot) => (
              <div key={shot.id} className="sketch-card p-8 group relative overflow-hidden animate-in fade-in duration-500">
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
                    <div className="p-4 border-2 border-black/10 bg-white texture-hatch">
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
