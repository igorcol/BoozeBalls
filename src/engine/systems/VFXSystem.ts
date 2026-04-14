/**
 * System: VFXSystem
 * Gerencia todo o "Juice" visual e temporal do jogo.
 * Controla o Hit Stop (pausa na física), Camera Shake (tremor do palco) 
 * e o Object Pooling do sistema de Partículas.
 */
import * as PIXI from "pixi.js";
import { Engine } from "matter-js";
import { GlitchFilter } from "pixi-filters";

export class VFXSystem {
  private app: PIXI.Application;
  private engine: Engine; 

  // ---- Game Feel Configs ----
  private shakePower: number = 0;
  private shakeDecay: number = 0.85;
  private wallShakeMultiplier: number = 0.6;
  private critShakeMultiplier: number = 1.2;

  // Memória Pré-Alocada
  private particles: { sprite: PIXI.Graphics; life: number; vx: number; vy: number }[] = [];

  // --- Filtro de Glitch
  public glitchFilter: GlitchFilter;
  private glitchTimer: number = 0;

  constructor(app: PIXI.Application, engine: Engine) {
    this.app = app;
    this.engine = engine;

    // Setup do Glitch (Desligado por padrão)
    this.glitchFilter = new GlitchFilter({
      slices: 6,
      offset: 15,
      direction: 0, // Horizontal
      fillMode: 2, // Transparent
      average: false,
    });
    this.glitchFilter.enabled = false;

    this.setupParticles();
  }

  private setupParticles() {
    console.log("D-DEV-COMMANDER: VFXSystem alocando Object Pooling...");
    for (let i = 0; i < 100; i++) {
      const p = new PIXI.Graphics();
      p.rect(-4, -4, 8, 8).fill(0xffffff);
      p.visible = false;

      this.app.stage.addChild(p);
      this.particles.push({ sprite: p, life: 0, vx: 0, vy: 0 });
    }
  }

  // O Trigger que será disparado pela Física
  public triggerImpactJuice(impact: number, isWallCollision: boolean, x: number, y: number) {
    if (isWallCollision) {
      this.shakePower = Math.min(Math.max(impact * this.wallShakeMultiplier, 3), 8);
    } else {
      const stopDuration = Math.min(impact * 4, 100);
      this.engine.timing.timeScale = 0.05;
      setTimeout(() => { this.engine.timing.timeScale = 1; }, stopDuration);

      this.shakePower = impact * this.critShakeMultiplier;
      const particleCount = Math.min(Math.floor(impact * 1.5), 30);
      this.emitParticles(x, y, particleCount);

      // 💥 NOVO: Glitch em pancadas fortes
      if (impact > 15) {
        this.activateGlitch(10); // 10 frames de glitch
      }
    }
  }



  private emitParticles(x: number, y: number, amount: number) {
    let emitted = 0;
    for (const p of this.particles) {
      if (p.life <= 0) {
        p.sprite.x = x;
        p.sprite.y = y;
        p.sprite.visible = true;
        p.sprite.alpha = 1;

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;

        p.life = 1.0;
        emitted++;

        if (emitted >= amount) break;
      }
    }
  }

  // Gatilho exclusivo de Morte (Zeigarnik Reset)
  public triggerDeathJuice(x: number, y: number) {
    this.shakePower = 25; 
    this.emitParticles(x, y, 60);
    this.activateGlitch(30); // Tela rasga na morte
  }

  // Ativador de Glitch
  private activateGlitch(frames: number) {
    this.glitchTimer = frames;
    this.glitchFilter.enabled = true;
  }


  // O motor visual que rodará a cada frame
  public update() {
    // Resolve o Tremor
    if (this.shakePower > 0) {
      this.app.stage.x = (Math.random() - 0.5) * this.shakePower;
      this.app.stage.y = (Math.random() - 0.5) * this.shakePower;
      this.shakePower *= this.shakeDecay;

      if (this.shakePower < 0.5) {
        this.shakePower = 0;
        this.app.stage.x = 0;
        this.app.stage.y = 0;
      }
    }

    // Resolve o Ciclo de Vida das Partículas
    for (const p of this.particles) {
      if (p.life > 0) {
        p.sprite.x += p.vx;
        p.sprite.y += p.vy;
        p.vx *= 0.92;
        p.vy *= 0.92;

        p.life -= 0.04;
        p.sprite.alpha = p.life;
        p.sprite.scale.set(Math.max(p.life, 0));

        if (p.life <= 0) {
          p.sprite.visible = false;
        }
      }
    }

    // Resolve o Timer do Glitch
    if (this.glitchTimer > 0) {
      this.glitchTimer--;
      this.glitchFilter.seed = Math.random(); // Deixa o glitch caótico a cada frame
      this.glitchFilter.offset = Math.random() * 20 + 5;
      
      if (this.glitchTimer <= 0) {
        this.glitchFilter.enabled = false;
      }
    } else {
      // Glitch Passivo (0.3% de chance de dar um pulinho na tela do nada)
      if (Math.random() < 0.003) {
        this.activateGlitch(3);
      }
    }
  }


  public destroy() {
    this.particles = [];
  }
}