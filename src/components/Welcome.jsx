import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "../styles/Bienvenida.module.css";
import { Camera, FolderOpen, Tags, Upload } from "lucide-react";

const actions = [
  {
    label: "Tomar foto",
    path: "/welcome/take-photo",
    icon: <Camera size={24} />,
  },
  {
    label: "Clasificar fotos",
    path: "/welcome/import-photo",
    icon: <Upload size={24} />,
  },
  {
    label: "Archivo por patología",
    path: "/welcome/recover-photo",
    icon: <FolderOpen size={24} />,
  },
  {
    label: "Completar etiquetas",
    path: "/welcome/complete-image-labels",
    icon: <Tags size={24} />,
  },
];

const Welcome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      {/* Saludo */}
      <div className={styles.greeting}>
        <p>Hola, {user?.nombre || "usuario"}</p>
        <h2>¿Qué hacemos hoy?</h2>
      </div>

      {/* Acciones rápidas */}
      <div
        className={`${styles.actionsGrid} ${styles.actionsHero}`}
        role="navigation"
      >
        <div className={styles.actionsHeader}>
          <h6>Acciones rápidas</h6>
        </div>

        {actions.map((a) => (
          <button
            key={a.path}
            className={styles.actionCard}
            onClick={() => navigate(a.path)}
            aria-label={a.label}
          >
            <span className={styles.icon}>{a.icon}</span>
            <span className={styles.actionLabel}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Welcome;
