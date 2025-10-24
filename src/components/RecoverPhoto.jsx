// src/components/RecoverPhoto.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";

import FormularioJerarquicoMUI from "./FormularioJerarquicoMUI";
import { formatFecha } from "../utils/formatFecha";
import styles from "../styles/recoverPhoto.module.css";

const RecoverPhoto = () => {
  const navigate = useNavigate();

  // UI state
  const [formData, setFormData] = useState({ region: null, diagnostico: null });
  const [mostrarFormulario, setMostrarFormulario] = useState(true);
  const [mostrarResultados, setMostrarResultados] = useState(false);

  // Data
  const [resultados, setResultados] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);

  // Files / actions
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [mostrarCarrusel, setMostrarCarrusel] = useState(false);
  const importInputRef = useRef();

  // ENV
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  // Helpers
  const esVideo = (url = "") =>
    url.endsWith(".mp4") ||
    url.endsWith(".webm") ||
    url.endsWith(".mov") ||
    url.endsWith(".avi") ||
    url.endsWith(".mkv");

  // Buscar casos
  const handleBuscar = async () => {
    try {
      const params = new URLSearchParams();
      if (formData.region) params.append("region", formData.region);
      if (formData.diagnostico) params.append("diagnostico", formData.diagnostico);

      const res = await fetch(`${apiUrl}/api/images/search?${params.toString()}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setResultados(data);
      setMostrarResultados(true);
      setMostrarFormulario(false);
    } catch (err) {
      console.error("Error al buscar:", err);
      alert("Error al buscar casos");
    }
  };

  // Actualizar caso
  const handleUpdateCase = async (id, updates) => {
    try {
      const res = await fetch(`${apiUrl}/api/images/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(await res.text());
      const updatedCase = await res.json();
      setSelectedCase(updatedCase);
      alert("Caso actualizado correctamente");
    } catch (err) {
      console.error("Error al actualizar caso:", err);
      alert("No se pudo actualizar el caso");
    }
  };

  // Importar archivos
  const handleImportFiles = async (fileList) => {
    if (!selectedCase) return;
    const files = Array.from(fileList || []);
    if (!files.length) return;

    try {
      for (const f of files) {
        const fd = new FormData();
        fd.append("images", f, f.name);
        const res = await fetch(
          `${apiUrl}/api/images/cases/${selectedCase.id}/images`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          }
        );
        if (!res.ok) throw new Error(await res.text());
      }
      await refreshSelectedCase();
    } catch (err) {
      console.error("Error al importar archivos:", err);
      alert("No se pudieron importar algunos archivos");
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  // Refrescar caso
  const refreshSelectedCase = async () => {
    if (!selectedCase) return;
    try {
      const res = await fetch(
        `${apiUrl}/api/images/search?dni=${selectedCase.dni}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(await res.text());
      const lista = await res.json();
      const mismo = Array.isArray(lista)
        ? lista.find((c) => c.id === selectedCase.id)
        : null;
      if (mismo) setSelectedCase(mismo);
    } catch (err) {
      console.error("Error al refrescar caso:", err);
    }
  };

  // Seleccionar archivos
  const toggleFileSelection = (url) => {
    setSelectedFiles((prev) =>
      prev.includes(url) ? prev.filter((f) => f !== url) : [...prev, url]
    );
  };

  // Bloquear scroll fondo
  useEffect(() => {
    if (selectedCase) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [selectedCase]);

  // Exportar a carpeta
  async function verifyDirectoryPermission(dirHandle) {
    try {
      const opts = { mode: "readwrite" };
      const q = await dirHandle.queryPermission?.(opts);
      if (q === "granted") return true;
      const r = await dirHandle.requestPermission?.(opts);
      return r === "granted";
    } catch (e) {
      console.error("[permiso] error solicitando permiso:", e);
      return false;
    }
  }

  async function fetchBlobAndExtDiag(url, token) {
    const pickExt = (res) => {
      const ct = res.headers.get("Content-Type") || "";
      const m = url.match(/\.(jpg|jpeg|png|webp|gif|bmp|tif|tiff|mp4|mov|avi|mkv|webm)(?:\?|$)/i);
      if (ct.startsWith("image/")) return "." + (ct.split("/")[1]?.split(";")[0] || "jpg");
      if (ct.startsWith("video/")) return "." + (ct.split("/")[1]?.split(";")[0] || "mp4");
      return m ? "." + m[1].toLowerCase() : ".bin";
    };

    const tries = [
      token ? { headers: { Authorization: `Bearer ${token}` }, mode: "cors", cache: "no-store" } : null,
      { mode: "cors", cache: "no-store" },
    ].filter(Boolean);

    for (const opts of tries) {
      try {
        const res = await fetch(url, opts);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const ext = pickExt(res);
        return { blob, ext };
      } catch (e) {
        console.warn("[fetch fallo variante]", e);
      }
    }
    throw new Error("Failed to fetch");
  }

  const handleExportToFolder = async () => {
    try {
      const selection = selectedFiles || [];
      if (!selection.length) {
        alert("No hay archivos seleccionados.");
        return;
      }

      if (!window.showDirectoryPicker) {
        alert("Tu navegador no permite elegir carpeta (solo escritorio con HTTPS o localhost).");
        return;
      }

      const baseDir = await window.showDirectoryPicker({
        id: "med_viewer_export",
        mode: "readwrite",
        startIn: "downloads",
      });

      const okPerm = await verifyDirectoryPermission(baseDir);
      if (!okPerm) {
        alert("No concediste permiso de escritura sobre la carpeta.");
        return;
      }

      const token = localStorage.getItem("token");

      for (let i = 0; i < selection.length; i++) {
        const fileUrl = selection[i];
        const { blob, ext } = await fetchBlobAndExtDiag(fileUrl, token);
        const fileHandle = await baseDir.getFileHandle(
          `${String(i + 1).padStart(3, "0")}${ext}`,
          { create: true }
        );
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      }

      alert("¡Listo! Archivos guardados en la carpeta elegida ✅");
    } catch (err) {
      console.error("Error al exportar:", err);
      alert("Error al exportar. Revisá permisos, HTTPS y CORS.");
    }
  };

  // =============================
  // RENDER
  // =============================
  return (
    <div className={styles.recoverPhotoContainer}>
      {/* HEADER */}
      {!selectedCase && (
        <div className={styles.header}>
          <button onClick={() => navigate(-1)} aria-label="Volver">
            <ArrowLeft size={24} />
          </button>
          <h2>Encontrar mis casos</h2>
        </div>
      )}

      {/* FORMULARIO */}
      {!selectedCase && mostrarFormulario && (
        <div className={styles.formularioBox}>
          <FormularioJerarquicoMUI onChange={setFormData} />
          <button onClick={handleBuscar} className={styles.buscarBtn}>
            Buscar Casos
          </button>
        </div>
      )}

      {/* RESULTADOS */}
      {!selectedCase && mostrarResultados && (
        <div className={styles.resultadosContainer}>
          <div className={styles.header}>
            <button onClick={() => setMostrarFormulario(true)}>⬅️ Nueva búsqueda</button>
            <h2>Resultados</h2>
          </div>

          {(!resultados || resultados.length === 0) ? (
            <p>No se encontraron resultados</p>
          ) : (
            resultados.map((caso, index) => (
              <div key={index} className={styles.caseCard}>
                <Swiper spaceBetween={6} slidesPerView={3} navigation modules={[Navigation]}>
                  {caso.images?.map((media, idx) => (
                    <SwiperSlide key={idx}>
                      {esVideo(media.url) ? (
                        <video src={media.url} controls className={styles.caseMedia} />
                      ) : (
                        <img src={media.url} alt={`img-${idx}`} className={styles.caseMedia} />
                      )}
                    </SwiperSlide>
                  ))}
                </Swiper>

                <div className={styles.caseInfo}>
                  <p><strong>DNI:</strong> {caso.dni}</p>
                  <p><strong>Diagnóstico:</strong> {caso.diagnostico}</p>
                  <button
                    onClick={() => {
                      setSelectedCase(caso);
                      setMostrarResultados(false);
                      setSelectedFiles([]);
                    }}
                    className={styles.openBtn}
                  >
                    📂 Abrir caso
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL CASO */}
      {selectedCase && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.header}>
              <h2>
                Caso: {selectedCase.dni} – {formatFecha(selectedCase.createdAt)}
              </h2>
              <div className={styles.headerButtons}>
                <button
                  onClick={() => setMostrarCarrusel(true)}
                  className={styles.expandBtn}
                >
                  🔍 Ampliar fotos
                </button>
                <button
                  onClick={() => {
                    setSelectedCase(null);
                    setSelectedFiles([]);
                    setMostrarResultados(true);
                  }}
                  className={styles.closeBtn}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Barra de comandos */}
            <div className={styles.commandBar}>
              <span className={styles.commandLabel}>Agregar nuevos archivos:</span>

              <button
                onClick={() => importInputRef.current?.click()}
                className={`${styles.actionBtn} ${styles.importBtn}`}
              >
                📁 Importar
              </button>
              <input
                type="file"
                ref={importInputRef}
                style={{ display: "none" }}
                accept="image/*,video/*"
                multiple
                onChange={(e) => handleImportFiles(e.target.files)}
              />

              {selectedFiles.length > 0 && (
                <button
                  onClick={handleExportToFolder}
                  className={`${styles.actionBtn} ${styles.exportFolderBtn}`}
                >
                  📁 Exportar a carpeta
                </button>
              )}
            </div>

            {/* Galería del caso */}
            <div className={styles.caseMediaStrip}>
              <Swiper spaceBetween={6} slidesPerView={3} navigation modules={[Navigation]}>
                {selectedCase.images?.map((media, idx) => (
                  <SwiperSlide key={idx}>
                    <div className={styles.thumbnail}>
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(media.url)}
                        onChange={() => toggleFileSelection(media.url)}
                        className={styles.thumbCheckbox}
                      />
                      {esVideo(media.url) ? (
                        <video src={media.url} controls className={styles.caseMedia} />
                      ) : (
                        <img src={media.url} alt={`img-${idx}`} className={styles.caseMedia} />
                      )}
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Editor de caso */}
            <div className={styles.caseEditor}>
              <h3>✏️ Editar caso</h3>
              <div className={styles.formGrid}>
                <input
                  type="text"
                  name="region"
                  placeholder="Región"
                  value={selectedCase.region || ""}
                  onChange={(e) =>
                    setSelectedCase({ ...selectedCase, region: e.target.value })
                  }
                />
                <input
                  type="text"
                  name="diagnostico"
                  placeholder="Diagnóstico"
                  value={selectedCase.diagnostico || ""}
                  onChange={(e) =>
                    setSelectedCase({
                      ...selectedCase,
                      diagnostico: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  name="tratamiento"
                  placeholder="Tratamiento"
                  value={selectedCase.tratamiento || ""}
                  onChange={(e) =>
                    setSelectedCase({
                      ...selectedCase,
                      tratamiento: e.target.value,
                    })
                  }
                />
                <select
                  name="fase"
                  value={selectedCase.fase || ""}
                  onChange={(e) =>
                    setSelectedCase({ ...selectedCase, fase: e.target.value })
                  }
                >
                  <option value="">Seleccione fase</option>
                  <option value="pre">Pre</option>
                  <option value="intra">Intra</option>
                  <option value="post">Post</option>
                </select>
              </div>

              <div className={styles.editorActions}>
                <button
                  onClick={() =>
                    handleUpdateCase(selectedCase.id, {
                      region: selectedCase.region,
                      diagnostico: selectedCase.diagnostico,
                      tratamiento: selectedCase.tratamiento,
                      fase: selectedCase.fase,
                    })
                  }
                  className={`${styles.actionBtn} ${styles.saveBtn}`}
                >
                  💾 Guardar caso
                </button>
              </div>
            </div>
          </div>

          {/* VISOR FULLSCREEN */}
          {mostrarCarrusel && (
            <div className={styles.fullscreenOverlay}>
              <button
                onClick={() => setMostrarCarrusel(false)}
                className={styles.closeFullscreenBtn}
              >
                ×
              </button>
              <Swiper
                modules={[Navigation]}
                navigation
                spaceBetween={30}
                slidesPerView={1}
                className={styles.fullscreenSwiper}
              >
                {selectedCase.images?.map((media, idx) => (
                  <SwiperSlide key={idx}>
                    {esVideo(media.url) ? (
                      <video
                        src={media.url}
                        controls
                        className={styles.fullscreenMedia}
                      />
                    ) : (
                      <img
                        src={media.url}
                        className={styles.fullscreenMedia}
                        alt={`img-${idx}`}
                      />
                    )}
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecoverPhoto;
