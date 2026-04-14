'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';

export default function GameOver() {
  const { status, winner, resetFight } = useGameStore();
  const [show, setShow] = useState(false);

 
  if (status !== 'finished' && show) {
    setShow(false);
  }

  // O Atraso: Só dispara se o status for finished.
  useEffect(() => {
    if (status === 'finished') {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!show || status !== 'finished') return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-500">
      <h2 className="text-8xl font-black text-white italic tracking-tighter uppercase mb-2 animate-pulse">
        K.O.
      </h2>
      <p className="text-2xl font-bold text-white/50 tracking-[0.2em] uppercase mb-12">
        {winner} WINS
      </p>

      <button 
        onClick={resetFight}
        className="px-12 py-4 text-xl font-black text-black bg-white rounded-full uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform cursor-pointer"
      >
        REMATCH
      </button>
    </div>
  );
}