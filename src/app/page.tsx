// src/app/page.tsx
'use client';

import Arena from '@/components/Arena';
import { useGameStore } from '@/store/gameStore';

export default function Home() {
  const status = useGameStore((state) => state.status);
  const startFight = useGameStore((state) => state.startFight);

  return (
    <main className="relative w-screen h-screen flex flex-col items-center justify-center bg-black">
      {/* O Canvas WebGL fica em Background */}
      <Arena />
      
      {/* Camada de UI Fricção Zero (Sobreposta) */}
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