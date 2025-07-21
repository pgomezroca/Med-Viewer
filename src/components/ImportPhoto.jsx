// src/components/ImportPhoto.jsx

import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/importPhoto.module.css";
import FormularioJerarquico from "../components/FormularioJerarquico";
import { FaArrowLeft } from 'react-icons/fa';

const ImportPhoto = () => {
  
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [previewImages, setPreviewImages] = useState([]);
  const [fileList, setFileList] = useState([]); 
  const [subiendo, setSubiendo] = useState(false);
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
    setFileList((prev) => [...prev, ...files]);
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
    const files = fileList;
        if (!files || files.length === 0) {
         alert("No hay imágenes seleccionadas.");
       return;
      }
      setSubiendo(true);
    const uploads = Array.from(files).map(async (file) => {
      const data = new FormData();
      data.append("image", file);
      data.append("optionalDNI",formData.dni||"");
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

        if (!res.ok) throw new Error(`Respuesta inválida (${res.status})`);

        const result = await res.json();
        console.log("✅ Imagen subida:", result);
        return { success: true };
      } catch (err) {
        console.error("❌ Error subiendo imagen:", err);
        return { success: false, message: err.message };
      }
    });

    const results=await Promise.all(uploads);
    setSubiendo(false);
    const fallidas = results.filter((r) => !r.success);
    if (fallidas.length > 0) {
      alert(`❌ ${fallidas.length} imágenes fallaron al subir.`);
    } else {
      alert("✅ Todas las imágenes fueron subidas correctamente");
      setPreviewImages([]);
      fileInputRef.current.value = "";
    }
  };
  const handleRemoveImage = (indexToRemove) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== indexToRemove));
    setFileList((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  return (
    <div className={styles.pantallaUpload}>
       <div className={styles.scrollableContent}>
       <h3>Clasifica tus fotos:Importalas y luego dales etiquetas con el formulario</h3>
    
      <div className={styles.topButtonRow}>
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
    <div key={index} className={styles.previewWrapper}>
      <img
        src={src}
        alt={`preview-${index}`}
        className={styles.previewImg}
      />
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

      {/* dni */}
     
   , <FormularioJerarquico
        campos={["dni", "region", "etiologia", "tejido", "diagnostico", "tratamiento", "fase"]}
        onChange={setFormData}
      />
      </div> 
      <div className={styles.finalButtons}>
      {/* Botón guardar con etiquetas (por ahora no hace nada) */}
      <button className={styles.button}
              onClick={handleGuardar}
      >
       {subiendo ? "Guardando..." : "Guardar con etiquetas"} 
      </button>

      <button
        className={styles.button}
        onClick={() => navigate("/despedida")}
        style={{ marginTop: "1rem" }}
      >
        Finalizar
      </button>
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        <FaArrowLeft /> Atrás
      </button>
      
    </div>
    </div>
  );
};

export default ImportPhoto;
