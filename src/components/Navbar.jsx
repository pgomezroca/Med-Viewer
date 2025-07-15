// src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';

const Navbar = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (path) => location.pathname === path;

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <Link to="/" className={styles.logo}>
          MED-VIEWER
        </Link>

        <button
          className={styles.menuToggle}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        <ul className={`${styles.navLinks} ${menuOpen ? styles.open : ''}`}>
          <li className='link'>
            <Link
              to="/take-photo"
              className={`${styles.link} ${isActive('/take-photo') ? styles.active : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Tomar Foto
            </Link>
          </li>
          <li >
            <Link
              to="/import-photo"
              className={`${styles.link} ${isActive('/import-photo') ? styles.active : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Ordena fotos
            </Link>
          </li>
          <li >
            <Link
              to="/recover-photo"
              className={`${styles.link} ${isActive('/recover-photo') ? styles.active : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Haz un trabajo cientifico
            </Link>
          </li>
          <li>
          <Link 
          to="/complete-image-labels"   
          className={`${styles.link} ${isActive('/complete-image-labels') ? styles.active : ''}`}
          onClick={() => setMenuOpen(false)}
          > Etiqueta imagenes recientes
          </Link>
          </li>
          <li>
          <span className={styles.userName}>Dr. Cliente</span>

          </li>
        </ul>
       
      </div>
    </nav>
  );
};

export default Navbar;
