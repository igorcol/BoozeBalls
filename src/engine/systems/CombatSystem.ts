/**
 * System: CombatSystem
 * Regras de negócio e gatilhos de estado.
 * Aplica as forças iniciais da luta e, no futuro, gerenciará o cálculo
 * de HP e as condições de vitória/derrota.
 */
import { Body } from "matter-js";
import { ActorManager } from "../entities/ActorManager";
import { AudioSystem } from "./AudioSystem";

export class CombatSystem {
  private actorManager: ActorManager;
  private audioSystem: AudioSystem

  // Parâmetros de Injeção de Força
  private initialImpactSpeed: number = 12; // Velocidade Y do choque frontal
  private initialChaosDeviation: number = 10; // Força do desvio aleatório no eixo X

  constructor(actorManager: ActorManager, audioSystem: AudioSystem) {
    this.actorManager = actorManager;
    this.audioSystem = audioSystem;
  }

  // O Gatilho acionado pelo React (UI)
  public startFight() {
    console.log("D-DEV-COMMANDER: CombatSystem disparando caos...");

    this.audioSystem.unlock();

    const actors = this.actorManager.actors;
    if (actors.length < 2) return; // Segurança

    // Esfera A (Topo): Joga para baixo (+Y) com desvio X
    Body.setVelocity(actors[0].body, {
      x: (Math.random() - 0.5) * this.initialChaosDeviation,
      y: this.initialImpactSpeed,
    });

    // Esfera B (Base): Joga para cima (-Y) com desvio X
    Body.setVelocity(actors[1].body, {
      x: (Math.random() - 0.5) * this.initialChaosDeviation,
      y: -this.initialImpactSpeed,
    });
  }
}