// src/components/RecoverPhoto.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const RecoverPhoto = () => {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h2>Recuperar Foto</h2>
      {/* Aquí irá tu lógica de recuperación */}
      <button onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>
        Volver
      </button>
    </div>
  );
};

export default RecoverPhoto;
