// src/components/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';
import { useAuth } from '../context/AuthContext';
import { User } from 'lucide-react'; // ícono genérico

function Navbar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Cerrar el dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        {/* Logo que siempre vuelve a Home */}
        <Link to="/welcome" className={styles.logo}>
          MED‑VIEWER
        </Link>
        {/* Botón central */}
        <div className={styles.centerNav}>
          <button
            className={`${styles.centerBtn} ${
              location.pathname.includes("patient-tracking")
                ? styles.centerBtnActive
                : ""
            }`}
            onClick={() => navigate("/welcome/patient-tracking")}
          >
            Seguimiento por paciente
          </button>
        </div>

        {/* Avatar + menú de usuario */}
        <div className={styles.userArea} ref={menuRef}>
          <button
            className={styles.avatarBtn}
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            title={user?.nombre || 'Cuenta'}
          >
            <User size={22} />
          </button>

          {open && (
            <div className={styles.dropdown} role="menu">
              <div className={styles.dropdownHeader}>
                <div className={styles.userName}>{user?.nombre || 'Usuario'}</div>
                <div className={styles.userRole}>Profesional</div>
              </div>

              <button
                className={styles.dropdownItem}
                onClick={() => { setOpen(false); navigate('/welcome/profile'); }}
                role="menuitem"
              >
                Perfil
              </button>

              <button
                className={styles.dropdownItem}
                onClick={() => { setOpen(false); navigate('/settings'); }}
                role="menuitem"
              >
                Configuración
              </button>

              <div className={styles.divider} />

              <button
                className={`${styles.dropdownItem} ${styles.logout}`}
                onClick={handleLogout}
                role="menuitem"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
