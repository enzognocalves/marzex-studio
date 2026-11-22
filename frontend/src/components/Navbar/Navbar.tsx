import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <span className="navbar-logo-icon">M</span>
        <span className="navbar-logo-text">Marzex Studio</span>
      </div>

      <div className="navbar-links">
        <Link to="/dashboard">Início</Link>
        <Link to="/projetos">Projetos</Link>
        <Link to="/estudio">Estúdio</Link>
      </div>

      <div className="navbar-actions">
        <Link to="/perfil" className="navbar-profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          M
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;