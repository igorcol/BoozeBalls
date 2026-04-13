/**
 * System: ActorManager
 * Fábrica e Controlador de Entidades.
 * Lê os dados do OrbRegistry, cria os corpos físicos (enviando pro PhysicsSystem),
 * cria os containers visuais (enviando pro PixiJS) e mantém os dois sincronizados
 * frame a frame, incluindo deformação visual (Squash & Stretch).
 */
import * as PIXI from "pixi.js";
import { Body, Bodies } from "matter-js";
import { ORB_REGISTRY, OrbConfig } from "../core/OrbRegistry";
import { PhysicsSystem } from "../systems/PhysicsSystem";

export interface Actor {
  body: Body;
  container: PIXI.Container;
  graphic: PIXI.Graphics;
  hpText: PIXI.Text;
  hp: number;
}

export class ActorManager {
  private app: PIXI.Application;
  private physics: PhysicsSystem;
  
  // Exposto publicamente para que o CombatSystem possa aplicar forças (startFight)
  public actors: Actor[] = []; 

  constructor(app: PIXI.Application, physics: PhysicsSystem) {
    this.app = app;
    this.physics = physics;
  }

  // Monta as esferas e injeta nos motores de Render e Física
  public setupActors(arenaHeight: number) {
    const { width, height } = this.app.screen;
    const cx = width / 2;
    const cy = height / 2;

    const configA = ORB_REGISTRY.PUFFER;
    const configB = ORB_REGISTRY.PISTON;

    const sphereA = Bodies.circle(cx, cy - arenaHeight * 0.3, configA.radius, {
      friction: 0, frictionAir: configA.frictionAir, restitution: configA.restitution, density: configA.density,
    });

    const sphereB = Bodies.circle(cx, cy + arenaHeight * 0.3, configB.radius, {
      friction: 0, frictionAir: configB.frictionAir, restitution: configB.restitution, density: configB.density,
    });

    const { container: contA, graphic: viewA, hpText: textA } = this.createActorVisual(configA);
    const { container: contB, graphic: viewB, hpText: textB } = this.createActorVisual(configB);

    // Despacha para os gerentes
    this.app.stage.addChild(contA, contB);
    this.physics.addBodies([sphereA, sphereB]);

    // Salva o estado
    this.actors.push({ body: sphereA, container: contA, graphic: viewA, hpText: textA, hp: 100 });
    this.actors.push({ body: sphereB, container: contB, graphic: viewB, hpText: textB, hp: 100 });
  }

  private createActorVisual(config: OrbConfig) {
    const container = new PIXI.Container();
    const graphic = this.createSphereGraphic(config.radius, config.color);

    const hpText = new PIXI.Text({
      text: "100",
      style: {
        fontFamily: "Arial, sans-serif",
        fontSize: Math.max(20, config.radius * 0.5),
        fontWeight: "bold",
        fill: 0xffffff,
      },
    });
    hpText.anchor.set(0.5);
    hpText.y = config.radius * 0.4;

    container.addChild(graphic, hpText);
    return { container, graphic, hpText };
  }

  private createSphereGraphic(radius: number, color: number): PIXI.Graphics {
    const g = new PIXI.Graphics();
    g.circle(0, 0, radius).fill(color);

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

  // Roda a cada frame (chamado pelo Orquestrador)
  public syncAll() {
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
  }

  public destroy() {
    this.actors = [];
  }
}