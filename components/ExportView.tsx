
import React, { useState } from 'react';
import { Project, Shot } from '../types';
import { FileText, Copy, CheckCircle2, Package, Loader2, Sparkles, Palette, Wand2, Zap, ShieldAlert, Rocket } from 'lucide-react';
import { useTranslation } from '../App';
import { GoogleGenAI, Type } from "@google/genai";
import JSZip from 'jszip';

interface ExportViewProps {
  project: Project;
  onUpdateProject: (updater: Project | ((prev: Project) => Project)) => void;
  onApiError: (error: any) => void;
}

export const ExportView: React.FC<ExportViewProps> = ({ project, onUpdateProject, onApiError }) => {
  const { language } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [refineDirective, setRefineDirective] = useState('Cinematic movie style, detailed textures, high fidelity lighting, smooth transition logic');
  
  const isRtl = language === 'ar';

  const content = project.shots.sort((a,b) => a.sequenceOrder - b.sequenceOrder).map((s) => {
    return `${s.sequenceOrder}. [${s.topic}]
Visual Analysis: ${s.visualAnalysis}
Production Prompt: ${s.actionPrompt}`;
  }).join('\n\n---\n\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRefineAll = async () => {
    if (project.shots.length === 0 || !refineDirective) return;
    setIsRefining(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `You are an Aesthetic Master for Veo 3.1 cinematic sequences.
      
      Your job is to take a series of scene descriptions and transform them into a specific aesthetic style.
      The style to apply is: ${refineDirective}
      
      Rewrite the action prompts to be extremely descriptive and stylistically locked to the requested vibe.
      Return the updated prompts in a JSON array corresponding to the order of shots provided.`;

      const shotData = project.shots.sort((a,b) => a.sequenceOrder - b.sequenceOrder).map(s => ({ 
        id: s.id,
        topic: s.topic, 
        original_prompt: s.actionPrompt 
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: systemInstruction },
            { text: JSON.stringify(shotData) }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                refined_prompt: { type: Type.STRING }
              },
              required: ['id', 'refined_prompt']
            }
          }
        }
      });

      const refinedData = JSON.parse(response.text || "[]");
      
      if (Array.isArray(refinedData)) {
        onUpdateProject(prev => ({
          ...prev,
          shots: prev.shots.map((shot) => {
            const refined = refinedData.find(r => r.id === shot.id);
            return refined ? { ...shot, actionPrompt: refined.refined_prompt } : shot;
          })
        }));
      }
    } catch (err) {
      console.error("Refinement failed", err);
      onApiError(err);
    } finally {
      setIsRefining(false);
    }
  };

  const handleOptimizeVeo3 = async () => {
    if (project.shots.length === 0) return;
    setIsOptimizing(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `You are the Veo 3 Engine Optimizer. 
      
      CRITICAL TASKS:
      1. COPYRIGHT SCRUBBING: Identify and replace any copyrighted characters or brand names (e.g., Disney, Marvel, Coca-Cola) with high-fidelity descriptive equivalents.
      2. PROMPT DENSITY: Take long, rambling, or complex action prompts and condense them into high-density tokens that Veo 3 prioritizes (motion keywords, lighting descriptors, camera angles, atmospheric physics).
      3. CINEMATIC LOGIC: Ensure the prompts describe a single continuous action or transformation that the video engine can successfully interpret.
      
      Return the optimized prompts in a JSON array corresponding to the order of shots provided.`;

      const shotData = project.shots.sort((a,b) => a.sequenceOrder - b.sequenceOrder).map(s => ({ 
        id: s.id,
        prompt: s.actionPrompt 
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: systemInstruction },
            { text: JSON.stringify(shotData) }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                optimized_prompt: { type: Type.STRING }
              },
              required: ['id', 'optimized_prompt']
            }
          }
        }
      });

      const optimizedData = JSON.parse(response.text || "[]");
      
      if (Array.isArray(optimizedData)) {
        onUpdateProject(prev => ({
          ...prev,
          shots: prev.shots.map((shot) => {
            const opt = optimizedData.find(o => o.id === shot.id);
            return opt ? { ...shot, actionPrompt: opt.optimized_prompt } : shot;
          })
        }));
      }
    } catch (err) {
      console.error("Optimization failed", err);
      onApiError(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const downloadZipPack = async () => {
    if (project.shots.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const imgFolder = zip.folder("production_frames");
      
      project.shots.forEach((shot) => {
        const num = shot.sequenceOrder.toString().padStart(3, '0');
        
        if (shot.sourceImage) {
          const base64Data = shot.sourceImage.split(',')[1];
          imgFolder?.file(`SHOT_${num}_A_START.png`, base64Data, { base64: true });
        }
        
        if (shot.targetImage) {
          const base64Data = shot.targetImage.split(',')[1];
          imgFolder?.file(`SHOT_${num}_B_END.png`, base64Data, { base64: true });
        }
      });

      zip.file("MASTER_PRODUCTION_SCRIPT.txt", content);
      
      const blob = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.title.replace(/\s+/g, '_')}_Master_Pack.zip`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Zipping failed", err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="border-b border-[#3E2F28]/30 pb-6 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-[#FDF0C9] italic uppercase tracking-tighter">Production Master Pack</h2>
          <p className="text-[10px] text-[#C6934B] font-black uppercase tracking-[0.4em] mt-2">Final Batch Sequence Suite</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={downloadZipPack}
            disabled={isZipping || project.shots.length === 0}
            className="bg-[#C6934B] text-[#15100E] px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#FDF0C9] transition-all flex items-center gap-3 disabled:opacity-30 shadow-xl shadow-[#C6934B]/10"
          >
            {isZipping ? <Loader2 className="animate-spin" size={18} /> : <Package size={18} />} 
            Download ZIP
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#100C0A] border-2 border-[#C6934B]/20 p-8 rounded-[3rem] shadow-2xl space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
            <Palette size={160} />
          </div>
          
          <div className="flex items-center gap-4 text-[#C6934B] border-b border-[#3E2F28] pb-4">
             <Sparkles size={24} />
             <div>
               <h3 className="text-xl font-black text-[#FDF0C9] italic uppercase tracking-tighter leading-none">Aesthetic Overhaul</h3>
               <p className="text-[8px] font-black text-[#8C7A70] uppercase tracking-[0.3em] mt-1">Global Cinematic Style Injection</p>
             </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-center">
              <label className="text-[9px] font-black uppercase text-[#C6934B] tracking-[0.3em] flex items-center gap-2">
                <Zap size={12} /> Global Aesthetic Directive
              </label>
            </div>
            <div className="relative">
              <textarea 
                value={refineDirective}
                onChange={(e) => setRefineDirective(e.target.value)}
                className="w-full h-32 bg-black/40 border-2 border-[#3E2F28] rounded-2xl p-4 text-[11px] text-[#FDF0C9] font-mono leading-relaxed outline-none focus:border-[#C6934B]/60 transition-all resize-none shadow-inner scrollbar-hide"
                placeholder="e.g. Noir, Cyberpunk, 16mm film stock..."
              />
            </div>
          </div>

          <button 
            onClick={handleRefineAll}
            disabled={isRefining || project.shots.length === 0}
            className="w-full bg-[#15100E] border-2 border-[#C6934B]/40 text-[#C6934B] py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-[#C6934B] hover:text-[#15100E] transition-all disabled:opacity-30 active:scale-[0.98]"
          >
            {isRefining ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />} 
            Apply Master Refinement
          </button>
        </div>

        <div className="bg-[#100C0A] border-2 border-[#8A1C1C]/20 p-8 rounded-[3rem] shadow-2xl space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
            <Rocket size={160} />
          </div>
          
          <div className="flex items-center gap-4 text-[#8A1C1C] border-b border-[#3E2F28] pb-4">
             <ShieldAlert size={24} />
             <div>
               <h3 className="text-xl font-black text-[#FDF0C9] italic uppercase tracking-tighter leading-none">Veo 3 Engine Optimizer</h3>
               <p className="text-[8px] font-black text-[#8C7A70] uppercase tracking-[0.3em] mt-1">Copyright Scrub & Density Tuning</p>
             </div>
          </div>

          <div className="space-y-4 relative z-10 flex-grow flex flex-col justify-center">
            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
              <ul className="text-[10px] text-[#8C7A70] font-medium space-y-2 uppercase tracking-wide">
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-red-500 rounded-full" /> Auto-removes copyrighted brand terms</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-red-500 rounded-full" /> Transforms long text into efficient tokens</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-red-500 rounded-full" /> Optimizes for high-motion consistency</li>
              </ul>
            </div>
          </div>

          <button 
            onClick={handleOptimizeVeo3}
            disabled={isOptimizing || project.shots.length === 0}
            className="w-full mt-auto bg-[#15100E] border-2 border-red-500/40 text-red-500 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-red-500 hover:text-[#15100E] transition-all disabled:opacity-30 active:scale-[0.98]"
          >
            {isOptimizing ? <Loader2 className="animate-spin" /> : <Rocket size={18} />} 
            Action: Optimize Logic
          </button>
        </div>
      </div>

      <div className="bg-[#100C0A] border border-[#3E2F28] rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl">
        <div className="bg-[#15100E]/90 p-6 border-b border-[#3E2F28] flex justify-between items-center">
          <span className="text-[10px] font-black uppercase text-[#C6934B] tracking-[0.3em] flex items-center gap-2">
            <FileText size={14} /> Final Production Script
          </span>
          <button 
            onClick={handleCopy} 
            className={`px-6 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border ${copied ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : 'bg-[#2A1F1B] border-[#3E2F28] text-[#FDF0C9] hover:border-[#C6934B] hover:text-[#C6934B]'}`}
          >
            {copied ? 'COPIED' : 'COPY ALL'}
          </button>
        </div>
        <pre className="p-8 text-xs font-mono text-[#8C7A70] leading-relaxed overflow-y-auto max-h-[600px] whitespace-pre-wrap bg-black/10 selection:bg-[#C6934B] selection:text-[#15100E]">
          {content || "No shots synthesized in current strip."}
        </pre>
      </div>
    </div>
  );
};
