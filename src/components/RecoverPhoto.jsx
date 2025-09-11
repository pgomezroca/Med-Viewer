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
import { useCamera } from "../hooks/useCamera";

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
  const importInputRef = useRef();

  // Camera
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const [modoCamara, setModoCamara] = useState("foto");

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

  // Hook de cámara
  const {
    videoRef,
    canvasRef,
    videoReady,
    cameraError,
    photoData,
    setPhotoData,
    videoBlobURL,
    setVideoBlobURL,
    isRecording,
    resetCamera,
    takePhoto,
    savePhoto,
    startRecording,
    stopRecording,
    saveVideo,
    initCamera,
    stopCamera,
  } = useCamera({
    initialMode: modoCamara,
    onSave: async (blob, filename, metaData) => {
      if (!selectedCase) return false;
      const fd = new FormData();
      fd.append("images", blob, filename);
      Object.entries(metaData || {}).forEach(([key, val]) => {
        if (val !== undefined && val !== null) fd.append(key, val);
      });

      try {
        const res = await fetch(
          `${apiUrl}/api/images/cases/${selectedCase.id}/images`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          }
        );
        if (!res.ok) throw new Error(await res.text());

        // Refrescar caso abierto
        await refreshSelectedCase();
        return true;
      } catch (err) {
        console.error("Error al guardar foto/video:", err);
        alert("No se pudo guardar la captura");
        return false;
      }
    },
  });

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

  // Importar archivos (input múltiple)
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

  // Refrescar el caso seleccionado
  const refreshSelectedCase = async () => {
    if (!selectedCase) return;
    try {
      // Si tu backend permite buscar por id directo, mejor usar /api/images/:id.
      // Como fallback, vuelvo a /search por DNI y tomo el mismo id.
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

  // Exportar seleccionados
  const toggleFileSelection = (url) => {
    setSelectedFiles((prev) =>
      prev.includes(url) ? prev.filter((f) => f !== url) : [...prev, url]
    );
  };

  const handleExportSelected = () => {
    selectedFiles.forEach((fileUrl, index) => {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = `archivo_${index + 1}${
        fileUrl.endsWith(".mp4") ? ".mp4" : ".jpg"
      }`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  // Cámara on/off por estado
  useEffect(() => {
    if (mostrarCamara) {
      setPhotoData(null);
      setVideoBlobURL(null);
      initCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarCamara]);

  // Bloquear scroll del fondo cuando el modal está abierto
  useEffect(() => {
    if (selectedCase) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [selectedCase]);

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

      {/* FORMULARIO (oculto si hay selectedCase) */}
      {!selectedCase && mostrarFormulario && (
        <div className={styles.formularioBox}>
          <FormularioJerarquicoMUI onChange={setFormData} />
          <button onClick={handleBuscar} className={styles.buscarBtn}>
            Buscar Casos
          </button>
        </div>
      )}

      {/* RESULTADOS (oculto si hay selectedCase) */}
      {!selectedCase && mostrarResultados && (
        <div className={styles.resultadosContainer}>
          <div className={styles.header}>
            <button onClick={() => setMostrarFormulario(true)}>
              ⬅️ Nueva búsqueda
            </button>
            <h2>Resultados</h2>
          </div>

          {(!resultados || resultados.length === 0) ? (
            <p>No se encontraron resultados</p>
          ) : (
            resultados.map((caso, index) => (
              <div key={index} className={styles.caseCard}>
                <Swiper
                  spaceBetween={6}
                  slidesPerView={3}
                  navigation
                  modules={[Navigation]}
                >
                  {caso.images?.map((media, idx) => (
                    <SwiperSlide key={idx}>
                      {esVideo(media.url) ? (
                        <video
                          src={media.url}
                          controls
                          className={styles.caseMedia}
                        />
                      ) : (
                        <img
                          src={media.url}
                          alt={`img-${idx}`}
                          className={styles.caseMedia}
                        />
                      )}
                    </SwiperSlide>
                  ))}
                </Swiper>

                <div className={styles.caseInfo}>
                  <p>
                    <strong>DNI:</strong> {caso.dni}
                  </p>
                  <p>
                    <strong>Diagnóstico:</strong> {caso.diagnostico}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCase(caso);      // abre modal
                      setMostrarResultados(false); // oculta lista
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

      {/* MODAL CASO (fullscreen overlay) */}
      {selectedCase && (
        <div className={styles.modalOverlay}>
          <div
            className={styles.modalContent}
            role="dialog"
            aria-modal="true"
            aria-label={`Caso ${selectedCase.dni}`}
          >
            {/* Header del modal */}
            <div className={styles.header}>
              <h2>
                Caso: {selectedCase.dni} – {formatFecha(selectedCase.createdAt)}
              </h2>
              <button
                onClick={() => {
                  setSelectedCase(null);
                  setSelectedFiles([]);
                  setMostrarResultados(true); // volver a la lista
                }}
                className={styles.closeBtn}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            {/* Barra de comandos dentro del modal */}
            <div className={styles.commandBar}>
              <span className={styles.commandLabel}>
                Agregar nuevos archivos:
              </span>

              {/* Importar */}
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

              {/* Capturar (Foto) */}
              <button
                onClick={() => {
                  setModoCamara("foto");
                  setMostrarCamara(true);
                }}
                className={`${styles.actionBtn} ${styles.fotoBtn}`}
              >
                📷 Foto
              </button>

              {/* Capturar (Video) */}
              <button
                onClick={() => {
                  setModoCamara("video");
                  setMostrarCamara(true);
                }}
                className={`${styles.actionBtn} ${styles.videoBtn}`}
              >
                🎥 Video
              </button>

              {/* Exportar seleccionados */}
              {selectedFiles.length > 0 && (
                <button
                  onClick={handleExportSelected}
                  className={`${styles.actionBtn} ${styles.exportBtn}`}
                >
                  📥 Exportar seleccionados
                </button>
              )}
            </div>

            {/* Galería compacta del caso */}
            <div className={styles.caseMediaStrip}>
              <Swiper
                spaceBetween={6}
                slidesPerView={3}
                navigation
                modules={[Navigation]}
              >
                {selectedCase.images?.map((media, idx) => (
                  <SwiperSlide key={idx}>
                    <div className={styles.thumbnail}>
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(media.url)}
                        onChange={() => toggleFileSelection(media.url)}
                        className={styles.thumbCheckbox}
                        aria-label={`Seleccionar archivo ${idx + 1}`}
                      />
                      {esVideo(media.url) ? (
                        <video src={media.url} controls className={styles.caseMedia} />
                      ) : (
                        <img
                          src={media.url}
                          alt={`img-${idx}`}
                          className={styles.caseMedia}
                        />
                      )}
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Editor de caso */}
            <div className={styles.caseEditor}>
              <h3>✏️ Editar caso</h3>

              {["region", "diagnostico", "tratamiento", "fase"].filter(
                (k) => !selectedCase[k] || selectedCase[k] === ""
              ).length > 0 && (
                <div className={styles.missingTags}>
                  Faltan etiquetas:{" "}
                  <strong>
                    {["region", "diagnostico", "tratamiento", "fase"]
                      .filter((k) => !selectedCase[k] || selectedCase[k] === "")
                      .join(", ")}
                  </strong>
                </div>
              )}

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

            {/* Panel de cámara (opcional) */}
            {mostrarCamara && (
              <div className={styles.cameraPanel}>
                {/* Ejemplo mínimo de UI de cámara */}
                <div className={styles.cameraRow}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={styles.cameraVideo}
                  />
                  <canvas ref={canvasRef} className={styles.cameraCanvas} />
                </div>

                <div className={styles.cameraActions}>
                  {modoCamara === "foto" ? (
                    <>
                      <button
                        className={styles.actionBtn}
                        onClick={takePhoto}
                        disabled={!videoReady}
                      >
                        📸 Tomar foto
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={async () => {
                          if (!photoData) return;
                          const ok = await savePhoto(); // el hook llamará onSave
                          if (ok) setPhotoData(null);
                        }}
                        disabled={!photoData}
                      >
                        💾 Guardar foto
                      </button>
                    </>
                  ) : (
                    <>
                      {!isRecording ? (
                        <button
                          className={styles.actionBtn}
                          onClick={startRecording}
                          disabled={!videoReady}
                        >
                          ⏺️ Grabar
                        </button>
                      ) : (
                        <button className={styles.actionBtn} onClick={stopRecording}>
                          ⏹️ Detener
                        </button>
                      )}
                      <button
                        className={styles.actionBtn}
                        onClick={async () => {
                          const ok = await saveVideo(); // onSave sube
                          if (ok) setVideoBlobURL(null);
                        }}
                        disabled={!videoBlobURL}
                      >
                        💾 Guardar video
                      </button>
                    </>
                  )}

                  <button
                    className={styles.actionBtn}
                    onClick={() => {
                      setMostrarCamara(false);
                      resetCamera();
                    }}
                  >
                    ✖️ Cerrar cámara
                  </button>
                </div>
                {cameraError && (
                  <p className={styles.cameraError}>
                    Error de cámara: {String(cameraError)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecoverPhoto;
