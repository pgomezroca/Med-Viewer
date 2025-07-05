// src/components/ImportPhoto.jsx

import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/importPhoto.module.css";
import FormularioJerarquico from "../components/FormularioJerarquico";
import { FaArrowLeft } from 'react-icons/fa';

const ImportPhoto = () => {
  const [dni, setDni] = useState("");
  const [formData, setFormData] = useState("");
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [previewImages, setPreviewImages] = useState([]);
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewImages((prev) => [...prev, ...urls]);
  };

  const handleGuardar = async () => {
    if (
      !formData.region ||
      !formData.diagnostico ||
      !formData.fase ||
      previewImages.length === 0
    ) {
      alert(
        "Faltan datos obligatorios (mínimo: región, diagnóstico, fase e imagen)"
      );
      return;
    }
    const files = fileInputRef.current.files;

    const uploads = Array.from(files).map(async (file) => {
      const data = new FormData();
      data.append("image", file);
      data.append("optionalDNI", dni);
      data.append("region", formData.region);
      data.append("diagnostico", formData.diagnostico);
      data.append("tejido", formData.tejido || "");
      data.append("etiologia", formData.etiologia || "");
      data.append("tratamiento", formData.tratamiento || "");
      data.append("fase", formData.fase || "");

      try {
        const res = await fetch(`${apiUrl}/api/images/upload`, {
          method: "POST",
          body: data,
        });

        if (!res.ok) throw new Error("Error en la subida");

        const result = await res.json();
        console.log("✅ Imagen subida:", result);
      } catch (err) {
        console.error("❌ Error subiendo imagen:", err);
        alert(`Error al subir una imagen: ${err.message}`);
      }
    });

    await Promise.all(uploads);
    alert("✅ Todas las imágenes fueron subidas correctamente");
    setPreviewImages([]);
    fileInputRef.current.value = "";
  };

  return (
    <div className={styles.pantallaUpload}>
     <div className={styles.topButtonRow}>
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        <FaArrowLeft /> Atrás
      </button>

     <button className={styles.button} onClick={handleImportClick}>
        Importar fotos
      </button>
     </div>
      {/* Input oculto */}
      <input
        type="file"
        accept="image/*"
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
           <img
             key={index}
             src={src}
             alt={`preview-${index}`}
             className={styles.previewImg}
           />
         ))}
       </div>
     </div>
     
      )}

      {/* dni */}
      <input
        type="text"
        placeholder="DNI (opcional)"
        className={styles.input}
        value={dni}
        onChange={(e) => setDni(e.target.value)}
      />

      <FormularioJerarquico onChange={setFormData} />
      {/* Botón guardar con etiquetas (por ahora no hace nada) */}
      <button
        className={styles.button}
        style={{ marginTop: "1rem" }}
        onClick={handleGuardar}
      >
        Guardar con etiquetas
      </button>

      <button
        className={styles.button}
        onClick={() => navigate("/despedida")}
        style={{ marginTop: "1rem" }}
      >
        Finalizar
      </button>
    </div>
  );
};

export default ImportPhoto;
