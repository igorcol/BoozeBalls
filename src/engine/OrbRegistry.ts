

export interface OrbConfig {
    id: string
    name: string
    radius: number      // Tamanho
    color: number       // Hex
    restitution: number // Elasticidade
    frictionAir: number // Resistencia do ar
    density: number     // Peso real na engine de fisica
}


// DB Local de "ScriptableObjects"
export const ORB_REGISTRY: Record<string, OrbConfig> = {
  PUFFER: {
    id: 'PUFFER',
    name: 'Puffer Green',
    radius: 45,        
    color: 0x00ff88,
    restitution: 1.01, 
    frictionAir: 0,
    density: 0.001,    
  },
  PISTON: {
    id: 'PISTON',
    name: 'Piston Blue',
    radius: 45,        
    color: 0x0088ff,
    restitution: 1.01,
    frictionAir: 0,
    density: 0.001,
  }
};