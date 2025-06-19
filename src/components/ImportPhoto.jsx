// src/components/ImportPhoto.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const ImportPhoto = () => {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h2>Importar Foto</h2>
      {/* Aquí irá tu lógica de importación */}
      <button onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>
        Volver
      </button>
    </div>
  );
};

export default ImportPhoto;