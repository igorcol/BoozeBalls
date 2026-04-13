import { Engine, Runner, World, Bodies, Body } from "matter-js";
import * as PIXI from "pixi.js";

export class BoozeEngine {
  private container: HTMLDivElement;
  private app: PIXI.Application;
  private engine: Engine;
  private runner: Runner;

  private arenaWidth: number = 0;
  private arenaHeight: number = 0;

  // Mapeamento 1:1 entre o corpo físico e a representação visual
  private actors: {
    body: Body;
    container: PIXI.Container;
    graphic: PIXI.Graphics;
    hpText: PIXI.Text;
    hp: number;
  }[] = [];

  // Partículas (Object Pooling)
  private particles: {
    sprite: PIXI.Graphics;
    life: number;
    vx: number;
    vy: number;
  }[] = [];

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.app = new PIXI.Application();

    // Gravidade Zero para movimento livre na arena
    this.engine = Engine.create({ gravity: { x: 0, y: 0 } });
    this.runner = Runner.create();
  }

  public async init() {
    console.log(
      "D-DEV-COMMANDER: BoozeEngine Inicializada. Aguardando injeção do WebGL/Matter.",
    );

    // Setup do PixiJS V8
    await this.app.init({
      resizeTo: this.container,
      backgroundColor: 0x000000,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });
    this.container.appendChild(this.app.canvas);

    // Setup do Mundo Físico
    this.setupBoundaries();
    this.setupSpheres();

    // Ativa o mundo fisico
    Runner.run(this.runner, this.engine);

    // Ticker de retenção (Render loop a 60/120Hz)
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

  // * Cria limites
  private setupBoundaries() {
    const { width, height } = this.app.screen;
    const cx = width / 2;
    const cy = height / 2;

    // Define o tamanho da arena de forma responsiva, mas mantendo a proporção de "Portrait" (Retrato)
    this.arenaWidth = Math.min(width * 0.9, 450);
    this.arenaHeight = Math.min(height * 0.7, 650);

    const wallThickness = 100; // Paredes grossas fora da tela para evitar que as esferas "vazem" em altas velocidades
    const options = { isStatic: true, restitution: 1.0, friction: 0 };

    // 1. O Colisor Físico (Matter.js) - Posicionado ao redor do centro
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

    // 2. O Visual do Ringue (PixiJS) - Estética OLED (Minimalista e Elegante)
    const arenaGraphic = new PIXI.Graphics();

    arenaGraphic
      .rect(
        cx - this.arenaWidth / 2,
        cy - this.arenaHeight / 2,
        this.arenaWidth,
        this.arenaHeight,
      )
      // Um stroke muito suave atrás para dar um aspecto "premium" sem virar neon barato
      .stroke({ width: 4, color: 0xffffff, alpha: 0.05 })
      // A linha principal afiada
      .stroke({ width: 1.5, color: 0xffffff, alpha: 0.9 });

    // Garante que o desenho do ringue fique no fundo da pilha de renderização
    this.app.stage.addChildAt(arenaGraphic, 0);
  }

  // * Cria as esferas
  private setupSpheres() {
    const { width, height } = this.app.screen;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 35;

    const physicsOptions = { friction: 0, frictionAir: 0, restitution: 1.01 };

    const sphereA = Bodies.circle(
      cx,
      cy - this.arenaHeight * 0.3,
      radius,
      physicsOptions,
    );
    const sphereB = Bodies.circle(
      cx,
      cy + this.arenaHeight * 0.3,
      radius,
      physicsOptions,
    );

    // Cria as instâncias visuais
    const {
      container: contA,
      graphic: viewA,
      hpText: textA,
    } = this.createActorVisual(radius, 0x00ff88);
    const {
      container: contB,
      graphic: viewB,
      hpText: textB,
    } = this.createActorVisual(radius, 0x0088ff);

    this.app.stage.addChild(contA, contB);
    World.add(this.engine.world, [sphereA, sphereB]);

    // Registra os atores com HP inicial de 100
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

  // Desenha os círculos proceduralmente sem depender de imagens
  private createSphereGraphic(radius: number, color: number): PIXI.Graphics {
    const g = new PIXI.Graphics();
    // Corpo principal
    g.circle(0, 0, radius).fill(color);

    // Olhos Goofy (Minimalismo)
    g.circle(-12, -10, 8).fill(0xffffff); // Olho esq
    g.circle(12, -10, 8).fill(0xffffff); // Olho dir
    g.circle(-12, -10, 3).fill(0x000000); // Pupila esq
    g.circle(12, -10, 3).fill(0x000000); // Pupila dir

    return g;
  }

  private syncPhysicsToGraphics() {
    for (const actor of this.actors) {
      actor.container.x = actor.body.position.x;
      actor.container.y = actor.body.position.y;

      actor.graphic.rotation = actor.body.angle;
    }
  }

  public destroy() {
    console.log("D-DEV-COMMANDER: Limpando Arena...");
    Runner.stop(this.runner);
    World.clear(this.engine.world, false);
    Engine.clear(this.engine);
    this.app.destroy({ removeView: true });
  }

  private createActorVisual(radius: number, color: number) {
    const container = new PIXI.Container();
    const graphic = this.createSphereGraphic(radius, color);

    const hpText = new PIXI.Text({
      text: "100",
      style: {
        fontFamily: "Arial, sans-serif",
        fontSize: 24,
        fontWeight: "bold",
        fill: 0xffffff,
      },
    });
    hpText.anchor.set(0.5);
    hpText.y = 15;

    container.addChild(graphic, hpText);
    return { container, graphic, hpText };
  }

  // * Start Fight
  public startFight() {
    console.log("D-DEV-COMMANDER: Gatilho acionado. Injetando Caos...");

    const speed = 25; // Velocidade inicial brutal

    // Pegamos a Esfera A (Topo) e jogamos para baixo com um pequeno desvio X aleatório
    Body.setVelocity(this.actors[0].body, {
      x: (Math.random() - 0.5) * 15,
      y: speed,
    });

    // Pegamos a Esfera B (Base) e jogamos para cima com um pequeno desvio X aleatório
    Body.setVelocity(this.actors[1].body, {
      x: (Math.random() - 0.5) * 15,
      y: -speed,
    });
  }
}
