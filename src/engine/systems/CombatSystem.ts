/**
 * System: CombatSystem
 * Regras de negócio e gatilhos de estado.
 * Aplica as forças iniciais da luta e, no futuro, gerenciará o cálculo
 * de HP e as condições de vitória/derrota.
 */
import { Body } from "matter-js";
import { ActorManager } from "../entities/ActorManager";
import { AudioSystem } from "./AudioSystem";
import { useGameStore } from "@/store/gameStore";

export class CombatSystem {
  private actorManager: ActorManager;
  private audioSystem: AudioSystem

  // ----- Parâmetros de Injeção de Força
  private initialImpactSpeed: number = 12; // Velocidade Y do choque frontal
  private initialChaosDeviation: number = 10; // Força do desvio aleatório no eixo X
  private damageMultiplier: number = 0.8; // Multiplicador de força -> HP

  // Constructor
  constructor(actorManager: ActorManager, audioSystem: AudioSystem) {
    this.actorManager = actorManager;
    this.audioSystem = audioSystem;
  }

  // O Gatilho acionado pelo React (UI)
  public startFight() {
    this.audioSystem.unlock();
    const { status, resetFight, startFight } = useGameStore.getState();

    // Se a luta já acabou, o primeiro clique reseta, o segundo começa
    if (status === 'finished') {
      resetFight();
      return;
    }

    startFight();

    const actors = this.actorManager.actors;
    if (actors.length < 2) return;

    Body.setVelocity(actors[0].body, {
      x: (Math.random() - 0.5) * this.initialChaosDeviation,
      y: this.initialImpactSpeed,
    });

    Body.setVelocity(actors[1].body, {
      x: (Math.random() - 0.5) * this.initialChaosDeviation,
      y: -this.initialImpactSpeed,
    });
  }

  // O "Cérebro" do Dano
  public processImpact(impact: number, bodyA: Body, bodyB: Body, normal: {x: number, y: number}) {
    const { status, applyDamage, hpA, hpB } = useGameStore.getState();
    if (status !== 'fighting') return;

    //  Calcula a projeção da velocidade no eixo da colisão 
    const dotA = (bodyA.velocity.x * normal.x) + (bodyA.velocity.y * normal.y);
    const dotB = (bodyB.velocity.x * normal.x) + (bodyB.velocity.y * normal.y);

    // Calcula a Força individual (Momento = Massa * Velocidade Direcional)
    const forceA = Math.abs(dotA) * bodyA.mass;
    const forceB = Math.abs(dotB) * bodyB.mass;

    // Aplica o Dano Cruzado
    const damageToA = Math.floor(forceB * this.damageMultiplier);
    const damageToB = Math.floor(forceA * this.damageMultiplier);

    const actors = this.actorManager.actors;

    // Verifica quem é o bodyA e o bodyB 
    if (bodyA === actors[0].body || bodyB === actors[0].body) {
      // Se a bola 0 participou, ela toma o dano que veio da OUTRA bola
      const dmg = bodyA === actors[0].body ? damageToA : damageToB;
      if (dmg > 0) applyDamage('A', dmg);
    }
    
    if (bodyA === actors[1].body || bodyB === actors[1].body) {
      // Se a bola 1 participou, ela toma o dano que veio da OUTRA bola
      const dmg = bodyA === actors[1].body ? damageToA : damageToB;
      if (dmg > 0) applyDamage('B', dmg);
    }

    // Verificação de K.O.
    const currentHP = useGameStore.getState();
    if (currentHP.hpA <= 0 || currentHP.hpB <= 0) {
      this.resolveMatch();
    }
  }

  private resolveMatch() {
    console.log("D-DEV-COMMANDER: K.O. Detectado!");
    useGameStore.setState({ status: 'finished' });
    
    // Para as bolas imediatamente para dar foco ao vencedor
    this.actorManager.actors.forEach(a => Body.setVelocity(a.body, { x: 0, y: 0 }));
  }
}