
import React, { useMemo } from 'react';

export const CinematicBackground: React.FC = () => {
  const segments = useMemo(() => {
    return [...Array(25)].map((_, i) => ({
      id: i,
      width: Math.random() * 30 + 10 + '%',
      height: Math.random() * 30 + 10 + '%',
      top: Math.random() * 80 + '%',
      left: Math.random() * 80 + '%',
      rotate: (Math.random() - 0.5) * 5 + 'deg',
      opacity: Math.random() * 0.1 + 0.05,
      hatchType: i % 3 === 0 ? 'texture-hatch' : i % 3 === 1 ? 'texture-hatch-v' : '',
    }));
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-[#EAE3D9] overflow-hidden">
      {/* Mural Grid Lines */}
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-10 pointer-events-none">
        {[...Array(144)].map((_, i) => (
          <div key={i} className="border-[0.5px] border-black/20" />
        ))}
      </div>

      {/* Sketched Segments */}
      {segments.map((s) => (
        <div 
          key={s.id}
          className={`absolute transition-all duration-[3000ms] border-[0.5px] border-black/10 ${s.hatchType}`}
          style={{
            width: s.width,
            height: s.height,
            top: s.top,
            left: s.left,
            transform: `rotate(${s.rotate})`,
            opacity: s.opacity,
          }}
        />
      ))}

      {/* Heavy Paper Grain Overlay */}
      <div className="absolute inset-0 texture-grain pointer-events-none" />
      
      {/* Vignet for depth */}
      <div className="absolute inset-0 bg-radial-[circle,transparent_40%,rgba(0,0,0,0.05)] pointer-events-none" />
    </div>
  );
};
