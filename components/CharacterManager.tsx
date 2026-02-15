
import React, { useState } from 'react';
import { Character } from '../types';
import { UserPlus, Trash2, Edit2, Check, Sparkles, Loader2, Fingerprint, RefreshCw, Upload, AlertCircle } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { useTranslation } from '../App';

interface CharacterManagerProps {
  characters: Character[];
  isStudioBusy: boolean;
  setIsStudioBusy: (busy: boolean) => void;
  setCharacters: (updater: Character[] | ((prev: Character[]) => Character[])) => void;
  onApiError?: (error: any) => void;
}

const COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-emerald-500', 'bg-rose-500'];

export const CharacterManager: React.FC<CharacterManagerProps> = ({ characters, isStudioBusy, setIsStudioBusy, setCharacters, onApiError }) => {
  const { t, language } = useTranslation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [localGeneratingId, setLocalGeneratingId] = useState<string | null>(null);

  const isRtl = language === 'ar';

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    try {
      // Re-initialize for each call as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Design a unique cast member persona for a high-quality cinematic series. 
      Focus on immutable traits: facial structure, hair color/texture, and distinctive clothing style. 
      Return JSON: { "name": "Name", "description": "Specific visual description" }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ['name', 'description']
          }
        }
      });

      // Directly use text property and trim
      const jsonText = response.text?.trim() || "{}";
      const data = JSON.parse(jsonText);
      if (data.name && data.description) {
        setName(data.name);
        setDesc(data.description);
      }
    } catch (err) {
      if (onApiError) onApiError(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, charId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setCharacters(prev => prev.map(c => c.id === charId ? { ...c, visualAnchor: base64String } : c));
    };
    reader.readAsDataURL(file);
  };

  const synthesizeVisualAnchor = async (char: Character) => {
    if (isStudioBusy) return;
    setIsStudioBusy(true);
    setLocalGeneratingId(char.id);
    
    try {
      // Re-initialize for each call as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const imagePrompt = `Studio lighting cinematic cast member concept portrait. Centered front view. Identity: ${char.name}. Visual DNA: ${char.description}. Style: Detailed 3D cinematic render, hyper-realistic, studio background.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        // Wrap text in parts structure for consistency with guidelines
        contents: { parts: [{ text: imagePrompt }] }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          // Find the image part as per guidelines
          if (part.inlineData) {
            const imageData = `data:image/png;base64,${part.inlineData.data}`;
            setCharacters(prev => prev.map(c => c.id === char.id ? { ...c, visualAnchor: imageData } : c));
            break;
          }
        }
      }
    } catch (err) {
      if (onApiError) onApiError(err);
    } finally {
      setIsStudioBusy(false);
      setLocalGeneratingId(null);
    }
  };

  const handleSave = () => {
    if (!name || !desc) return;
    if (editingId) {
      setCharacters(prev => prev.map(c => c.id === editingId ? { ...c, name, description: desc } : c));
    } else {
      setCharacters(prev => [...prev, { 
        id: crypto.randomUUID(), 
        name, 
        description: desc, 
        color: COLORS[prev.length % COLORS.length] 
      }]);
    }
    setName(''); setDesc(''); setEditingId(null); setIsFormOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className={`flex justify-between items-end border-b border-[#3E2F28] pb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className={isRtl ? 'text-right' : 'text-left'}>
          <h2 className="text-3xl font-black text-[#FDF0C9] italic uppercase tracking-tighter flex items-center gap-3">
            <Fingerprint className="text-[#C6934B]" size={32} /> {t.cast_bank}
          </h2>
          <p className="text-[#8C7A70] text-xs font-bold uppercase tracking-widest mt-2">Ground your series with consistent visual anchors.</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)} 
            className="bg-[#C6934B] text-[#15100E] px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#FDF0C9] transition-all flex items-center gap-2 shadow-xl shadow-[#C6934B]/10"
          >
            <UserPlus size={18} /> {editingId ? 'Refining Cast' : 'New Cast Member'}
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-[#100C0A] border-2 border-[#C6934B]/30 p-8 rounded-[3rem] shadow-2xl animate-in slide-in-from-top-4" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-[#FDF0C9] uppercase italic">{editingId ? 'Refining Identity' : 'Initializing New Subject'}</h3>
            <button onClick={handleAIGenerate} disabled={isGenerating} className="text-[#C6934B] flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-white disabled:opacity-30">
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Auto-Design Bio
            </button>
          </div>
          <div className="space-y-6">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Cast Member Name / Alias" className="w-full bg-[#15100E] border border-[#3E2F28] text-white p-6 rounded-2xl text-2xl font-black italic outline-none focus:ring-2 focus:ring-[#C6934B]" />
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe visual traits: bone structure, hair, distinctive fashion..." className="w-full h-40 bg-[#15100E] border border-[#3E2F28] text-white p-6 rounded-2xl outline-none focus:ring-2 focus:ring-[#C6934B] resize-none" />
          </div>
          <div className="flex justify-end gap-4 mt-8">
            <button onClick={() => setIsFormOpen(false)} className="px-6 py-3 text-[#5D4E45] font-black uppercase text-xs tracking-widest">Cancel</button>
            <button onClick={handleSave} className="bg-[#C6934B] text-[#15100E] px-10 py-4 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-[#FDF0C9] transition-all flex items-center gap-2">
              <Check size={20} /> Lock Visual Identity
            </button>
          </div>
        </div>
      )}

      {isStudioBusy && !localGeneratingId && (
        <div className="flex items-center gap-3 p-4 bg-[#C6934B]/5 border border-[#C6934B]/20 rounded-2xl text-[#C6934B] animate-in slide-in-from-top-2">
          <AlertCircle size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Studio is busy. Please wait for completion.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {characters.map(char => (
          <div key={char.id} className="bg-[#100C0A]/60 border border-[#3E2F28] rounded-[2.5rem] p-8 hover:border-[#C6934B]/40 transition-all group overflow-hidden relative" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className={`flex justify-between items-start mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`relative w-20 h-20 rounded-2xl ${char.color} flex items-center justify-center text-[#15100E] font-black text-3xl overflow-hidden border-2 border-[#3E2F28] shadow-inner`}>
                  {char.visualAnchor ? (
                    <img src={char.visualAnchor} className="w-full h-full object-cover" alt={char.name} />
                  ) : (
                    char.name[0]
                  )}
                  {localGeneratingId === char.id && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="animate-spin text-[#C6934B]" size={24} />
                    </div>
                  )}
                </div>
                <div className={isRtl ? 'text-right' : 'text-left'}>
                  <h3 className="font-black text-[#FDF0C9] text-xl uppercase italic leading-none">{char.name}</h3>
                  <span className="text-[8px] font-black text-[#5D4E45] uppercase tracking-widest mt-1 inline-block">Production Prototype</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setName(char.name); setDesc(char.description); setEditingId(char.id); setIsFormOpen(true); }} className="text-[#5D4E45] hover:text-[#C6934B]"><Edit2 size={18} /></button>
                <button onClick={() => setCharacters(prev => prev.filter(c => c.id !== char.id))} className="text-[#5D4E45] hover:text-red-500"><Trash2 size={18} /></button>
              </div>
            </div>
            
            <p className={`text-[11px] text-[#8C7A70] leading-relaxed line-clamp-3 mb-6 font-medium italic ${isRtl ? 'text-right' : 'text-left'}`}>"{char.description}"</p>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => synthesizeVisualAnchor(char)} 
                disabled={isStudioBusy}
                className={`py-4 rounded-xl border flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest transition-all
                  ${localGeneratingId === char.id ? 'bg-[#15100E] border-[#3E2F28] text-[#5D4E45]' : isStudioBusy ? 'opacity-30 cursor-not-allowed grayscale' : 'bg-[#C6934B]/5 border-[#C6934B]/20 text-[#C6934B] hover:bg-[#C6934B]/20'}
                `}
              >
                {localGeneratingId === char.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Synthesize DNA
              </button>
              
              <label className="cursor-pointer py-4 rounded-xl border border-[#3E2F28] bg-white/5 text-[#8C7A70] hover:text-[#FDF0C9] hover:bg-white/10 transition-all flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest">
                <Upload size={14} />
                Upload DNA
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => handleFileUpload(e, char.id)} 
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
