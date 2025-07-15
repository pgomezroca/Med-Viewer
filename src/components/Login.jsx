// src/components/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Login.module.css';

function Login() {
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simulación de login exitoso (cuando Nico conecte el backend, acá va fetch/post)
    console.log('Intentando login con:', credentials);

    // Simulamos guardado de token y redireccionamos
    localStorage.setItem("token", "FAKE-TOKEN");
    navigate('/welcome');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Iniciar sesión</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Contraseña</label>
            <input
              className={styles.input}
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className={styles.button}>
            Iniciar sesión
          </button>
        </form>

        <div
          className={styles.link}
          onClick={() => navigate('/register')}
        >
          ¿No tenés cuenta? Registrate
        </div>
      </div>
    </div>
  );
}

export default Login;
