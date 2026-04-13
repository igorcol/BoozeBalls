// src/store/gameStore.ts
import { create } from 'zustand';

interface GameState {
  status: 'idle' | 'fighting' | 'finished';
  startFight: () => void;
  finishFight: () => void;
  resetFight: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  status: 'idle',
  
  // Transições de estado
  startFight: () => set({ status: 'fighting' }),
  finishFight: () => set({ status: 'finished' }),
  resetFight: () => set({ status: 'idle' }),
}));