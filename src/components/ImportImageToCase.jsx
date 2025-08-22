import React, { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "../styles/importPhoto.module.css";
import { FaArrowLeft } from "react-icons/fa";

const ImportImageToCase = () => {
  const { caseId } = useParams(); 
  console.log("🔎 useParams:", caseId);
  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const [previewImages, setPreviewImages] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [subiendo, setSubiendo] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewImages((prev) => [...prev, ...urls]);
    setFileList((prev) => [...prev, ...files]);
  };
  console.log("🔎 caseId desde useParams:", caseId);
  const handleGuardar = async () => {
    if (!caseId) {
      alert("❌ No se encontró un caso activo.");
      return;
    }
    if (fileList.length === 0) {
      alert("Selecciona al menos una imagen o video.");
      return;
    }

    setSubiendo(true);

    try {
      const data = new FormData();
      fileList.forEach((file) => {
        data.append("images", file);
      });
      data.append("caseId", caseId);

      const res = await fetch(`${apiUrl}/api/images/cases/${caseId}/images`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error en la respuesta (${res.status})`);
      }

      const result = await res.json();
      console.log("✅ Imágenes importadas al caso:", result);
      alert("✅ Imágenes agregadas al caso correctamente");

      setPreviewImages([]);
      setFileList([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("❌ Error al importar imágenes:", err);
      alert(`❌ Error al importar imágenes: ${err.message}`);
    } finally {
      setSubiendo(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== indexToRemove));
    setFileList((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  return (
    <div className={styles.pantallaUpload}>
      <div className={styles.scrollableContent}>
        <h3>Importar imágenes al caso existente</h3>

        <div className={styles.topButtonRow}>
          <button className={styles.button} onClick={handleImportClick}>
            Seleccionar imágenes
          </button>
        </div>

        {/* Input oculto */}
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {/* Previsualización */}
        {previewImages.length > 0 && (
          <div className={styles.previewContainer}>
            <div className={styles.previewCarousel}>
              {previewImages.map((src, index) => (
                <div key={index} className={styles.previewWrapper}>
                  <img src={src} alt={`preview-${index}`} className={styles.previewImg} />
                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemoveImage(index)}
                    aria-label="Eliminar imagen"
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={styles.finalButtons}>
        <button className={styles.button} onClick={handleGuardar}>
          {subiendo ? "Guardando..." : "Guardar en caso"}
        </button>

        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <FaArrowLeft /> Atrás
        </button>
      </div>
    </div>
  );
};

export default ImportImageToCase;
