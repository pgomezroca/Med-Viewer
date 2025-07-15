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

import Landing from './components/Landing';
import Login from './components/Login';
import Register from './components/Register';

function App() {
  return (
    <Router>
      <Routes>
        {/* RUTA PRINCIPAL: LANDING PÚBLICA */}
        <Route path="/" element={<Landing />} />

        {/* LOGIN Y REGISTRO */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* APP PRIVADA CON LAYOUT */}
        <Route path="/welcome" element={<MainLayout />}>
          <Route index element={<Welcome />} />
          <Route path="take-photo" element={<TakePhoto />} />
          <Route path="import-photo" element={<ImportPhoto />} />
          <Route path="recover-photo" element={<RecoverPhoto />} />
          <Route path="formulario" element={<FormularioJerarquico />} />
          <Route path="despedida" element={<Despedida />} />
          <Route path="complete-image-labels" element={<CompleteImageLabels />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
