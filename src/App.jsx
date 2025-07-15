import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

import Welcome from './components/Welcome';
import TakePhoto from './components/TakePhoto';
import ImportPhoto from './components/ImportPhoto';
import RecoverPhoto from './components/RecoverPhoto';
import Despedida from './components/Despedida';
import FormularioJerarquico from './components/FormularioJerarquico';
import CompleteImageLabels from './components/CompleteImageLabels';

function App() {
  return (
    <Router>
      <Routes>
        {/* Layout general con Navbar */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Welcome />} />
          <Route path="take-photo" element={<TakePhoto />} />
          <Route path="import-photo" element={<ImportPhoto />} />
          <Route path="recover-photo" element={<RecoverPhoto />} />
          <Route path="formulario" element={<FormularioJerarquico />} />
          <Route path="despedida" element={<Despedida />} />
          <Route path="complete-image-labels" element={<CompleteImageLabels />} /> 
          {/* Agregá aquí futuras páginas como login, perfil, etc */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
