import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "../styles/Bienvenida.module.css";
import { Camera, FolderOpen, Tags, Upload } from "lucide-react";

const actions = [
  {
    label: "Caso Nuevo",
    subtitle:"",
    path: "/welcome/patient-tracking",
    icon: <Camera size={24} />,
  },
  {
    label: "Completar casos",
    subtitle:"Agrega las etiquetas",
    path: "/welcome/complete-image-labels",
    icon: <Tags size={24} />,
  },
  /*{
    label: "Agregar fotos a los casos",
    subtitle:"en construccion",
    path: "/welcome/import-photo",
    icon: <Upload size={24} />,
  },*/
  {
    label: "Ordenar mis archivos",
    subtitle:"Carga fotos y etiquetalas para cargar casos antiguos",
    path: "/welcome/import-photo",
    icon: <Upload size={24} />,
  },
  {
    label: " Buscar mis casos",
    subtitle:"Encontra casos por tipo de lesion o diagnostico",
    path: "/welcome/recover-photo",
    icon: <FolderOpen size={24} />,
  },
  
];

const Welcome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      {/* Saludo */}
      <div className={styles.greeting}>
        <p> Hola,{" "}
    {user?.nombre
      ? user.nombre.charAt(0).toUpperCase() + user.nombre.slice(1).toLowerCase()
      : "Usuario"}</p>
        <p>¿Qué hacemos hoy?</p>
      </div>

      {/* Acciones rápidas */}
      <div
        className={`${styles.actionsGrid} ${styles.actionsHero}`}
        role="navigation"
      >
       
        {actions.map((a) => (
          <button
            key={a.path}
            className={styles.actionCard}
            onClick={() => navigate(a.path)}
            aria-label={a.label}
          >
            <div className={styles.textContent}>
              <span className={styles.actionLabel}>{a.label}</span>
              <span className={styles.actionSubtitle}>{a.subtitle}</span>
            </div>
           <div className={styles.iconRight}>{a.icon}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Welcome;
