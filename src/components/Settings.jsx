import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Settings.module.css";

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logoSection}>
          <h4>⚙️ Configuraciones</h4>
        </div>
        <ul className={styles.menu}>
          <li
            className={styles.menuItem}
            onClick={() => navigate("/settings/formulario-jerarquico")}
          >
            🧩 Formulario Jerarquico
          </li>
        </ul>
      </aside>

      <main className={styles.content}>
        <section className={styles.section}>
          <h3>Panel de configuración</h3>
          <p className={styles.description}>
            Aquí podés personalizar el comportamiento de tu cuenta, los colores
            de la interfaz, y gestionar tus formularios jerárquicos.
          </p>

          <button
            className={styles.btnPrimary}
            onClick={() => navigate("/settings/formulario-jerarquico")}
          >
            Abrir Formulario Jerárquico
          </button>
        </section>

        <section className={`${styles.section} mt-3`}>
          <h3>Volver al inicio</h3>
          <p className={styles.description}>
            Volver al inicio para continuar usando la aplicación.
          </p>

          <button
            className={styles.btnPrimary}
            onClick={() => navigate("/")}
          >
            Volver al inicio
          </button>
        </section>
      </main>
    </div>
  );
};

export default Settings;