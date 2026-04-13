import Matter, { Engine, Runner, World, Bodies, Body } from "matter-js";
import * as PIXI from "pixi.js";
import { ORB_REGISTRY, OrbConfig } from "./OrbRegistry";

export class BoozeEngine {
  private container: HTMLDivElement;
  private app: PIXI.Application;
  private engine: Engine;
  private runner: Runner;
  private shakePower: number = 0;

  private actors: {
    body: Body;
    container: PIXI.Container;
    graphic: PIXI.Graphics;
    hpText: PIXI.Text;
    hp: number;
  }[] = [];

  private particles: {
    sprite: PIXI.Graphics;
    life: number;
    vx: number;
    vy: number;
  }[] = [];

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.app = new PIXI.Application();

    this.engine = Engine.create({ gravity: { x: 0, y: 0 } });
    this.runner = Runner.create();
  }

  // === CONFIGS ===
  private arenaWidth: number = 0;
  private arenaHeight: number = 0;
  private initialImpactSpeed: number = 12; // Velocidade Y do choque frontal
  private initialChaosDeviation: number = 10; // Força do desvio aleatório no eixo X
  // Game Feel (Juice)
  private shakeDecay: number = 0.85; // Quão rápido o tremor some
  private wallShakeMultiplier: number = 0.6; // Aumentamos
  private critShakeMultiplier: number = 1.2; // Aumentamos

  public async init() {
    console.log(
      "BoozeEngine Inicializada. Aguardando injeção do WebGL/Matter.",
    );

    await this.app.init({
      resizeTo: this.container,
      backgroundColor: 0x000000,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });
    this.container.appendChild(this.app.canvas);

    this.setupBoundaries();
    this.setupSpheres();
    this.setupParticles();
    this.setupCollisionListener();

    Runner.run(this.runner, this.engine);
    this.app.ticker.add(() => this.syncPhysicsToGraphics());
  }

  private setupParticles() {
    console.log(
      "D-DEV-COMMANDER: Alocando memória para 100 partículas (Object Pooling)...",
    );
    for (let i = 0; i < 100; i++) {
      const p = new PIXI.Graphics();
      p.rect(-4, -4, 8, 8).fill(0xffffff);
      p.visible = false;

      this.app.stage.addChild(p);
      this.particles.push({ sprite: p, life: 0, vx: 0, vy: 0 });
    }
  }

  private setupBoundaries() {
    const { width, height } = this.app.screen;
    const cx = width / 2;
    const cy = height / 2;

    this.arenaWidth = Math.min(width * 0.9, 450);
    this.arenaHeight = Math.min(height * 0.7, 650);

    const wallThickness = 100;
    const options = { isStatic: true, restitution: 1.0, friction: 0 };

    const top = Bodies.rectangle(
      cx,
      cy - this.arenaHeight / 2 - wallThickness / 2,
      this.arenaWidth + wallThickness * 2,
      wallThickness,
      options,
    );
    const bottom = Bodies.rectangle(
      cx,
      cy + this.arenaHeight / 2 + wallThickness / 2,
      this.arenaWidth + wallThickness * 2,
      wallThickness,
      options,
    );
    const left = Bodies.rectangle(
      cx - this.arenaWidth / 2 - wallThickness / 2,
      cy,
      wallThickness,
      this.arenaHeight + wallThickness * 2,
      options,
    );
    const right = Bodies.rectangle(
      cx + this.arenaWidth / 2 + wallThickness / 2,
      cy,
      wallThickness,
      this.arenaHeight + wallThickness * 2,
      options,
    );

    World.add(this.engine.world, [top, bottom, left, right]);

    const arenaGraphic = new PIXI.Graphics();
    arenaGraphic
      .rect(
        cx - this.arenaWidth / 2,
        cy - this.arenaHeight / 2,
        this.arenaWidth,
        this.arenaHeight,
      )
      .stroke({ width: 4, color: 0xffffff, alpha: 0.05 })
      .stroke({ width: 1.5, color: 0xffffff, alpha: 0.9 });

    this.app.stage.addChildAt(arenaGraphic, 0);
  }

  private setupSpheres() {
    const { width, height } = this.app.screen;
    const cx = width / 2;
    const cy = height / 2;

    const configA = ORB_REGISTRY.PUFFER;
    const configB = ORB_REGISTRY.PISTON;

    const sphereA = Bodies.circle(
      cx,
      cy - this.arenaHeight * 0.3,
      configA.radius,
      {
        friction: 0,
        frictionAir: configA.frictionAir,
        restitution: configA.restitution,
        density: configA.density,
      },
    );

    const sphereB = Bodies.circle(
      cx,
      cy + this.arenaHeight * 0.3,
      configB.radius,
      {
        friction: 0,
        frictionAir: configB.frictionAir,
        restitution: configB.restitution,
        density: configB.density,
      },
    );

    const {
      container: contA,
      graphic: viewA,
      hpText: textA,
    } = this.createActorVisual(configA);
    const {
      container: contB,
      graphic: viewB,
      hpText: textB,
    } = this.createActorVisual(configB);

    this.app.stage.addChild(contA, contB);
    World.add(this.engine.world, [sphereA, sphereB]);

    this.actors.push({
      body: sphereA,
      container: contA,
      graphic: viewA,
      hpText: textA,
      hp: 100,
    });
    this.actors.push({
      body: sphereB,
      container: contB,
      graphic: viewB,
      hpText: textB,
      hp: 100,
    });
  }

  private createActorVisual(config: OrbConfig) {
    const container = new PIXI.Container();
    const graphic = this.createSphereGraphic(config.radius, config.color);

    const hpText = new PIXI.Text({
      text: "100",
      style: {
        fontFamily: "Arial, sans-serif",
        fontSize: Math.max(20, config.radius * 0.5), // Fonte dinâmica
        fontWeight: "bold",
        fill: 0xffffff,
      },
    });
    hpText.anchor.set(0.5);
    hpText.y = config.radius * 0.4; // Posição dinâmica baseada no tamanho

    container.addChild(graphic, hpText);
    return { container, graphic, hpText };
  }

  private createSphereGraphic(radius: number, color: number): PIXI.Graphics {
    const g = new PIXI.Graphics();
    g.circle(0, 0, radius).fill(color);

    // Olhos Goofy dinâmicos (escalam com a bola)
    const eyeOffset = radius * 0.3;
    const eyeY = -radius * 0.25;
    const eyeRadius = radius * 0.2;
    const pupilRadius = radius * 0.08;

    g.circle(-eyeOffset, eyeY, eyeRadius).fill(0xffffff);
    g.circle(eyeOffset, eyeY, eyeRadius).fill(0xffffff);
    g.circle(-eyeOffset, eyeY, pupilRadius).fill(0x000000);
    g.circle(eyeOffset, eyeY, pupilRadius).fill(0x000000);

    return g;
  }

  private syncPhysicsToGraphics() {
    // 1. Consumo do Shake (Efeito de dissipação da Câmera)
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

    // 2. Sincronização de Posição e Deformação (Squash & Stretch)
    for (const actor of this.actors) {
      actor.container.x = actor.body.position.x;
      actor.container.y = actor.body.position.y;

      const speed = Math.sqrt(
        actor.body.velocity.x ** 2 + actor.body.velocity.y ** 2,
      );
      const stretch = 1 + speed * 0.002;
      const squash = 1 / stretch;

      actor.graphic.scale.set(stretch, squash);
      actor.graphic.rotation = Math.atan2(
        actor.body.velocity.y,
        actor.body.velocity.x,
      );
    }

    // 3. Animação de Ciclo de Vida do Object Pooling (Partículas)
    for (const p of this.particles) {
      if (p.life > 0) {
        // Move baseado no vetor de velocidade com atrito de ar (desaceleração)
        p.sprite.x += p.vx;
        p.sprite.y += p.vy;
        p.vx *= 0.92;
        p.vy *= 0.92;

        p.life -= 0.04; // Decaimento da vida (morte progressiva)
        p.sprite.alpha = p.life; // Fica transparente

        // Encolhe proporcionalmente à vida (evita valores negativos que quebram o WebGL)
        p.sprite.scale.set(Math.max(p.life, 0));

        if (p.life <= 0) {
          p.sprite.visible = false; // Desativa e devolve ao Pool
        }
      }
    }
  }

  public startFight() {
    console.log("D-DEV-COMMANDER: Gatilho acionado. Injetando Caos...");

    // Esfera A (Topo): Joga para baixo (+Y) com desvio X
    Body.setVelocity(this.actors[0].body, {
      x: (Math.random() - 0.5) * this.initialChaosDeviation,
      y: this.initialImpactSpeed,
    });

    // Esfera B (Base): Joga para cima (-Y) com desvio X
    Body.setVelocity(this.actors[1].body, {
      x: (Math.random() - 0.5) * this.initialChaosDeviation,
      y: -this.initialImpactSpeed,
    });
  }

  public destroy() {
    console.log("D-DEV-COMMANDER: Limpando Arena...");
    Runner.stop(this.runner);
    World.clear(this.engine.world, false);
    Engine.clear(this.engine);
    this.app.destroy({ removeView: true });
  }

  // * =========== GAME FEEL ==============
  private setupCollisionListener() {
    Matter.Events.on(this.engine, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // Calcula a força bruta do impacto
        const velocityA = bodyA.velocity;
        const velocityB = bodyB.velocity;
        const impact = Math.sqrt(
          Math.pow(velocityA.x - velocityB.x, 2) +
            Math.pow(velocityA.y - velocityB.y, 2),
        );

        if (impact > 5) {
          // Se um dos corpos for estático (parede), é colisão de borda
          const isWallCollision = bodyA.isStatic || bodyB.isStatic;

          // Se for bola com bola, passamos a posição de colisão para as partículas no futuro
          const collisionX = pair.collision.supports[0]?.x || bodyA.position.x;
          const collisionY = pair.collision.supports[0]?.y || bodyA.position.y;

          this.applyJuice(impact, isWallCollision, collisionX, collisionY);
        }
      });
    });
  }

  private applyJuice(
    impact: number,
    isWallCollision: boolean,
    x: number,
    y: number,
  ) {
    if (isWallCollision) {
      // IMPACTO DE BORDA (Parede)
      // Garante um tremor mínimo de 3px para não passar despercebido, limitado a 8px
      this.shakePower = Math.min(
        Math.max(impact * this.wallShakeMultiplier, 3),
        8,
      );
    } else {
      // IMPACTO CRÍTICO (Bola vs Bola)
      const stopDuration = Math.min(impact * 4, 100);
      this.engine.timing.timeScale = 0.05;
      setTimeout(() => {
        this.engine.timing.timeScale = 1;
      }, stopDuration);

      // Tremor violento usando o novo multiplicador (sem limite máximo artificial)
      this.shakePower = impact * this.critShakeMultiplier;

      // Partículas
      const particleCount = Math.min(Math.floor(impact * 1.5), 30);
      this.emitParticles(x, y, particleCount);
    }
  }

  private emitParticles(x: number, y: number, amount: number) {
    let emitted = 0;
    for (const p of this.particles) {
      if (p.life <= 0) {
        // Pega apenas partículas "mortas" na memória
        p.sprite.x = x;
        p.sprite.y = y;
        p.sprite.visible = true;
        p.sprite.alpha = 1;

        // Explosão radial (direções aleatórias 360º)
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2; // Força da ejeção
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;

        p.life = 1.0; // Vida cheia (100%)
        emitted++;

        if (emitted >= amount) break; // Para quando ejetar a quantidade solicitada
      }
    }
  }
}