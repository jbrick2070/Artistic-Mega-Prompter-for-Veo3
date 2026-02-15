
import React, { useState } from 'react';
import { Project } from '../types';
import { Plus, Trash2, ArrowRight, X, Film, Library, GalleryVertical } from 'lucide-react';
import { useTranslation } from '../App';

interface ProjectLibraryProps {
  projects: Project[];
  onCreateProject: (title: string) => void;
  onSelectProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onApiError: (error: any) => void;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

export const ProjectLibrary: React.FC<ProjectLibraryProps> = ({ projects, onCreateProject, onSelectProject, onDeleteProject }) => {
  const { language } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const isRtl = language === 'ar';

  return (
    <div className="p-12 max-w-7xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-4 border-black/10 pb-10 gap-8">
        <div className={isRtl ? 'text-right' : 'text-left'}>
          {/* High contrast, bold slanted title */}
          <h2 className="text-6xl font-black text-black tracking-tighter uppercase italic leading-[0.8] mb-4">
            Sequence<br />Gallery
          </h2>
          <div className="flex items-center gap-4">
            <div className="h-1 w-16 bg-black/10 texture-hatch"></div>
            <p className="text-black/40 font-black uppercase tracking-[0.4em] text-[10px]">Project Master Registry</p>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-6 opacity-10 pointer-events-none mb-2">
           <GalleryVertical size={60} strokeWidth={1} />
           <Library size={60} strokeWidth={1} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Tightened "Start New Sequence" block */}
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="h-[300px] border-4 border-dashed border-black/10 texture-hatch flex flex-col items-center justify-center gap-4 text-black/30 font-black uppercase text-[10px] tracking-[0.4em] hover:border-black hover:text-black transition-all group sketch-border bg-white/10"
        >
          <div className="p-4 bg-white border-2 border-black/5 sketch-border group-hover:scale-110 transition-transform">
            <Plus size={32} className="text-black" />
          </div>
          Initialize Series
        </button>

        {projects.map((project) => (
          <div key={project.id} className="sketch-card flex flex-col group transition-all overflow-hidden h-[300px] relative">
            {/* Visual Preview / Thumbnail - reduced height */}
            <div className="h-32 bg-[#EAE3D9] flex items-center justify-center overflow-hidden texture-hatch-v relative border-b border-black/10">
               {project.shots.length > 0 && project.shots[0].sourceImage ? (
                 <img src={project.shots[0].sourceImage} className="w-full h-full object-cover grayscale contrast-150 brightness-90 opacity-40 group-hover:opacity-100 transition-opacity" />
               ) : (
                 <Film size={48} className="text-black/5" strokeWidth={1} />
               )}
               <div className="absolute top-3 left-3 px-2 py-1 bg-black text-white text-[7px] font-black uppercase tracking-widest sketch-border">
                  PLATE SERIES
               </div>
            </div>

            {/* Project Content - tightened padding */}
            <div className="p-6 flex flex-col flex-grow bg-white/40 texture-dots">
              <div className="flex-grow">
                <h3 className="font-black text-black text-2xl uppercase italic leading-tight group-hover:text-black transition-all truncate">
                  {project.title}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-0.5 w-4 bg-black/20"></div>
                  <p className="text-[9px] font-black text-black/30 uppercase tracking-widest">
                    {project.shots.length} Sequence Plates
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto flex gap-3 pt-4 border-t border-black/5">
                <button 
                  onClick={() => onSelectProject(project.id)} 
                  className="flex-grow pencil-button py-3.5 font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 active:scale-95"
                >
                  Enter Studio <ArrowRight size={14} />
                </button>
                <button 
                  onClick={() => onDeleteProject(project.id)} 
                  className="p-3.5 border-2 border-black/10 text-black/20 hover:text-red-600 hover:border-red-600/30 transition-all active:scale-95"
                  title="Archive project"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-[#EAE3D9]/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="sketch-card w-full max-w-lg p-12 relative animate-in zoom-in-95 texture-dots">
             <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-black/20 hover:text-black transition-colors">
               <X size={28} />
             </button>
             
             <div className="mb-10">
               <h2 className="text-4xl font-black text-black italic uppercase tracking-tighter leading-none mb-2">New Series</h2>
               <div className="h-1 w-16 bg-black/10 texture-hatch"></div>
             </div>

             <form onSubmit={(e) => { e.preventDefault(); onCreateProject(newTitle); setIsModalOpen(false); }} className="space-y-10">
               <div className="space-y-3">
                 <label className="text-[9px] font-black uppercase text-black/40 tracking-[0.4em]">Working Title</label>
                 <input 
                   autoFocus 
                   value={newTitle} 
                   onChange={e => setNewTitle(e.target.value)} 
                   placeholder="Untitled Production..." 
                   className="w-full bg-transparent border-b-2 border-black/10 text-black text-3xl font-black py-3 outline-none focus:border-black italic transition-colors placeholder:text-black/5" 
                 />
               </div>
               
               <button 
                 type="submit" 
                 disabled={!newTitle.trim()} 
                 className="w-full pencil-button py-6 font-black text-xl uppercase tracking-[0.5em] disabled:opacity-20 active:translate-y-1 transition-all"
               >
                 ACTION!
               </button>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};
