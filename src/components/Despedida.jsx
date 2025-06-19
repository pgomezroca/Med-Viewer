


import React from 'react';
import { useNavigate } from 'react-router-dom';
const Despedida = () => {
  return (
    <div id="pantallaDespedida">
     
      <h2>¡Gracias por usar Med-Photo!</h2>
      <p>
        Lee nuestros{' '}
        <a
          href="/terms.html"
          target="_blank"
          rel="noreferrer"
          style={{
            color: '#4fd1c5',
            textDecoration: 'underline'
          }}
        >
          Términos &amp; Condiciones
        </a>
      </p>
      <h6>Para salir, cierra la pestaña de tu navegador.</h6>
    </div>
  );
};

export default Despedida;

/*
  Ahora, en src/App.jsx, importa y registra la ruta:

  import Goodbye from './components/Goodbye';

  <Routes>
    <Route path="/" element={<Welcome />} />
    <Route path="/take-photo" element={<TakePhoto />} />
    <Route path="/import-photo" element={<ImportPhoto />} />
    <Route path="/recover-photo" element={<RecoverPhoto />} />
    <Route path="/goodbye" element={<Goodbye />} />
  </Routes>

  Y modifica el botón “Finalizar” en TakePhoto para navegar:
    onClick={() => navigate('/goodbye')}
*/
