'use client';

import { useGameStore } from '@/store/gameStore';

export default function HUD() {
  const { hpA, hpB } = useGameStore();

  return (
    <div className="absolute top-12 w-full max-w-112.5 px-6 flex justify-between items-start z-20 pointer-events-none">
      {/* Lado Esquerdo (Bola de Cima/Puffer) */}
      <div className="flex flex-col gap-2 w-full pr-4">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-black tracking-widest uppercase opacity-50">Puffer</span>
          <span className="text-xl font-black italic tabular-nums">{Math.ceil(hpA)}</span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-300 ease-out" 
            style={{ width: `${hpA}%` }} 
          />
        </div>
      </div>

      {/* Lado Direito (Bola de Baixo/Piston) */}
      <div className="flex flex-col gap-2 w-full pl-4 text-right">
        <div className="flex flex-row-reverse justify-between items-end">
          <span className="text-[10px] font-black tracking-widest uppercase opacity-50">Piston</span>
          <span className="text-xl font-black italic tabular-nums">{Math.ceil(hpB)}</span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex justify-end">
          <div 
            className="h-full bg-white transition-all duration-300 ease-out" 
            style={{ width: `${hpB}%` }} 
          />
        </div>
      </div>
    </div>
  );
}