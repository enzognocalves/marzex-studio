import { NavLink, Link } from "react-router-dom";

import "./Sidebar.css";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          M
        </div>

        <span className="sidebar-title">
          Marzex Studio
        </span>
      </div>

      <nav className="sidebar-nav">

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <span>⌂</span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/projetos"
          className={({ isActive }) =>
            `sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <span>◈</span>
          <span>Projetos</span>
        </NavLink>

        <NavLink
          to="/estudio"
          className={({ isActive }) =>
            `sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <span>♫</span>
          <span>Estúdio</span>
        </NavLink>

        <NavLink
          to="/biblioteca"
          className={({ isActive }) =>
            `sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <span>▣</span>
          <span>Biblioteca</span>
        </NavLink>

      </nav>

      <div className="sidebar-section">

        <span className="sidebar-section-title">
          SISTEMA
        </span>

        <NavLink
          to="/perfil"
          className={({ isActive }) =>
            `sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <span>●</span>
          <span>Perfil</span>
        </NavLink>

        <NavLink
          to="/configuracoes"
          className={({ isActive }) =>
            `sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <span>⚙</span>
          <span>Configurações</span>
        </NavLink>

      </div>

      <Link
        to="/perfil"
        className="sidebar-footer"
        style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
      >
        <div className="sidebar-user-avatar">
          M
        </div>

        <div className="sidebar-user-info">
          <strong>Meu Perfil</strong>
          <span>Produtor</span>
        </div>
      </Link>
    </aside>
  );
}

export default Sidebar;