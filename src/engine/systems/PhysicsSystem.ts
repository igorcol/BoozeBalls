/**
 * System: PhysicsSystem
 * Gerencia o motor do Matter.js (CPU). Cria o mundo, 
 * define as fronteiras invisíveis (paredes) e expõe callbacks de colisão
 * para que outros sistemas (como o VFX) possam reagir sem acoplamento direto.
 */
import Matter, { Engine, Runner, World, Bodies, Body } from "matter-js";

export type CollisionCallback = (impact: number, isWallCollision: boolean, x: number, y: number, bodyA: Body, bodyB: Body) => void;

export class PhysicsSystem {
  public engine: Engine;
  private runner: Runner;
  private collisionListeners: CollisionCallback[] = [];

  constructor() {
    // Gravidade Zero para o caos contínuo
    this.engine = Engine.create({ gravity: { x: 0, y: 0 } });
    this.runner = Runner.create();
    
    this.setupCollisionDetection();
  }

  // Paredes da arena
  public setupBoundaries(cx: number, cy: number, arenaWidth: number, arenaHeight: number) {
    const wallThickness = 100;
    const options = { isStatic: true, restitution: 1.0, friction: 0 };

    const top = Bodies.rectangle(cx, cy - arenaHeight / 2 - wallThickness / 2, arenaWidth + wallThickness * 2, wallThickness, options);
    const bottom = Bodies.rectangle(cx, cy + arenaHeight / 2 + wallThickness / 2, arenaWidth + wallThickness * 2, wallThickness, options);
    const left = Bodies.rectangle(cx - arenaWidth / 2 - wallThickness / 2, cy, wallThickness, arenaHeight + wallThickness * 2, options);
    const right = Bodies.rectangle(cx + arenaWidth / 2 + wallThickness / 2, cy, wallThickness, arenaHeight + wallThickness * 2, options);

    World.add(this.engine.world, [top, bottom, left, right]);
  }

  // Adiciona corpos (esferas) ao mundo
  public addBodies(bodies: Body[]) {
    World.add(this.engine.world, bodies);
  }

  // Permite que outros arquivos escutem as colisões (Ex: VFXSystem vai usar isso)
  public onCollision(callback: CollisionCallback) {
    this.collisionListeners.push(callback);
  }

  // O Listener interno do Matter.js
  private setupCollisionDetection() {
    Matter.Events.on(this.engine, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        const velocityA = bodyA.velocity;
        const velocityB = bodyB.velocity;
        const impact = Math.sqrt(
          Math.pow(velocityA.x - velocityB.x, 2) + Math.pow(velocityA.y - velocityB.y, 2)
        );

        if (impact > 5) {
          const isWallCollision = bodyA.isStatic || bodyB.isStatic;
          const collisionX = pair.collision.supports[0]?.x || bodyA.position.x;
          const collisionY = pair.collision.supports[0]?.y || bodyA.position.y;

          // Avisa todos os sistemas que se inscreveram
          this.collisionListeners.forEach(listener => 
            listener(impact, isWallCollision, collisionX, collisionY, bodyA, bodyB)
          );
        }
      });
    });
  }

  public start() {
    Runner.run(this.runner, this.engine);
  }

  public destroy() {
    Runner.stop(this.runner);
    World.clear(this.engine.world, false);
    Engine.clear(this.engine);
    this.collisionListeners = [];
  }
}