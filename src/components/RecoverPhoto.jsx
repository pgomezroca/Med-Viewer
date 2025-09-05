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
  const [formData, setFormData] = useState({ region: null, diagnostico: null });
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const [modoCamara, setModoCamara] = useState("foto");
  const [mostrarFormulario, setMostrarFormulario] = useState(true);
  const importInputRef = useRef();
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const esVideo = (url) =>
  url.endsWith(".mp4") ||
  url.endsWith(".webm") ||
  url.endsWith(".mov") ||
  url.endsWith(".avi") ||
  url.endsWith(".mkv");
  // 📷 Hook de cámara
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
      const fd = new FormData();
      fd.append("images", blob, filename);
      Object.entries(metaData).forEach(([key, val]) => {
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
        await handleBuscar();
        return true;
      } catch (err) {
        console.error("Error al guardar foto/video:", err);
        return false;
      }
    },
  });

  // 🔎 Buscar casos
  const handleBuscar = async () => {
    try {
      const params = new URLSearchParams();
      if (formData.region) params.append("region", formData.region);
      if (formData.diagnostico) params.append("diagnostico", formData.diagnostico);

      const res = await fetch(
        `${apiUrl}/api/images/search?${params.toString()}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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

  // ✏️ Editar caso
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
      alert("Caso actualizado correctamente");
      setSelectedCase(updatedCase);
    } catch (err) {
      console.error("Error al actualizar caso:", err);
      alert("No se pudo actualizar el caso");
    }
  };

  // 📥 Exportar imágenes seleccionadas
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

  // 🎥 Control de cámara
  useEffect(() => {
    if (mostrarCamara) {
      setPhotoData(null);
      setVideoBlobURL(null);
      initCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mostrarCamara]);

  // =============================
  // 📌 RENDER
  // =============================

  return (
    <div className={styles.recoverPhotoContainer}>
      {/* HEADER */}
      <div className={styles.header}>
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h2>Encontrar mis casos</h2>
      </div>
      {mostrarFormulario ? (
       // 👉 FORMULARIO
      <div className={styles.formularioBox}>
        <FormularioJerarquicoMUI onChange={setFormData} />
       <button onClick={handleBuscar} className={styles.buscarBtn}>
        Buscar Casos
      </button>
    </div>
     ) : (
      <div className={styles.resultadosContainer}>
       <div className={styles.header}>
         <button onClick={() => setMostrarFormulario(true)}>
           ⬅️ Nueva búsqueda
         </button>
         <h2>Resultados</h2>
       </div>
  
          {resultados.length === 0 ? (
            <p>No se encontraron resultados</p>
          ) : (
            resultados.map((caso, index) => (
              <div key={index} className={styles.caseCard}>
                <Swiper 
                 spaceBetween={1}        
                 slidesPerView={3}       
                 navigation      
                 >
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
                  <button onClick={() => setSelectedCase(caso)} className={styles.openBtn}>
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
              <button
                onClick={() => {
                  setSelectedCase(null);
                  setSelectedFiles([]);
                }}
                className={styles.closeBtn}
              >
                ×
              </button>
            </div>

            {/* Archivos */}
            <h3>Archivos existentes</h3>
            <div className={styles.thumbnailGrid}>
              {selectedCase.images?.map((media, idx) => (
                <div key={idx} className={styles.thumbnail}>
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(media.url)}
                    onChange={() => toggleFileSelection(media.url)}
                    style={{ position: "absolute", top: 5, left: 5 }}
                  />
                  {media.url.endsWith(".mp4") || media.url.endsWith(".webm") ? (
                    <video src={media.url} controls />
                  ) : (
                    <img src={media.url} alt={`img-${idx}`} />
                  )}
                </div>
              ))}
            </div>

            {selectedFiles.length > 0 && (
              <button
                onClick={handleExportSelected}
                className={`${styles.actionBtn} ${styles.subirBtn}`}
              >
                📥 Exportar seleccionados
              </button>
            )}

            {/* Agregar archivos */}
            <h3>Agregar nuevos archivos</h3>
            <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
              <button
                onClick={() => importInputRef.current.click()}
                className={`${styles.actionBtn} ${styles.importBtn}`}
              >
                📁 Importar
              </button>
              <button
                onClick={() => {
                  setModoCamara("foto");
                  setMostrarCamara(true);
                }}
                className={`${styles.actionBtn} ${styles.fotoBtn}`}
              >
                📷 Sacar Foto
              </button>
              <button
                onClick={() => {
                  setModoCamara("video");
                  setMostrarCamara(true);
                }}
                className={`${styles.actionBtn} ${styles.videoBtn}`}
              >
                🎥 Grabar Video
              </button>
              <input
                type="file"
                ref={importInputRef}
                style={{ display: "none" }}
                accept="image/*,video/*"
                multiple
              />
            </div>

            {/* Edición */}
            <h3>✏️ Editar datos del caso</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                type="text"
                name="diagnostico"
                defaultValue={selectedCase.diagnostico || ""}
                placeholder="Diagnóstico"
                onChange={(e) =>
                  setSelectedCase({ ...selectedCase, diagnostico: e.target.value })
                }
              />
              <input
                type="text"
                name="tratamiento"
                defaultValue={selectedCase.tratamiento || ""}
                placeholder="Tratamiento"
                onChange={(e) =>
                  setSelectedCase({ ...selectedCase, tratamiento: e.target.value })
                }
              />
              <select
                name="fase"
                value={selectedCase.fase || ""}
                onChange={(e) => setSelectedCase({ ...selectedCase, fase: e.target.value })}
              >
                <option value="">Seleccione fase</option>
                <option value="pre">Pre</option>
                <option value="intra">Intra</option>
                <option value="post">Post</option>
              </select>

              <button
                onClick={() =>
                  handleUpdateCase(selectedCase.id, {
                    diagnostico: selectedCase.diagnostico,
                    tratamiento: selectedCase.tratamiento,
                    fase: selectedCase.fase,
                  })
                }
                className={`${styles.actionBtn} ${styles.subirBtn}`}
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecoverPhoto;
