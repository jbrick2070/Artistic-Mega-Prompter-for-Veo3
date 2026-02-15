
import React, { useState } from 'react';
import { Project, VisualAnchor } from '../types';
import { Image as ImageIcon, Plus, Trash2, User, MapPin, Box, UploadCloud, Database } from 'lucide-react';

interface AnchorManagerProps {
  project: Project;
  onUpdateProject: (updater: Project | ((prev: Project) => Project)) => void;
}

export const AnchorManager: React.FC<AnchorManagerProps> = ({ project, onUpdateProject }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<VisualAnchor['type']>('character');
  const [image, setImage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    if (!name || !image) return;
    const newAnchor: VisualAnchor = {
      id: crypto.randomUUID(),
      name,
      image,
      type
    };
    onUpdateProject(prev => ({
      ...prev,
      anchors: [...prev.anchors, newAnchor]
    }));
    setName('');
    setImage(null);
  };

  const handleDelete = (id: string) => {
    onUpdateProject(prev => ({
      ...prev,
      anchors: prev.anchors.filter(a => a.id !== id)
    }));
  };

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      <div className="border-b border-[#3E2F28] pb-6">
        <h2 className="text-3xl font-black text-[#FDF0C9] italic uppercase tracking-tighter flex items-center gap-3">
          <Database className="text-[#C6934B]" size={32} /> Visual Anchors
        </h2>
        <p className="text-[#8C7A70] text-xs font-bold uppercase tracking-widest mt-2">The "Visual DNA" library for characters, scenes, and properties.</p>
      </div>

      <div className="bg-[#100C0A] border-2 border-[#3E2F28] p-8 rounded-[3rem] shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-[#C6934B] tracking-widest">Anchor Name</label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Cyberpunk Hero, Neo-Tokyo Alley..." 
              className="w-full bg-[#15100E] border border-[#3E2F28] text-white p-5 rounded-2xl outline-none focus:ring-2 focus:ring-[#C6934B]" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-[#C6934B] tracking-widest">Anchor Type</label>
            <div className="flex gap-3">
              {(['character', 'scene', 'prop'] as const).map(t => (
                <button 
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-grow py-3 rounded-xl border font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all
                    ${type === t ? 'bg-[#C6934B] text-[#15100E] border-[#C6934B]' : 'bg-white/5 text-[#8C7A70] border-[#3E2F28] hover:border-[#C6934B]/60'}
                  `}
                >
                  {t === 'character' && <User size={14} />}
                  {t === 'scene' && <MapPin size={14} />}
                  {t === 'prop' && <Box size={14} />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleAdd}
            disabled={!name || !image}
            className="w-full bg-[#C6934B] text-[#15100E] py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-[#FDF0C9] disabled:opacity-30 transition-all"
          >
            <Plus size={18} /> Save Anchor to Archive
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-[#C6934B] tracking-widest">Visual Reference</label>
          <label className="relative aspect-square md:aspect-auto md:h-full rounded-3xl bg-[#15100E] border-2 border-dashed border-[#3E2F28] flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:border-[#C6934B] group transition-all">
            {image ? (
              <img src={image} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-4 text-[#3E2F28] group-hover:text-[#C6934B]">
                <UploadCloud size={48} />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Upload High-Res DNA</span>
              </div>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {project.anchors.map(anchor => (
          <div key={anchor.id} className="bg-[#100C0A] border border-[#3E2F28] rounded-[2rem] overflow-hidden group hover:border-[#C6934B]/50 transition-all">
            <div className="aspect-square bg-[#15100E] relative overflow-hidden">
              <img src={anchor.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => handleDelete(anchor.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="p-5">
              <span className="text-[8px] font-black uppercase text-[#C6934B] tracking-widest flex items-center gap-1 mb-1">
                {anchor.type === 'character' && <User size={10} />}
                {anchor.type === 'scene' && <MapPin size={10} />}
                {anchor.type === 'prop' && <Box size={10} />}
                {anchor.type}
              </span>
              <h3 className="text-sm font-black text-white uppercase italic truncate">{anchor.name}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
