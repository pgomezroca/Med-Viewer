import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "../styles/Bienvenida.module.css";
import { Camera, FolderOpen, Tags, Upload, UserPlus, X } from "lucide-react";
import FormularioJerarquico from "./FormularioJerarquico";

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
    label: "Archivo por patologia",
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
  const apiUrl = import.meta.env.VITE_API_URL;
  const [dni, setDni] = useState("");
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [casos, setCasos] = useState([]);
  const [queried, setQueried] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newDx, setNewDx] = useState("");
  const [newNombre, setNewNombre] = useState("");
  const [newApellido, setNewApellido] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [newEtiologia, setNewEtiologia] = useState("");
  const [newTejido, setNewTejido] = useState("");
  const [newTratamiento, setNewTratamiento] = useState("");
  const [newFase, setNewFase] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const buscarCasosPorDNI = async () => {
    if (!dni) {
      alert("Ingresá un DNI para buscar.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setQueried(true);

      const res = await fetch(`${apiUrl}/api/images/search?dni=${dni}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al buscar casos");

      const data = await res.json();
      const options = { day: "2-digit", month: "short", year: "numeric" };
      const gruposObj = data.reduce((acc, img) => {
        const raw = img.createdAt ?? img.uploadedAt ?? null;
        let d = null;

        if (typeof raw === "string") d = new Date(raw.replace(" ", "T"));
        else if (raw) d = new Date(raw);

        const fecha =
          d && !Number.isNaN(d.getTime())
            ? d.toLocaleDateString("es-AR", options)
            : "Sin fecha";
        const dx = img.diagnostico || "Sin diagnóstico";
        const clave = `${fecha}__${dx}`;

        if (!acc[clave])
          acc[clave] = {
            fecha,
            diagnostico: dx,
            items: [],
            ts: d ? d.getTime() : 0,
          };
        acc[clave].items.push(img);
        if (d && d.getTime() > acc[clave].ts) acc[clave].ts = d.getTime();
        return acc;
      }, {});

      const grupos = Object.values(gruposObj).sort((a, b) => b.ts - a.ts);
      setCasos(grupos);
    } catch (err) {
      console.error("[Welcome] buscarCasosPorDNI error", err);
      setError("No se pudieron buscar los casos.");
      setCasos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dni.length === 8) {
      buscarCasosPorDNI();
    } else {
      setCasos([]);
      setQueried(false);
      setError("");
    }
  }, [dni]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePatientWithImages = async (e) => {
    e.preventDefault();
    const v = (dni || "").replace(/\D/g, "");
    if (v.length !== 7 && v.length !== 8) {
      alert("DNI inválido");
      return;
    }
    if (!newDx.trim()) {
      alert("Ingresá un diagnóstico");
      return;
    }
    if (selectedImages.length === 0) {
      alert("Debes seleccionar al menos una imagen");
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      
      // Agregar campos del paciente y caso
      formData.append('dni', dni);
      formData.append('region', newRegion || '');
      formData.append('diagnostico', newDx.trim());
      formData.append('etiologia', newEtiologia || '');
      formData.append('tejido', newTejido || '');
      formData.append('tratamiento', newTratamiento || '');
      formData.append('fase', newFase || '');
      
      // Agregar campos opcionales
      if (newNombre.trim()) formData.append('nombre', newNombre.trim());
      if (newApellido.trim()) formData.append('apellido', newApellido.trim());
      
      // Agregar imágenes
      selectedImages.forEach((file, index) => {
        formData.append('images', file);
      });

      const response = await fetch(`${apiUrl}/api/images/cases`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el caso');
      }

      const result = await response.json();
      
      // Actualizar la UI con el nuevo caso
      const now = new Date();
      const options = { day: "2-digit", month: "short", year: "numeric" };
      const fecha = now.toLocaleDateString("es-AR", options);
      
      const nuevoCaso = {
        fecha,
        diagnostico: result.diagnostico || newDx.trim(),
        region: result.region || newRegion,
        items: result.images || [],
        ts: now.getTime(),
      };

      setCasos(prev => [nuevoCaso, ...prev]);
      setShowNewForm(false);
      resetForm();
      setSelectedImages([]);
      setUploadProgress(0);
      
    } catch (err) {
      console.error('Error al crear paciente con imágenes:', err);
      setError(err.message || 'Error al crear el paciente');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewDx("");
    setNewNombre("");
    setNewApellido("");
    setNewRegion("");
    setNewEtiologia("");
    setNewTejido("");
    setNewTratamiento("");
    setNewFase("");
  };

  const handleCancelNew = () => {
    setShowNewForm(false);
    resetForm();
    setSelectedImages([]);
  };

  return (
    <div className={styles.container}>
      {/* Saludo */}
      <div className={styles.greeting}>
        <p>Hola, {user?.nombre || "usuario"}</p>
        <h2>¿Qué hacemos hoy?</h2>
      </div>

      {/* DNI + Nuevo paciente */}
      <div className={styles.patientRow}>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="DNI del paciente"
          value={dni}
          onChange={(e) =>
            setDni((e.target.value || "").replace(/\D/g, "").slice(0, 8))
          }
          className={styles.input}
          aria-label="DNI del paciente"
          maxLength={8}
        />
        <button 
          className={styles.newPatientBtn} 
          onClick={() => {
            const v = (dni || "").replace(/\D/g, "");
            if (v !== dni) setDni(v);
            setShowNewForm(true);
          }}
        >
          <UserPlus size={18} /> Nuevo paciente
        </button>
      </div>

      {/* Formulario para nuevo paciente con imágenes */}
      {showNewForm && (
        <div className={styles.newCaseBox}>
          <h4>Nuevo paciente con imágenes</h4>
          <form onSubmit={handleCreatePatientWithImages}>
            {/* DNI */}
            <div className={styles.formRow}>
              <label className={styles.label}>DNI</label>
              <input
                className={styles.field}
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
                maxLength={8}
                required
              />
            </div>

            {/* Nombre (opcional) */}
            <div className={styles.formRow}>
              <label className={styles.label}>Nombre</label>
              <input
                className={styles.field}
                type="text"
                value={newNombre}
                onChange={(e) => setNewNombre(e.target.value)}
                placeholder="(opcional)"
              />
            </div>

            {/* Apellido (opcional) */}
            <div className={styles.formRow}>
              <label className={styles.label}>Apellido</label>
              <input
                className={styles.field}
                type="text"
                value={newApellido}
                onChange={(e) => setNewApellido(e.target.value)}
                placeholder="(opcional)"
              />
            </div>

            {/* Campos médicos */}
            <div className={styles.formRow}>
              <label className={styles.label}>Región y diagnóstico</label>
              <FormularioJerarquico
                campos={["region", "diagnostico"]}
                valores={{ region: newRegion, diagnostico: newDx }}
                onChange={(data) => {
                  setNewRegion(data?.region || "");
                  setNewDx(data?.diagnostico || "");
                }}
              />
            </div>

            <div className={styles.formRow}>
              <label className={styles.label}>Etiología</label>
              <input
                className={styles.field}
                type="text"
                value={newEtiologia}
                onChange={(e) => setNewEtiologia(e.target.value)}
                placeholder="(opcional)"
              />
            </div>

            <div className={styles.formRow}>
              <label className={styles.label}>Tejido</label>
              <input
                className={styles.field}
                type="text"
                value={newTejido}
                onChange={(e) => setNewTejido(e.target.value)}
                placeholder="(opcional)"
              />
            </div>

            <div className={styles.formRow}>
              <label className={styles.label}>Tratamiento</label>
              <input
                className={styles.field}
                type="text"
                value={newTratamiento}
                onChange={(e) => setNewTratamiento(e.target.value)}
                placeholder="(opcional)"
              />
            </div>

            <div className={styles.formRow}>
              <label className={styles.label}>Fase (pre, intra, post)</label>
              <input
                className={styles.field}
                type="text"
                value={newFase}
                onChange={(e) => setNewFase(e.target.value.toLowerCase())}
                placeholder="(opcional)"
              />
            </div>

            {/* Selección de imágenes */}
            <div className={styles.formRow}>
              <label className={styles.label}>Imágenes</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className={styles.fileInput}
                required
              />
              
              {/* Vista previa de imágenes */}
              <div className={styles.imagePreviews}>
                {selectedImages.map((image, index) => (
                  <div key={index} className={styles.imagePreviewItem}>
                    <span>{image.name}</span>
                    <button 
                      type="button" 
                      onClick={() => removeImage(index)}
                      className={styles.removeImageBtn}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Barra de progreso */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            {/* Botones del formulario */}
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handleCancelNew}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className={styles.primaryBtn}
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar paciente e imágenes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resultados de búsqueda */}
      {loading && !showNewForm && <div className={styles.casosBox}>Buscando casos…</div>}

      {!loading && error && (
        <div className={styles.casosBoxError} role="alert">
          {error}
        </div>
      )}

      {!loading && !error && queried && !showNewForm && (
        <div className={styles.casosBox}>
          {casos.length === 0 ? (
            <div className={styles.emptyNote}>
              No hay casos para este DNI. Podés crear uno con{" "}
              <strong>“Nuevo paciente”</strong>.
            </div>
          ) : (
            <>
              <div className={styles.casosHeader}>
                <h4>Casos previos para DNI {dni}:</h4>
              </div>
              <div>
                {casos.map((c, i) => {
                  const six = new Date();
                  six.setMonth(six.getMonth() - 6);
                  const estado =
                    typeof c.ts === "number" && c.ts >= six.getTime()
                      ? "abierto"
                      : "cerrado";

                  return (
                    <div
                      key={`${c.fecha}-${c.diagnostico}-${i}`}
                      className={styles.caseRow}
                    >
                      <div className={styles.caseInfo}>
                        <strong>{c.fecha}</strong> — Dx: {c.diagnostico} (
                        {c.items.length})
                        <span
                          className={`${styles.badge} ${
                            estado === "abierto"
                              ? styles.badgeOpen
                              : styles.badgeClosed
                          }`}
                        >
                          {estado}
                        </span>
                      </div>

                      <div className={styles.caseActions}>
                        <button
                          className={styles.smallBtn}
                          onClick={() =>
                            navigate(
                              `/welcome/recover-photo?dni=${encodeURIComponent(
                                dni
                              )}&fecha=${encodeURIComponent(
                                c.fecha
                              )}&dx=${encodeURIComponent(c.diagnostico)}`
                            )
                          }
                        >
                          Abrir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tarjetas de acción */}
      {!showNewForm && (
        <div className={styles.actionsGrid}>
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
      )}
    </div>
  );
};

export default Welcome;