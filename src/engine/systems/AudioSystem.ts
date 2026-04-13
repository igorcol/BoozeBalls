/**
 * System: AudioSystem
 * Responsabilidade: Gerencia o AudioContext, contorna as políticas de Autoplay
 * do navegador e sintetiza/reproduz áudio espacial baseado em física.
 */

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private isUnlocked: boolean = false;

  // ---- Configurações de Mixagem
  private globalVolume: number = 0.5;

  constructor() {
    // Não inicia o AudioContext aqui no construtor para evitar warning de "Autoplay Policy". Ele será criado no primeiro clique.
  }

  // Chamado pela UI/CombatSystem no momento do clique no botão FIGHT
  public unlock() {
    if (this.isUnlocked) return;

    console.log("D-DEV-COMMANDER: Desbloqueando AudioContext...");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isUnlocked = true;
  }

  // Chamado pela Física a cada colisão (Bola vs Bola)
  public playActorHit(impact: number) {
    if (!this.isUnlocked || !this.ctx) return;

    // Normaliza a força do impacto para um volume entre 0 e 1
    const normalizedVolume = Math.min(impact / 25, 1.0) * this.globalVolume;

    if (normalizedVolume < 0.05) return; // Ignora micro-batidas para não sujar o som

    // ==========================================
    // TODO: IMPLEMENTAÇÃO DO HOWLER.JS AQUI
    // this.hitSound.volume(normalizedVolume);
    // this.hitSound.play();
    // ==========================================

    // ! MVP: Síntese Procedural de "Crunch / 808"
    this.synthesizeHit(normalizedVolume);
  }

  // Chamado pela Física a cada colisão (Bola vs Parede)
  public playWallHit(impact: number) {
    if (!this.isUnlocked || !this.ctx) return;

    // Volume da parede é naturalmente mais baixo
    const normalizedVolume = Math.min(impact / 20, 0.4) * this.globalVolume;

    if (normalizedVolume < 0.02) return; // Ignora micro-batidas

    // ! MVP: Síntese Procedural de "Click / Tick"
    this.synthesizeWallHit(normalizedVolume);
  }

  private synthesizeHit(volume: number) {
    if (!this.ctx) return;
    const time = this.ctx.currentTime;

    // 808 (Sub-Grave de impacto)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(150, time); // Pitch inicial (Pancada)
    subOsc.frequency.exponentialRampToValueAtTime(20, time + 0.3); // Cai para o grave
    subGain.gain.setValueAtTime(volume, time);
    subGain.gain.exponentialRampToValueAtTime(0.01, time + 0.3); // Fade out rápido
    subOsc.connect(subGain).connect(this.ctx.destination);
    
    // CRUNCH (Distorção de alta frequência inicial)
    const crunchOsc = this.ctx.createOscillator();
    const crunchGain = this.ctx.createGain();
    crunchOsc.type = 'square';
    crunchOsc.frequency.setValueAtTime(200, time);
    crunchOsc.frequency.exponentialRampToValueAtTime(10, time + 0.1);
    crunchGain.gain.setValueAtTime(volume * 0.3, time); // Mais baixo que o sub
    crunchGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    crunchOsc.connect(crunchGain).connect(this.ctx.destination);

    // Dispara e destrói
    subOsc.start(time);
    subOsc.stop(time + 0.3);
    crunchOsc.start(time);
    crunchOsc.stop(time + 0.1);
  }

  private synthesizeWallHit(volume: number) {
    if (!this.ctx) return;
    const time = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Frequência alta para o "Tick" metálico/seco
    osc.type = 'triangle'; 
    osc.frequency.setValueAtTime(800, time);
    osc.frequency.exponentialRampToValueAtTime(400, time + 0.05);
    
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05); // Fade out super rápido
    
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.05);
  }

  public destroy() {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.isUnlocked = false;
  }
}