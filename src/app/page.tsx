// src/app/page.tsx
'use client';

import Arena from '@/components/Arena';
import { useGameStore } from '@/store/gameStore';

export default function Home() {
  const { status, startFight, hpA, hpB } = useGameStore();

  return (
    <main className="relative w-screen h-screen flex flex-col items-center justify-center bg-black overflow-hidden">
      <Arena />
      
      {/* HUD de Combate (OLED Style) */}
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

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-32 pointer-events-none">
        {status === 'idle' && (
          <button 
            onClick={startFight}
            className="pointer-events-auto px-16 py-5 text-3xl font-black text-black bg-white rounded-full uppercase tracking-widest shadow-[0_0_40px_rgba(255,255,255,0.8)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            FIGHT
          </button>
        )}
      </div>
    </main>
  );
}