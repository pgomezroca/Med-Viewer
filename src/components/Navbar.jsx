import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className={styles.navbar}>
      <Link
        to="/take-photo"
        className={location.pathname === '/take-photo' ? styles.activeLink : styles.link}
      >
        📷 Tomar Foto
      </Link>
      <Link
        to="/import-photo"
        className={location.pathname === '/import-photo' ? styles.activeLink : styles.link}
      >
        🗂️ Importar
      </Link>
      <Link
        to="/recover-photo"
        className={location.pathname === '/recover-photo' ? styles.activeLink : styles.link}
      >
        🔎 Recuperar
      </Link>
      <Link
        to="/login"
        className={location.pathname === '/login' ? styles.activeLink : styles.link}
      >
        🔐 Login
      </Link>
    </nav>
  );
};

export default Navbar;
