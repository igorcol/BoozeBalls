/**
 * System: VFXSystem
 * Gerencia todo o "Juice" visual e temporal do jogo.
 * Controla o Hit Stop (pausa na física), Camera Shake (tremor do palco) 
 * e o Object Pooling do sistema de Partículas.
 */
import * as PIXI from "pixi.js";
import { Engine } from "matter-js";

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

  constructor(app: PIXI.Application, engine: Engine) {
    this.app = app;
    this.engine = engine;
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
      // Tremor microscópico de Borda
      this.shakePower = Math.min(Math.max(impact * this.wallShakeMultiplier, 3), 8);
    } else {
      // Impacto Crítico: Hit Stop
      const stopDuration = Math.min(impact * 4, 100);
      this.engine.timing.timeScale = 0.05;
      setTimeout(() => {
        this.engine.timing.timeScale = 1;
      }, stopDuration);

      // Camera Shake
      this.shakePower = impact * this.critShakeMultiplier;

      // Emissão de Partículas
      const particleCount = Math.min(Math.floor(impact * 1.5), 30);
      this.emitParticles(x, y, particleCount);
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
  }

  public destroy() {
    this.particles = [];
  }
}