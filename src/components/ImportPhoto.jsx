// src/components/ImportPhoto.jsx

import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/importPhoto.module.css'

const ImportPhoto = () => {
  const [dni, setDni] = useState('');
 const [region, setRegion] = useState('');
 const [diagnostico, setDiagnostico] = useState('');
 const [fase, setFase] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [previewImages, setPreviewImages] = useState([]);

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
  const diagnosticosPorRegion = {
    cuello: ['plexo-braquial', 'fractura-clavicula'],
    hombro: ['manguito-rotador', 'acromio-clavicular', 'fx-escapula', 'fx-cabeza-humeral', 'otros'],
    brazo: ['fracturas', 'ruptura-biceps', 'brazo-otro'],
    codo: ['fracturas-codo', 'luxaciones-codo', 'otro'],
    antebrazo: ['fracturas-antebrazo', 'luxaciones-antebrazo', 'heridas-graves', 'otros-antebrazo'],
    muñeca: ['fracturas', 'luxaciones-muñeca', 'heridas-graves-muñeca'],
    mano: ['fracturas-mano', 'inestabilidades', 'seccion-tendones-nervios', 'amputaciones', 'tumores-mano', 'congenito-mano', 'otros-mano'],
    microcirugia: ['reimplantes', 'colgajos', 'sutura-de-nervios'],
   det: ['hombro', 'muñeca', 'det-otro'],
   };

  return (
    <div className={styles.pantallaUpload}>
      <h2 >Clasificador de fotos</h2>
      <h3>Primero importá una foto para previsualizarla</h3>

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

    {/* Formulario */}
    <input
      type="text"
      placeholder="DNI (opcional)"
      className={styles.input}
      value={dni}
      onChange={(e) => setDni(e.target.value)}
    />

    <select
      className={styles.select}
      value={region}
      onChange={(e) => {
        setRegion(e.target.value);
        setDiagnostico(''); // reseteamos si cambia la región
      }}
      required
    >
      <option value="" disabled>Seleccioná región anatómica</option>
      {Object.keys(diagnosticosPorRegion).map((r) => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>

    {region && (
      <select
        className={styles.select}
        value={diagnostico}
        onChange={(e) => setDiagnostico(e.target.value)}
        required
      >
        <option value="" disabled>Seleccioná diagnóstico</option>
        {diagnosticosPorRegion[region]?.map((diag) => (
          <option key={diag} value={diag}>{diag}</option>
        ))}
      </select>
    )}

    <select
      className={styles.select}
      value={fase}
      onChange={(e) => setFase(e.target.value)}
      required
    >
      <option value="" disabled>Seleccioná fase</option>
      <option value="pre">Pre</option>
      <option value="intra">Intra</option>
      <option value="post">Post</option>
    </select>

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
