// src/components/ImportPhoto.jsx

import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/importPhoto.module.css'
import FormularioJerarquico from '../components/FormularioJerarquico';

const ImportPhoto = () => {
  const [dni, setDni] = useState('');
  const [formData,setFormData]=useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [previewImages, setPreviewImages] = useState([]);
  const [fase, setFase] = useState('');

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...urls]);
  };
  
  const handleGuardar = () => {
    console.log('Guardar imagen con datos:', {
      dni,
      ...formData,
      previewImages
    });
    alert('Función de guardado aún no implementada');
  };

  return (
    <div className={styles.pantallaUpload}>
      <h2 >Clasificador de fotos</h2>
      <h3> Importá una foto para previsualizarla</h3>

      {/* Formulario */}
      <button className={styles.button} onClick={handleImportClick}>
      Importar fotos
    </button>

    {/* Input oculto */}
    <input
      type="file"
      accept="image/*"
      multiple
      ref={fileInputRef}
      style={{ display: 'none' }}
      onChange={handleFileChange}
    />

    {/* Previsualización */}
    {previewImages.length > 0 && (
      <div className={styles.previewContainer}>
        <p>Previsualización:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
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
      style={{ marginTop: '1rem' }}
      onClick={() => alert('Guardar con etiquetas aún no implementado')}
    >
      Guardar con etiquetas
    </button>

    <button
      className={styles.button}
      onClick={() => navigate('/despedida')}
      style={{ marginTop: '1rem' }}
    >
      Finalizar
    </button>
  </div>
  );
};

export default ImportPhoto;
