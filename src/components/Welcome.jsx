import React from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
  const navigate = useNavigate();
  return (
    <div id='pantallaBienvenida' style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>Bienvenido a Med-Photo</h1>
      <p>Capturá, organizá y almacená tus imágenes clínicas de forma simple y segura.</p>
          
      <div className="buttons" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
        <button onClick={() => navigate('/take-photo')}>Tomar Foto</button>
        <button onClick={() => navigate('/import-photo')}>Importar Foto</button>
        <button onClick={() => navigate('/recover-photo')}>Recuperar Foto</button>
      </div>
    </div>
  );
};

export default Welcome;
