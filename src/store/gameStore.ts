// src/store/gameStore.ts
import { create } from 'zustand';

interface GameState {
  status: 'idle' | 'fighting' | 'finished';
  hpA: number;
  hpB: number;
  winner: 'Puffer' | 'Piston' | null;
  startFight: () => void;
  applyDamage: (target: 'A' | 'B', amount: number) => void;
  resetFight: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  status: 'idle',
  hpA: 100,
  hpB: 100,
  winner: null,
  
  startFight: () => set({ status: 'fighting' }),
  
  applyDamage: (target, amount) => set((state) => {
    if (state.status !== 'fighting') return state;

    const newHpA = target === 'A' ? Math.max(0, state.hpA - amount) : state.hpA;
    const newHpB = target === 'B' ? Math.max(0, state.hpB - amount) : state.hpB;
    
    let newStatus: GameState['status'] = state.status;
    let newWinner: GameState['winner'] = state.winner;

    // Detecta o K.O. e trava o estado do jogo
    if (newHpA === 0) {
      newStatus = 'finished';
      newWinner = 'Piston';
    } else if (newHpB === 0) {
      newStatus = 'finished';
      newWinner = 'Puffer';
    }

    return { hpA: newHpA, hpB: newHpB, status: newStatus, winner: newWinner };
  }),

  resetFight: () => set({ status: 'idle', hpA: 100, hpB: 100, winner: null }),
}));