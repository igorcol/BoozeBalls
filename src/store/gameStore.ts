// src/store/gameStore.ts
import { create } from 'zustand';

interface GameState {
  status: 'idle' | 'fighting' | 'finished';
  hpA: number;
  hpB: number;
  startFight: () => void;
  applyDamage: (target: 'A' | 'B', amount: number) => void;
  resetFight: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  status: 'idle',
  hpA: 100,
  hpB: 100,
  
  startFight: () => set({ status: 'fighting' }),
  
  applyDamage: (target, amount) => set((state) => ({
    hpA: target === 'A' ? Math.max(0, state.hpA - amount) : state.hpA,
    hpB: target === 'B' ? Math.max(0, state.hpB - amount) : state.hpB,
  })),

  resetFight: () => set({ status: 'idle', hpA: 100, hpB: 100 }),
}));