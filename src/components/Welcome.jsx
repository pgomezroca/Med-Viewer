import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import styles from '../styles/Bienvenida.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const imagenes = [
  "/images/imagen3.jpeg",
  "/piel.jpg",
  "/corazon.jpg",
];

const Welcome = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className={`${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      {/* Carousel Bootstrap puro */}
      <div id="carouselMedPhoto" className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-inner">
          {imagenes.map((src, i) => (
            <div key={i} className={`carousel-item ${i === 0 ? "active" : ""}`}>
              <img
                src={src}
                className="d-block w-100"
                alt={`img-${i}`}
                style={{ height: "200px", objectFit: "cover" }}
              />
            </div>
          ))}
        </div>

        <button className="carousel-control-prev" type="button" data-bs-target="#carouselMedPhoto" data-bs-slide="prev">
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Anterior</span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#carouselMedPhoto" data-bs-slide="next">
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Siguiente</span>
        </button>
      </div>

      {/* Contenido centrado */}
      <div className={styles.textContainer}>
        <h1 className={styles.title}>Bienvenido a MED-VIEWER</h1>
        <p className={styles.subtitle}>Capturá, organizá y almacená tus imágenes clínicas de forma simple y segura.</p>

        
      </div>
    </div>
  );
};

export default Welcome;
