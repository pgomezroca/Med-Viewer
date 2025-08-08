import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <Link to="/welcome" className={styles.logo}>
          MED-VIEWER
        </Link>

        <button
          className={styles.menuToggle}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        <ul className={`${styles.navLinks} ${menuOpen ? styles.open : ''}`}>
          {user ? (
            <>
              <li className={styles.greeting}>Hola, {user.nombre}!</li>
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
                  Clasificar fotos
                </Link>
              </li>
              <li>
                <Link
                  to="/welcome/recover-photo"
                  className={`${styles.link} ${isActive('/welcome/recover-photo') ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Archivo por patologia
                </Link>
              </li>
              <li>
                <Link
                  to="/welcome/complete-image-labels"
                  className={`${styles.link} ${isActive('/welcome/complete-image-labels') ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Completar etiquetas
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
          ) : (
            <>
              <li>
                <Link
                  to="/login"
                  className={`${styles.link} ${isActive('/login') ? styles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Iniciar sesión
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;