import { useState, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import {
  createProject,
  getProjects,
  savePattern,
  saveTrack,
  updateProject,
} from '../../services/projectService';
import './estudio.css';

interface Track {
  id: number;
  dbId?: number;
  patternDbId?: number;
  name: string;
  volume: number;
  isMuted: boolean;
  isSolo: boolean;
  steps: boolean[];
}

const PIANO_NOTES = [
  { note: 'C4', label: 'C', isBlack: false, keyTrigger: 'a' },
  { note: 'C#4', label: 'C#', isBlack: true, keyTrigger: 'w' },
  { note: 'D4', label: 'D', isBlack: false, keyTrigger: 's' },
  { note: 'D#4', label: 'D#', isBlack: true, keyTrigger: 'e' },
  { note: 'E4', label: 'E', isBlack: false, keyTrigger: 'd' },
  { note: 'F4', label: 'F', isBlack: false, keyTrigger: 'f' },
  { note: 'F#4', label: 'F#', isBlack: true, keyTrigger: 't' },
  { note: 'G4', label: 'G', isBlack: false, keyTrigger: 'g' },
  { note: 'G#4', label: 'G#', isBlack: true, keyTrigger: 'y' },
  { note: 'A4', label: 'A', isBlack: false, keyTrigger: 'h' },
  { note: 'A#4', label: 'A#', isBlack: true, keyTrigger: 'u' },
  { note: 'B4', label: 'B', isBlack: false, keyTrigger: 'j' },
  { note: 'C5', label: 'C5', isBlack: false, keyTrigger: 'k' },
];

const DEFAULT_TRACKS: Track[] = [
  {
    id: 1,
    name: 'Sintetizador Lead',
    volume: 80,
    isMuted: false,
    isSolo: false,
    steps: Array(16).fill(false),
  },
  {
    id: 2,
    name: 'Bateria / Kick',
    volume: 90,
    isMuted: false,
    isSolo: false,
    steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
  },
];

function Estudio() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(120);
  const [masterVolume, setMasterVolume] = useState<number>(80);
  const [synth, setSynth] = useState<Tone.PolySynth | null>(null);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Estados de persistência no Supabase
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectTitle, setProjectTitle] = useState<string>('Marzex Session 01');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);

  // Carrega o projeto mais recente do Supabase (se existir) ao abrir o estúdio
  useEffect(() => {
    let ativo = true;

    async function carregarUltimoProjeto() {
      try {
        const projects = await getProjects();
        if (!ativo || projects.length === 0) return;

        const latest = projects[0];
        if (latest.id) setProjectId(latest.id);
        if (latest.title) setProjectTitle(latest.title);

        if (typeof latest.bpm === 'number' && !Number.isNaN(latest.bpm)) {
          setBpm(Number(latest.bpm));
          Tone.Transport.bpm.value = Number(latest.bpm);
        }

        if (latest.tracks && latest.tracks.length > 0) {
          const ordenadas = [...latest.tracks].sort((a, b) => a.sort_order - b.sort_order);
          const mappedTracks: Track[] = ordenadas.map((t, index) => {
            const firstPattern = t.patterns && t.patterns.length > 0 ? t.patterns[0] : undefined;
            const rawSteps = Array.isArray(firstPattern?.step_data)
              ? firstPattern.step_data.map((s) => Boolean(s))
              : Array(16).fill(false);

            const paddedSteps =
              rawSteps.length === 16
                ? rawSteps
                : Array.from({ length: 16 }, (_, i) => Boolean(rawSteps[i]));

            return {
              id: t.id ?? index + 1,
              dbId: t.id,
              patternDbId: firstPattern?.id,
              name: t.name,
              volume: Number(t.volume ?? 80),
              isMuted: Boolean(t.is_muted),
              isSolo: Boolean(t.is_solo),
              steps: paddedSteps,
            };
          });
          setTracks(mappedTracks);
        }
      } catch (err) {
        console.error('Erro ao carregar projeto no estúdio:', err);
      }
    }

    carregarUltimoProjeto();
    return () => {
      ativo = false;
    };
  }, []);

  // Inicializa o motor de sintetizador e o Loop do Transport para o Playhead
  useEffect(() => {
    const polySynth = new Tone.PolySynth(Tone.Synth).toDestination();
    setSynth(polySynth);

    const repeatId = Tone.Transport.scheduleRepeat(() => {
      setCurrentStep((prevStep) => (prevStep + 1) % 16);
    }, '16n');

    return () => {
      polySynth.dispose();
      Tone.Transport.clear(repeatId);
    };
  }, []);

  const handleTogglePlay = async () => {
    await Tone.start();
    if (isPlaying) {
      Tone.Transport.stop();
      setIsPlaying(false);
      setCurrentStep(0);
    } else {
      Tone.Transport.start();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    Tone.Transport.stop();
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    Tone.Transport.bpm.value = newBpm;
  };

  const handleMasterVolumeChange = (val: number) => {
    setMasterVolume(val);
    const db = val === 0 ? -Infinity : (val - 100) * 0.5;
    Tone.Destination.volume.value = db;
  };

  const playNote = useCallback(
    async (note: string) => {
      await Tone.start();
      if (synth) {
        synth.triggerAttackRelease(note, '8n');
        setActiveNote(note);
        setTimeout(() => setActiveNote(null), 200);
      }
    },
    [synth]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      const mapped = PIANO_NOTES.find((n) => n.keyTrigger === e.key.toLowerCase());
      if (mapped && !e.repeat) {
        playNote(mapped.note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playNote]);

  // Salva projeto, faixas e patterns no Supabase
  const handleSaveProject = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      setSaveStatus(null);

      let currentProjectId = projectId;
      const cleanTitle = projectTitle.trim() || 'Projeto Sem Título';

      if (currentProjectId) {
        await updateProject(currentProjectId, {
          title: cleanTitle,
          bpm: Number(bpm),
        });
      } else {
        const created = await createProject({
          title: cleanTitle,
          bpm: Number(bpm),
          time_signature: '4/4',
          musical_key: 'C Minor',
          ui_theme: 'light',
        });
        currentProjectId = created.id ?? null;
        if (currentProjectId) setProjectId(currentProjectId);
      }

      if (!currentProjectId) {
        throw new Error('ID do projeto não retornado pelo Supabase.');
      }

      const updatedTracks: Track[] = [];

      for (let index = 0; index < tracks.length; index++) {
        const track = tracks[index];
        const savedTrack = await saveTrack({
          ...(track.dbId ? { id: track.dbId } : {}),
          project_id: currentProjectId,
          name: track.name,
          track_type: track.name.toLowerCase().includes('bateria') || track.name.toLowerCase().includes('kick') ? 'drum' : 'synth',
          volume: track.volume,
          pan: 0,
          is_muted: track.isMuted,
          is_solo: track.isSolo,
          sort_order: index,
        });

        let savedPatternId = track.patternDbId;
        if (savedTrack.id) {
          const savedPattern = await savePattern({
            ...(track.patternDbId ? { id: track.patternDbId } : {}),
            track_id: savedTrack.id,
            name: `${track.name} - Pattern 1`,
            start_bar: 1,
            length_bars: 1,
            step_data: track.steps,
          });
          savedPatternId = savedPattern.id;
        }

        updatedTracks.push({
          ...track,
          dbId: savedTrack.id ?? track.dbId,
          patternDbId: savedPatternId,
        });
      }

      setTracks(updatedTracks);
      setSaveStatus('Salvo no Supabase!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Erro ao salvar projeto no Supabase:', err);
      setSaveStatus('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const addTrack = () => {
    const newTrack: Track = {
      id: Date.now(),
      name: `Faixa ${tracks.length + 1}`,
      volume: 80,
      isMuted: false,
      isSolo: false,
      steps: Array(16).fill(false),
    };
    setTracks([...tracks, newTrack]);
  };

  const toggleMute = (id: number) => {
    setTracks(
      tracks.map((track) =>
        track.id === id ? { ...track, isMuted: !track.isMuted } : track
      )
    );
  };

  const toggleSolo = (id: number) => {
    setTracks(
      tracks.map((track) =>
        track.id === id ? { ...track, isSolo: !track.isSolo } : track
      )
    );
  };

  const handleVolumeChange = (id: number, newVolume: number) => {
    setTracks(
      tracks.map((track) =>
        track.id === id ? { ...track, volume: newVolume } : track
      )
    );
  };

  const toggleStep = (trackId: number, stepIndex: number) => {
    setTracks(
      tracks.map((track) => {
        if (track.id === trackId) {
          const updatedSteps = [...track.steps];
          updatedSteps[stepIndex] = !updatedSteps[stepIndex];
          return { ...track, steps: updatedSteps };
        }
        return track;
      })
    );
  };

  return (
    <div className="estudio-container">
      {/* Barra de Transporte Topo */}
      <header className="transport-bar">
        <div className="transport-controls">
          <button
            className={`btn-play ${isPlaying ? 'playing' : ''}`}
            onClick={handleTogglePlay}
          >
            {isPlaying ? '⏸ Pausa' : '▶ Play'}
          </button>
          <button className="btn-stop" onClick={handleStop}>
            ⏹ Stop
          </button>
        </div>

        <div className="bpm-control">
          <label htmlFor="project-title-input">Projeto:</label>
          <input
            id="project-title-input"
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            style={{ width: '170px', marginRight: '12px' }}
          />
          <label htmlFor="bpm-input">BPM:</label>
          <input
            id="bpm-input"
            type="number"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => handleBpmChange(Number(e.target.value))}
          />
        </div>

        <div className="master-volume">
          <span>Master:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={masterVolume}
            onChange={(e) => handleMasterVolumeChange(Number(e.target.value))}
          />
          <span className="vol-value">{masterVolume}%</span>

          <button
            type="button"
            onClick={handleSaveProject}
            disabled={isSaving}
            style={{
              marginLeft: '14px',
              backgroundColor: '#6366f1',
              color: '#fff',
              border: 'none',
              padding: '7px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {isSaving ? 'Salvando...' : '💾 Salvar'}
          </button>
          {saveStatus && (
            <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 500 }}>
              {saveStatus}
            </span>
          )}
        </div>
      </header>

      {/* Área Principal de Faixas */}
      <main className="studio-main">
        <div className="studio-header">
          <h2>Faixas do Estúdio</h2>
          <button className="btn-add-track" onClick={addTrack}>
            + Nova Faixa
          </button>
        </div>

        <div className="tracks-list">
          {tracks.map((track) => (
            <div key={track.id} className="track-item">
              <div className="track-info">
                <input
                  type="text"
                  className="track-name-input"
                  value={track.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTracks(
                      tracks.map((t) =>
                        t.id === track.id ? { ...t, name: val } : t
                      )
                    );
                  }}
                />
              </div>

              <div className="track-actions">
                <button
                  className={`btn-mute ${track.isMuted ? 'active' : ''}`}
                  onClick={() => toggleMute(track.id)}
                >
                  M
                </button>
                <button
                  className={`btn-solo ${track.isSolo ? 'active' : ''}`}
                  onClick={() => toggleSolo(track.id)}
                >
                  S
                </button>
              </div>

              <div className="track-volume">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={track.volume}
                  onChange={(e) =>
                    handleVolumeChange(track.id, Number(e.target.value))
                  }
                />
                <span className="vol-value">{track.volume}%</span>
              </div>

              {/* Grid / Sequenciador com Playhead Ativo */}
              <div className="track-grid">
                {track.steps.map((isActive, stepIndex) => {
                  const isCurrentPlayingStep = isPlaying && currentStep === stepIndex;
                  return (
                    <button
                      key={stepIndex}
                      type="button"
                      onClick={() => toggleStep(track.id, stepIndex)}
                      className={`step-cell ${
                        stepIndex % 4 === 0 ? 'accent-step' : ''
                      } ${isActive ? 'active-step' : ''} ${
                        isCurrentPlayingStep ? 'playing-step' : ''
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Teclado Virtual / Piano Roll */}
      <section className="piano-roll-card">
        <div className="piano-roll-header">
          <div>
            <h3>Teclado Virtual (Sintetizador)</h3>
            <p>Atalhos do PC: [A, W, S, E, D, F, T, G, Y, H, U, J, K]</p>
          </div>
          <span className="active-note-badge">
            Nota: {activeNote || '--'}
          </span>
        </div>

        <div className="keys-wrapper">
          {PIANO_NOTES.map((n) => {
            if (!n.isBlack) {
              return (
                <button
                  key={n.note}
                  type="button"
                  onClick={() => playNote(n.note)}
                  className={`white-key ${activeNote === n.note ? 'active' : ''}`}
                >
                  <span>{n.label}</span>
                  <span className="key-hint">[{n.keyTrigger}]</span>
                </button>
              );
            }
            return (
              <button
                key={n.note}
                type="button"
                onClick={() => playNote(n.note)}
                className={`black-key ${activeNote === n.note ? 'active' : ''}`}
              >
                <span>{n.label}</span>
                <span className="key-hint">[{n.keyTrigger}]</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Estudio;