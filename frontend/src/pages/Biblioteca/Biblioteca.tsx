import React, { useState } from 'react';
import * as Tone from 'tone';
import './Biblioteca.css';

interface AudioItem {
  id: string;
  name: string;
  duration: number;
  buffer: Tone.ToneAudioBuffer;
  category: string;
}

// Função auxiliar para codificar o AudioBuffer em formato WAV padrão com cabeçalho
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  let channels = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  writeString('RIFF');
  setUint32(length - 8);
  writeString('WAVE');
  writeString('fmt ');
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  writeString('data');
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

export function Biblioteca() {
  const [audioList, setAudioList] = useState<AudioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');

  // Função para importar arquivos locais (.wav, .mp3, etc.)
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    const newItems: AudioItem[] = [];

    for (const file of Array.from(files)) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        
        await Tone.start();
        const audioContext = Tone.getContext().rawContext as AudioContext;
        
        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const toneBuffer = new Tone.ToneAudioBuffer(decodedBuffer);

        newItems.push({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          duration: decodedBuffer.duration,
          buffer: toneBuffer,
          category: 'Loops', // Categoria padrão inicial
        });
      } catch (error) {
        console.error(`Erro ao importar o arquivo ${file.name}:`, error);
      }
    }

    setAudioList((prev) => [...prev, ...newItems]);
    setLoading(false);
  };

  // Pré-escuta (Preview)
  const previewAudio = (buffer: Tone.ToneAudioBuffer) => {
    const player = new Tone.Player(buffer).toDestination();
    player.start();
  };

  // Filtragem por busca e categoria
  const filteredAudio = audioList.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeFilter === 'Todos' || item.category === activeFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="biblioteca-container">
      {/* Cabeçalho */}
      <div className="biblioteca-header">
        <div>
          <h2>Biblioteca</h2>
          <p>Biblioteca de sons, instrumentos e recursos.</p>
        </div>
        
        <label className="btn-upload" style={{ display: 'inline-block', cursor: 'pointer' }}>
          {loading ? 'Carregando...' : '📁 Importar Áudio'}
          <input 
            type="file" 
            accept="audio/*" 
            multiple 
            onChange={handleFileImport} 
            style={{ display: 'none' }} 
          />
        </label>
      </div>

      {/* Controles de Busca e Filtros */}
      <div className="biblioteca-controls">
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Pesquisar sons..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-filters">
          {['Todos', 'Loops', 'Samples', 'Gravações'].map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${activeFilter === cat ? 'active' : ''}`}
              onClick={() => setActiveFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Cards ou Estado Vazio */}
      <div className="biblioteca-grid">
        {filteredAudio.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum arquivo de áudio encontrado.</p>
            <span style={{ fontSize: '13px', display: 'block', marginTop: '6px' }}>
              Clique em "Importar Áudio" acima para carregar arquivos .wav ou .mp3.
            </span>
          </div>
        ) : (
          filteredAudio.map((item) => (
            <div key={item.id} className="biblioteca-card">
              <span className="card-badge">{item.category}</span>
              
              <div className="card-info">
                <h3>{item.name}</h3>
                <div className="card-meta">
                  <span>Duração: {item.duration.toFixed(2)}s</span>
                  <span>WAV / MP3</span>
                </div>
              </div>

              <div className="card-actions">
                <button 
                  onClick={() => previewAudio(item.buffer)}
                  className="btn-card-action primary"
                >
                  ▶ Ouvir
                </button>
                <button 
                  onClick={() => {
                    const toneBuffer = item.buffer;
                    const audioBuffer = (toneBuffer as any).get ? (toneBuffer as any).get() : toneBuffer;
                    
                    if (!audioBuffer) return;

                    const wavBlob = audioBufferToWav(audioBuffer);
                    const url = URL.createObjectURL(wavBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = item.name.endsWith('.wav') ? item.name : `${item.name}.wav`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="btn-card-action secondary"
                >
                  💾 Baixar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Biblioteca;