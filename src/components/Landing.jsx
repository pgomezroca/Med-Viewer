// src/components/Landing.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from "../styles/Landing.module.css";

function Landing() {
  const navigate = useNavigate();

  // Opcional: redirigir si ya hay token (cuando JWT esté funcionando)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/welcome");
    }
  }, []);

  return (
    <div className={styles.container}>
      {/* Izquierda: info */}
      <div className={styles.left}>
        <h1 className={styles.title}>MED-VIEWER</h1>
        <p className={styles.subtitle}>
          Tu archivo inteligente de fotografías médicas. <br />
          Organizá, clasificá y accedé fácilmente a tus imágenes médicas desde cualquier dispositivo.
        </p>
      </div>

      {/* Derecha: acción */}
      <div className={styles.right}>
        <h2 className={styles.subtitle}>¿Listo para comenzar?</h2>
        <button
          onClick={() => navigate('/register')}
          className={styles.button}
        >
          Comenzar
        </button>
        <div
          onClick={() => navigate('/login')}
          className={styles.link}
        >
          ¿Ya tenés cuenta? Iniciá sesión
        </div>
      </div>
    </div>
  );
}

export default Landing;
