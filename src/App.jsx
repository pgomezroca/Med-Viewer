import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './components/Welcome';
import TakePhoto from './components/TakePhoto';
import ImportPhoto from './components/ImportPhoto';
import RecoverPhoto from './components/RecoverPhoto';
import Despedida from './components/Despedida'
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome/>} />
        <Route path="/take-photo" element={<TakePhoto />} />
        <Route path="/import-photo" element={<ImportPhoto />} />
        <Route path="/recover-photo" element={<RecoverPhoto />} />
        <Route path="/Despedida" element={<Despedida />} />

      </Routes>
    </Router>
  );
}

export default App;