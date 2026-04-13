// src/components/Arena.tsx
'use client';

import { useEffect, useRef } from 'react';
import { BoozeEngine } from '@/engine/BoozeEngine';
import { useGameStore } from '@/store/gameStore'; 

export default function Arena() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BoozeEngine | null>(null);
  const status = useGameStore((state) => state.status); 

  useEffect(() => {
    if (!containerRef.current) return;

    if (!engineRef.current) {
      engineRef.current = new BoozeEngine(containerRef.current);
      engineRef.current.init();
    }

    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (status === 'fighting' && engineRef.current) {
      engineRef.current.startFight();
    }
  }, [status]);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
}