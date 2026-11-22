import { useEffect, useState } from "react";
import {
  createProject,
  deleteProject,
  getProjects,
  type ProjectData,
} from "../../services/projectService";
import "./Projetos.css";

interface ProjetoUI {
  id: number;
  nome: string;
  genero: string;
  bpm: number;
  tempoCriacao: string;
}

function formatarTempo(dataIso?: string): string {
  if (!dataIso) return "Agora mesmo";
  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return "Agora mesmo";
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapProjectToUI(proj: ProjectData): ProjetoUI {
  return {
    id: proj.id ?? Date.now(),
    nome: proj.title,
    genero: proj.musical_key || "Eletrônica",
    bpm: Number(proj.bpm) || 128,
    tempoCriacao: formatarTempo(proj.updated_at),
  };
}

export function Projetos() {
  const [projetos, setProjetos] = useState<ProjetoUI[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoGenero, setNovoGenero] = useState("Melodic Techno");
  const [novoBpm, setNovoBpm] = useState(120);

  // Carrega os projetos salvos no Supabase ao abrir a tela
  const carregarProjetos = async () => {
    try {
      setErroMsg(null);
      setCarregando(true);
      const dados = await getProjects();
      setProjetos(dados.map(mapProjectToUI));
    } catch (err) {
      console.error("Erro ao carregar projetos do Supabase:", err);
      setErroMsg("Não foi possível carregar os projetos do banco. Verifique a conexão e as tabelas no Supabase.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarProjetos();
  }, []);

  // Filtrar projetos com base na pesquisa
  const projetosFiltrados = projetos.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.genero.toLowerCase().includes(busca.toLowerCase())
  );

  // Função para criar projeto no Supabase
  const handleCriarProjeto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim() || salvando) return;

    try {
      setSalvando(true);
      setErroMsg(null);

      const criado = await createProject({
        title: novoNome.trim(),
        bpm: Number(novoBpm),
        musical_key: novoGenero,
        time_signature: "4/4",
        ui_theme: "light",
      });

      setProjetos((prev) => [mapProjectToUI(criado), ...prev]);
      setNovoNome("");
      setModalAberto(false);
    } catch (err) {
      console.error("Erro ao criar projeto no Supabase:", err);
      setErroMsg("Erro ao salvar o projeto no Supabase.");
    } finally {
      setSalvando(false);
    }
  };

  // Função para apagar projeto no Supabase
  const handleApagar = async (id: number) => {
    if (!confirm("Tens a certeza que queres apagar este projeto?")) return;

    try {
      setErroMsg(null);
      await deleteProject(id);
      setProjetos((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Erro ao apagar projeto no Supabase:", err);
      setErroMsg("Erro ao apagar o projeto no Supabase.");
    }
  };

  return (
    <div className="projetos-container" style={{ padding: "32px" }}>
      <div className="projetos-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1>Projetos</h1>
          <p style={{ color: "#666" }}>Área de gerenciamento dos projetos musicais.</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          style={{
            backgroundColor: "#6366f1",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          + Novo Projeto
        </button>
      </div>

      {erroMsg && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          {erroMsg}
        </div>
      )}

      {/* Barra de Pesquisa */}
      <div style={{ marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="Buscar projetos por nome ou género..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "10px 16px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            outline: "none",
          }}
        />
      </div>

      {/* Grid de Cards */}
      {carregando ? (
        <p style={{ color: "#6b7280" }}>Carregando projetos...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {projetosFiltrados.length > 0 ? (
            projetosFiltrados.map((projeto) => (
              <div
                key={projeto.id}
                style={{
                  background: "#fff",
                  border: "1px solid #eaeaea",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ background: "#f3f4f6", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", color: "#4b5563" }}>
                      {projeto.genero}
                    </span>
                  </div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>{projeto.nome}</h3>
                  <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#6b7280", marginBottom: "20px" }}>
                    <span>🎵 {projeto.bpm} BPM</span>
                    <span>🕒 {projeto.tempoCriacao}</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f3f4f6", paddingTop: "12px" }}>
                  <a href="/estudio" style={{ color: "#6366f1", textDecoration: "none", fontWeight: "500", fontSize: "14px" }}>
                    Abrir no Estúdio →
                  </a>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      onClick={() => alert(`Editar projeto: ${projeto.nome}`)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleApagar(projeto.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
                      title="Apagar"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: "#888" }}>Nenhum projeto encontrado.</p>
          )}
        </div>
      )}

      {/* Modal Simples de Criação */}
      {modalAberto && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "400px" }}>
            <h2 style={{ marginTop: 0 }}>Criar Novo Projeto</h2>
            <form onSubmit={handleCriarProjeto}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>Nome do Projeto</label>
                <input
                  type="text"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: Melodic House Jam"
                  required
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>Género Musical</label>
                <select
                  value={novoGenero}
                  onChange={(e) => setNovoGenero(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }}
                >
                  <option value="Melodic Techno">Melodic Techno</option>
                  <option value="Synthwave">Synthwave</option>
                  <option value="House">House</option>
                  <option value="EDM">EDM</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>BPM</label>
                <input
                  type="number"
                  value={novoBpm}
                  onChange={(e) => setNovoBpm(Number(e.target.value))}
                  min="60"
                  max="180"
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  style={{ padding: "8px 16px", background: "#f3f4f6", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  style={{ padding: "8px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  {salvando ? "Salvando..." : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}