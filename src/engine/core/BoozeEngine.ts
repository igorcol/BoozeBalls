/**
 * Core: BoozeEngine (O Orquestrador)
 * Responsabilidade: Inicializa a GPU e a CPU, conecta os sistemas e
 * escuta o estado global (Zustand) para reset e slow-motion.
 */
import * as PIXI from "pixi.js";
import { PhysicsSystem } from "../systems/PhysicsSystem";
import { VFXSystem } from "../systems/VFXSystem";
import { CombatSystem } from "../systems/CombatSystem";
import { ActorManager } from "../entities/ActorManager";
import { AudioSystem } from "../systems/AudioSystem";
import { useGameStore } from "@/store/gameStore";

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

    // 2. Delegação de Tarefas Iniciais
    this.drawArenaBorder(width / 2, height / 2, arenaWidth, arenaHeight);
    this.physics.setupBoundaries(
      width / 2,
      height / 2,
      arenaWidth,
      arenaHeight,
    );
    this.actors.setupActors(arenaHeight);

    // 3. O Maestro Ouve o React (Zustand) para Reset e Efeitos de K.O.
    useGameStore.subscribe((state, prevState) => {
      // Voltou pro idle (clique no botão Rematch)
      if (state.status === "idle" && prevState.status === "finished") {
        this.actors.resetPositions(arenaHeight);
      }

      // Alguém morreu (Câmera lenta dramática e Implosão)
      if (state.status === "finished" && prevState.status === "fighting") {
        // Descobre quem foi o defunto
        const loserIndex = state.hpA <= 0 ? 0 : 1;
        const loser = this.actors.actors[loserIndex];

        // 1. Marca como morto (Inicia a animação de implosão no ActorManager)
        loser.isDead = true;

        // 2. Transforma em fantasma (isSensor = true faz a bola parar de bater nas paredes/adversário)
        loser.body.isSensor = true;

        // 3. Explosão visual massiva
        this.vfx.triggerDeathJuice(
          loser.body.position.x,
          loser.body.position.y,
        );

        // 4. Matrix Time (Fica em câmera lenta por 1.5s enquanto o React se prepara)
        this.physics.engine.timing.timeScale = 0.1;
        setTimeout(() => {
          this.physics.engine.timing.timeScale = 1;
        }, 1500);
      }
    });

    // 4. Conexão de Eventos (O Espião avisando o VFX, Áudio e Combate)
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

    // 5. Ignição
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

  // Ponte para o botão do React disparar a treta
  public startFight() {
    this.combat.startFight();
  }

  // Prevenção de Memory Leak absoluta
  public destroy() {
    console.log("D-DEV-COMMANDER: Desmontando Orquestrador e Sistemas...");
    this.physics.destroy();
    this.vfx.destroy();
    this.actors.destroy();
    this.audio.destroy();
    this.app.destroy({ removeView: true });
  }
}
