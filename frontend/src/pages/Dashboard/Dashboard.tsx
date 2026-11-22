import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import Card from "../../components/card/Card";
import Button from "../../components/Button/Button";
import "./Dashboard.css";

type ProjectItem = {
  id: number;
  name?: string;
  title?: string;
  description?: string;
  bpm?: number;
};

function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecentProjects() {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("id", { ascending: false })
        .limit(3);

      if (!error && data) {
        setProjects(data);
      }
      setLoading(false);
    }

    loadRecentProjects();
  }, []);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-greeting">
            Olá, produtor 👋
          </p>

          <h1>Bem-vindo ao Marzex Studio</h1>

          <p className="dashboard-description">
            Crie, organize e produza suas músicas em um único lugar.
          </p>
        </div>

        <Button onClick={() => navigate("/projetos")}>
          + Novo projeto
        </Button>
      </header>

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Projetos recentes</h2>

            <p>
              Continue trabalhando nos seus projetos.
            </p>
          </div>
        </div>

        <div className="projects-grid">
          {loading ? (
            <Card>
              <div className="project-card">
                <p>Carregando projetos...</p>
              </div>
            </Card>
          ) : projects.length > 0 ? (
            projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate("/estudio")}
                style={{ cursor: "pointer" }}
              >
                <Card>
                  <div className="project-card">
                    <div className="project-icon">
                      ♫
                    </div>

                    <h3>{project.name || project.title || `Projeto #${project.id}`}</h3>

                    <p>
                      {project.description ||
                        (project.bpm ? `Andamento: ${project.bpm} BPM` : "Projeto de música eletrônica")}
                    </p>

                    <span>
                      Abrir no estúdio
                    </span>
                  </div>
                </Card>
              </div>
            ))
          ) : (
            <Card>
              <div className="project-card">
                <div className="project-icon">
                  ♫
                </div>

                <h3>Nenhum projeto ainda</h3>

                <p>
                  Clique em "+ Novo projeto" para começar sua primeira faixa.
                </p>

                <span>
                  Pronto para produzir
                </span>
              </div>
            </Card>
          )}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Atividade recente</h2>

            <p>
              Acompanhe suas últimas atividades.
            </p>
          </div>
        </div>

        <Card>
          <div className="activity">
            <div className="activity-icon">
              ✓
            </div>

            <div>
              <strong>
                {projects.length > 0 ? "Projetos sincronizados" : "Conta conectada"}
              </strong>

              <p>
                {projects.length > 0
                  ? `Você possui ${projects.length} projeto(s) recente(s) pronto(s) no estúdio.`
                  : "Seu ambiente do Marzex Studio está pronto para produção."}
              </p>
            </div>

            <span>
              Agora
            </span>
          </div>
        </Card>
      </section>
    </div>
  );
}

export default Dashboard;