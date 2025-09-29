// src/components/ImportPhoto.jsx

import React, { useRef, useState,useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/importPhoto.module.css";
import FormularioJerarquico from "../components/FormularioJerarquico";
import { FaArrowLeft } from 'react-icons/fa';
import DropZone from "./DropZone";
const ImportPhoto = () => {
  
  const [formData, setFormData] = useState({});
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

  const handleFilesSelected = useCallback((files) => {
    const array = Array.from(files || []);
    if (!array.length) return;

    const urls = array.map((file) => URL.createObjectURL(file));
    setPreviewImages((prev) => [...prev, ...urls]);
    setFileList((prev) => [...prev, ...array]);
  }, []);
  const handleFileChange = useCallback(
    (e) => handleFilesSelected(e.target.files),
    [handleFilesSelected]
  );
  const handleGuardar = async () => {
    if (!formData.region || !formData.diagnostico || !formData.fase || fileList.length === 0) {
      alert("Faltan datos obligatorios (mínimo: región, diagnóstico, fase e imagen)");
      return;
    }

    setSubiendo(true);

    try {
      const data = new FormData();
      
      fileList.forEach((file, index) => {
        data.append(`images`, file);
      });

      data.append("dni", formData.dni || "");
      data.append("region", formData.region);
      data.append("diagnostico", formData.diagnostico);
      data.append("tejido", formData.tejido || "");
      data.append("etiologia", formData.etiologia || "");
      data.append("tratamiento", formData.tratamiento || "");
      data.append("fase", formData.fase || "");

      const res = await fetch(`${apiUrl}/api/images/cases/take-photo-or-import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: data,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error en la respuesta (${res.status})`);
      }

      const result = await res.json();
      console.log(" Caso creado con imágenes:", result);
      alert(" Caso creado correctamente con todas las imágenes");
      
      setPreviewImages([]);
      setFileList([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
    } catch (err) {
      console.error("❌ Error al crear el caso:", err);
      alert(`❌ Error al crear el caso: ${err.message}`);
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
       <h3>Clasifica tus fotos:Importalas y luego dales etiquetas con el formulario</h3>
       {/* ⬇️ NUEVA ZONA DE DRAG & DROP */}
       <DropZone onFilesSelected={handleFilesSelected} />
      
      {/* Input oculto */}
      <input
        type="file"
        accept="image/*"
        capture={false}
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
           <img src={src}
           alt={`preview-${index}`}
           className={styles.previewImg}
           />
         <button  className={styles.removeButton}
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
