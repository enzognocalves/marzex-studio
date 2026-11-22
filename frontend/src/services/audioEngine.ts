import * as Tone from 'tone';

class AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private isInitialized: boolean = false;

  // Inicializa o contexto de áudio (necessário por restrição dos navegadores)
  public async init() {
    if (!this.isInitialized) {
      await Tone.start();
      this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
      this.isInitialized = true;
      console.log('Engine de áudio do Marzex Studio pronta!');
    }
  }

  // Play / Pause do Transport global
  public async togglePlay(isPlaying: boolean) {
    await this.init();
    if (isPlaying) {
      Tone.Transport.stop();
    } else {
      Tone.Transport.start();
    }
  }

  // Altera o BPM global
  public setBpm(bpm: number) {
    Tone.Transport.bpm.value = bpm;
  }

  // Toca uma nota individual (útil para o Teclado Virtual / Piano Roll)
  public playNote(note: string, duration: string = '8n') {
    if (this.synth) {
      this.synth.triggerAttackRelease(note, duration);
    }
  }

  // Altera o Volume Master (em decibéis ou porcentagem)
  public setMasterVolume(val: number) {
    // Converte escala 0-100 para decibéis (-60dB a 0dB)
    const db = val === 0 ? -Infinity : (val - 100) * 0.6;
    Tone.Destination.volume.value = db;
  }
}

export const audioEngine = new AudioEngine();