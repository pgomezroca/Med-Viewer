import React, { useState, useCallback } from "react";
import { useParams, useNavigate,useSearchParams } from "react-router-dom";
import styles from "../styles/ImportImageToCase.module.css"; // 👈 estilos .module
import DropZone from "./DropZone";                           // 👈 usamos tu DropZone
import { FaArrowLeft } from "react-icons/fa";
import FormularioJerarquico from "./FormularioJerarquico";
export default function ImportImageToCase() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const [searchParams] = useSearchParams();
  const dniQS    = searchParams.get("dni")    || "";
   const regionQS = searchParams.get("region") || "";
   const dxQS     = searchParams.get("dx")     || "";
  const [fase, setFase] = useState("");
  const [fileList, setFileList] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [subiendo, setSubiendo] = useState(false);

  

  // ✅ reemplaza tu input file/handlers anteriores por esto
  const handleFilesSelected = useCallback((files) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;
    const urls = arr.map((f) => URL.createObjectURL(f));
    setPreviewImages((p) => [...p, ...urls]);
    setFileList((p) => [...p, ...arr]);
  }, []);

  const handleRemoveImage = (idx) => {
    setPreviewImages((p) => p.filter((_, i) => i !== idx));
    setFileList((p) => p.filter((_, i) => i !== idx));
  };

  const handleGuardar = async () => {
    if (!caseId) { alert("Falta caseId en la URL."); return; }
    if (!fase)   { alert("Seleccioná la fase."); return; }
    if (!fileList.length) { alert("Agregá al menos una imagen."); return; }

    setSubiendo(true);
    try {
      const data = new FormData();
      fileList.forEach((f) => data.append("images", f));
      data.append("caseId", String(caseId)); // 👈 asociar al caso
      data.append("fase", fase);             // 👈 nueva etiqueta requerida
      if (dniQS)    data.append("dni", dniQS);
      if (regionQS) data.append("region", regionQS);
      if (dxQS)     data.append("diagnostico", dxQS);
      const res = await fetch(`${apiUrl}/api/images/cases/take-photo-or-import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      if (!res.ok) {
        const maybe = await res.json().catch(() => ({}));
        throw new Error(maybe.message || `Error ${res.status}`);
      }

      await res.json();
      alert("✅ Imágenes importadas al caso correctamente");
      navigate(-1); // volver a la pantalla anterior
    } catch (e) {
      console.error(e);
      alert(`❌ No se pudo guardar: ${e.message}`);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>
          <FaArrowLeft /> Atrás
        </button>
        <h4>
        Importar a caso: DNI {dniQS || "—"} — Región {regionQS || "—"} — Dx {dxQS || "—"}
        </h4>
      </header>

      {/* ⬇️ DropZone reemplaza al botón “Importar archivos” + input file */}
      <DropZone onFilesSelected={handleFilesSelected} />

      {/* Previsualización */}
      {previewImages.length > 0 && (
        <div className={styles.previewContainer}>
          <div className={styles.previewGrid}>
            {previewImages.map((src, i) => (
              <div key={i} className={styles.previewItem}>
                <img src={src} alt={`preview-${i}`} className={styles.previewImg} />
                <button
                  className={styles.removeBtn}
                  onClick={() => handleRemoveImage(i)}
                  aria-label="Eliminar imagen"
                >
                  ✖
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fase */}
      <div className={styles.formRow}>
        <label htmlFor="fase" className={styles.label}>Fase</label>
        <select
          id="fase"
          className={styles.select}
          value={fase}
          onChange={(e) => setFase(e.target.value)}
        >
          <option value="">Elegí una fase…</option>
          <option value="pre">Pre</option>
          <option value="intra">Intra</option>
          <option value="post">Post</option>
        </select>
      </div>

      <div className={styles.actions}>
        <button className={styles.primary} onClick={handleGuardar} disabled={subiendo}>
          {subiendo ? "Guardando…" : "Guardar en este caso"}
        </button>
      </div>
    </div>
  );
}
