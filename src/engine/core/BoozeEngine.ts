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
import { BulgePinchFilter, CRTFilter } from "pixi-filters";

export class BoozeEngine {
  private container: HTMLDivElement;
  private app: PIXI.Application;

  // 👔 Os Gerentes (Sistemas)
  private physics: PhysicsSystem;
  private vfx: VFXSystem;
  private actors: ActorManager;
  private combat: CombatSystem;
  private audio: AudioSystem;
  private crtFilter!: CRTFilter;

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

    // ==========================================
    // 📺 5. POST-PROCESSING PIPELINE (SHADERS)
    // ==========================================

    // Filtro 1: Curvatura da Lente (Tubo de TV Antiga)
    const bulgeFilter = new BulgePinchFilter({
      center: [0.5, 0.5],
      radius: Math.max(width, height) * 0.6, // Pega a tela toda
      strength: 0.5, // Curvatura sutil (Valores altos distorcem demais)
    });

    // Filtro 2: Estética VHS e Scanlines
    this.crtFilter = new CRTFilter({
      vignetting: 0.3, // Bordas escuras
      vignettingAlpha: 0.8,
      lineWidth: 2, // Espessura das scanlines
      noise: 0.25, // Granulação de VHS
      noiseSize: 1.5,
    });

    // 🚨 A LINHA SALVADORA QUE IMPEDE O CORTE DAS BORDAS 🚨
    this.app.stage.filterArea = this.app.screen;

    // Engole o palco inteiro com os filtros na ordem correta (Bulge -> CRT -> Glitch)
    this.app.stage.filters = [
      bulgeFilter,
      this.crtFilter,
      this.vfx.glitchFilter,
    ];

    // ==========================================
    // 6. Ignição
    // ==========================================
    this.physics.start();
    this.app.ticker.add(() => this.loop());
  }

  // O Maestro rege os gerentes a cada frame (60/120Hz)
  private loop() {
    this.actors.syncAll();
    this.vfx.update();

    // Anima a estática da fita VHS a cada frame
    if (this.crtFilter) {
      this.crtFilter.time += 0.5;
    }
  }

  // Desenhado aqui pois é puramente o cenário estático de fundo
  private drawArenaBorder(cx: number, cy: number, w: number, h: number) {
    const bgName = "arena-bg";
    const oldGlow = this.app.stage.getChildByLabel(bgName + "-glow");
    const oldCore = this.app.stage.getChildByLabel(bgName + "-core");
    if (oldGlow) oldGlow.destroy();
    if (oldCore) oldCore.destroy();

    // Objeto 1: O Fundo e o Glow Neon (Grosso)
    const glow = new PIXI.Graphics();
    glow.label = bgName + "-glow";
    glow.rect(cx - w / 2, cy - h / 2, w, h);
    glow.fill({ color: 0x00ffcc, alpha: 0.05 }); // Fundo levemente neon
    glow.stroke({ width: 16, color: 0x00ffcc, alpha: 0.35 });

    // Objeto 2: O Núcleo do Laser (Branco puro)
    const core = new PIXI.Graphics();
    core.label = bgName + "-core";
    core.rect(cx - w / 2, cy - h / 2, w, h);
    core.stroke({ width: 2, color: 0xffffff, alpha: 1 });

    // Adiciona na base do palco
    this.app.stage.addChildAt(glow, 0);
    this.app.stage.addChildAt(core, 1);
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
