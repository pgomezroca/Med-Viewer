import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate('/');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <Link to="/welcome" className={styles.logo}>
          MED_viewer
        </Link>

        <button
          className={styles.menuToggle}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        <ul className={`${styles.navLinks} ${menuOpen ? styles.open : ''}`}>
          {token ? (
            <>
              <li>
                <Link
                  to="/welcome/take-photo"
                  className={`${styles.link} ${isActive('/welcome/take-photo') ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Tomar Foto
                </Link>
              </li>
              <li>
                <Link
                  to="/welcome/import-photo"
                  className={`${styles.link} ${isActive('/welcome/import-photo') ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Importar Imágenes
                </Link>
              </li>
              <li>
                <Link
                  to="/welcome/recover-photo"
                  className={`${styles.link} ${isActive('/welcome/recover-photo') ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Haz un trabajo científico
                </Link>
              </li>
              <li>
                <Link
                  to="/welcome/complete-image-labels"
                  className={`${styles.link} ${isActive('/welcome/complete-image-labels') ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Etiquetas Manuales
                </Link>
              </li>
              <li>
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className={styles.link}
                >
                  Cerrar sesión
                </button>
              </li>
            </>
          ) : null}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
