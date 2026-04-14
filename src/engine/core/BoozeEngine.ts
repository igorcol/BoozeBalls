/**
 * Core: BoozeEngine (O Orquestrador)
 * Responsabilidade: Inicializa a GPU e a CPU e conecta os sistemas.
 * Este arquivo NÃO contém lógica de jogo, apenas delega tarefas aos Managers.
 */
import * as PIXI from "pixi.js";
import { PhysicsSystem } from "../systems/PhysicsSystem";
import { VFXSystem } from "../systems/VFXSystem";
import { CombatSystem } from "../systems/CombatSystem";
import { ActorManager } from "../entities/ActorManager";
import { AudioSystem } from "../systems/AudioSystem";

export class BoozeEngine {
  private container: HTMLDivElement;
  private app: PIXI.Application;

  // 👔 Os Gerentes (Sistemas)
  private physics: PhysicsSystem;
  private vfx: VFXSystem;
  private actors: ActorManager;
  private combat: CombatSystem;
  private audio: AudioSystem;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.app = new PIXI.Application();

    // 1. Instanciação Injetada
    this.physics = new PhysicsSystem();
    this.vfx = new VFXSystem(this.app, this.physics.engine);
    this.actors = new ActorManager(this.app, this.physics);

    this.audio = new AudioSystem();
    this.combat = new CombatSystem(this.actors, this.audio);
  }

  public async init() {
    console.log("D-DEV-COMMANDER: Orquestrador BoozeEngine Iniciando...");

    // Setup do Canvas
    await this.app.init({
      resizeTo: this.container,
      backgroundColor: 0x000000,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });
    this.container.appendChild(this.app.canvas);

    const { width, height } = this.app.screen;
    const arenaWidth = Math.min(width * 0.9, 450);
    const arenaHeight = Math.min(height * 0.7, 650);

    // Delegação de Tarefas Iniciais
    this.drawArenaBorder(width / 2, height / 2, arenaWidth, arenaHeight);
    this.physics.setupBoundaries(
      width / 2,
      height / 2,
      arenaWidth,
      arenaHeight,
    );
    this.actors.setupActors(arenaHeight);

    // Conexão de Eventos
    this.physics.onCollision(
      (impact, isWallCollision, x, y, bodyA, bodyB, normal) => {
        this.vfx.triggerImpactJuice(impact, isWallCollision, x, y);

        if (isWallCollision) {
          this.audio.playWallHit(impact);
        } else {
          this.audio.playActorHit(impact);
          this.combat.processImpact(impact, bodyA, bodyB, normal);
        }
      },
    );

    // Inicio
    this.physics.start();
    this.app.ticker.add(() => this.loop());
  }

  // O Maestro rege os gerentes a cada frame (60/120Hz)
  private loop() {
    this.actors.syncAll();
    this.vfx.update();
  }

  // Desenhado aqui pois é puramente o cenário estático de fundo
  private drawArenaBorder(cx: number, cy: number, w: number, h: number) {
    const arenaGraphic = new PIXI.Graphics();
    arenaGraphic
      .rect(cx - w / 2, cy - h / 2, w, h)
      .stroke({ width: 4, color: 0xffffff, alpha: 0.05 })
      .stroke({ width: 1.5, color: 0xffffff, alpha: 0.9 });
    this.app.stage.addChildAt(arenaGraphic, 0);
  }

  // Ponte para o botão do React (Zustand) disparar
  public startFight() {
    this.combat.startFight();
  }

  // Prevenção de Memory Leak
  public destroy() {
    console.log("D-DEV-COMMANDER: Desmontando Orquestrador e Sistemas...");
    this.physics.destroy();
    this.vfx.destroy();
    this.actors.destroy();
    this.audio.destroy();
    this.app.destroy({ removeView: true });
  }
}
