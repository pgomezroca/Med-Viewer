// src/components/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Login.module.css';
import { useAuth } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) throw new Error('Credenciales inválidas');

      const data = await res.json();
      login(data.token);
      navigate('/welcome');
    } catch (err) {
      alert('Error al iniciar sesión: ' + err.message);
    }
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
