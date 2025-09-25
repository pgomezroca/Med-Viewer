// src/components/FormularioJerarquico.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { estructuraJerarquica } from '../data/estructura-jerarquica';
import { extraerDiagnosticosPorRegion } from '../helpers/extraerDiagnosticosPorRegion';
import styles from '../styles/FormularioJerarquico.module.css';

const FormularioJerarquico = ({ campos = [], onChange, valores = {} }) => {
  // 🔒 Normalizo campos para evitar "includes is not a function"
  const camposList = Array.isArray(campos) ? campos : [];

  // Estado local
  const [dni, setDni]                 = useState(valores.dni || '');
  const [region, setRegion]           = useState(valores.region || '');
  const [etiologia, setEtiologia]     = useState(valores.etiologia || '');
  const [tejido, setTejido]           = useState(valores.tejido || '');
  const [diagnostico, setDiagnostico] = useState(valores.diagnostico || '');
  const [tratamiento, setTratamiento] = useState(valores.tratamiento || '');
  const [fase, setFase]               = useState(valores.fase || '');

  // Sync de valores entrantes (evita doble useEffect)
  useEffect(() => {
    if ('dni' in valores) setDni(valores.dni || '');
    if ('region' in valores) setRegion(valores.region || '');
    if ('etiologia' in valores) setEtiologia(valores.etiologia || '');
    if ('tejido' in valores) setTejido(valores.tejido || '');
    if ('diagnostico' in valores) setDiagnostico(valores.diagnostico || '');
    if ('tratamiento' in valores) setTratamiento(valores.tratamiento || '');
    if ('fase' in valores) setFase(valores.fase || '');
  }, [valores]);

  // Propago cambios al padre (incluye ETT)
  useEffect(() => {
    const payload = {};
    if (camposList.includes('dni')) payload.dni = dni;
    if (camposList.includes('region')) payload.region = region;
    if (camposList.includes('etiologia')) payload.etiologia = etiologia;
    if (camposList.includes('tejido')) payload.tejido = tejido;
    if (camposList.includes('diagnostico')) payload.diagnostico = diagnostico;
    if (camposList.includes('tratamiento')) payload.tratamiento = tratamiento;
    if (camposList.includes('fase')) payload.fase = fase;
    onChange?.(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dni, region, etiologia, tejido, diagnostico, tratamiento, fase, camposList.join('|')]);

  // ¿Modo simple? (solo region+diagnostico)
  const esSimple = useMemo(() => {
    return camposList.includes('region') &&
           camposList.includes('diagnostico') &&
           !camposList.includes('etiologia') &&
           !camposList.includes('tejido') &&
           !camposList.includes('tratamiento'); // si simple, no debería pedir tratamiento
  }, [camposList]);

  // Helpers seguros para leer estructura
  const regiones = useMemo(() => Object.keys(estructuraJerarquica || {}), []);
  const etiologias = useMemo(() => {
    if (!region) return [];
    const nodo = estructuraJerarquica?.[region];
    return nodo ? Object.keys(nodo) : [];
  }, [region]);

  const tejidos = useMemo(() => {
    if (!region || !etiologia) return [];
    const nodo = estructuraJerarquica?.[region]?.[etiologia];
    return nodo ? Object.keys(nodo) : [];
  }, [region, etiologia]);

  const diagnosticos = useMemo(() => {
    if (!camposList.includes('diagnostico')) return [];
    if (esSimple) {
      return region ? extraerDiagnosticosPorRegion(estructuraJerarquica, region) : [];
    }
    if (!region || !etiologia || !tejido) return [];
    const nodo = estructuraJerarquica?.[region]?.[etiologia]?.[tejido];
    return nodo ? Object.keys(nodo) : [];
  }, [camposList, esSimple, region, etiologia, tejido]);

  const tratamientos = useMemo(() => {
    // Tratamiento solo tiene sentido en modo completo (no simple)
    if (!camposList.includes('tratamiento') || esSimple) return [];
    if (!region || !etiologia || !tejido || !diagnostico) return [];
    const nodo = estructuraJerarquica?.[region]?.[etiologia]?.[tejido]?.[diagnostico];

    // Normalizo varias formas posibles:
    // 1) Array directo
    if (Array.isArray(nodo)) return nodo;

    // 2) Objeto con { tratamientos: [...] }
    if (nodo && Array.isArray(nodo.tratamientos)) return nodo.tratamientos;

    // 3) Objeto con values string
    if (nodo && typeof nodo === 'object') {
      const vals = Object.values(nodo).filter(v => typeof v === 'string');
      if (vals.length) return vals;
    }
    return [];
  }, [camposList, esSimple, region, etiologia, tejido, diagnostico]);

  // Handlers con reseteos en cascada
  const onChangeRegion = (v) => {
    setRegion(v);
    setEtiologia('');
    setTejido('');
    setDiagnostico('');
    setTratamiento('');
  };
  const onChangeEtiologia = (v) => {
    setEtiologia(v);
    setTejido('');
    setDiagnostico('');
    setTratamiento('');
  };
  const onChangeTejido = (v) => {
    setTejido(v);
    setDiagnostico('');
    setTratamiento('');
  };
  const onChangeDiagnostico = (v) => {
    setDiagnostico(v);
    setTratamiento('');
  };

  return (
    <div className={styles.formContainer}>
      {camposList.includes('dni') && (
        <input
          type="text"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          placeholder="DNI del paciente"
          maxLength={8}
          className={styles.dniInput}
        />
      )}

      {camposList.includes('region') && (
        <select value={region} onChange={(e) => onChangeRegion(e.target.value)}>
          <option value="">Seleccioná región</option>
          {regiones.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      )}

      {camposList.includes('etiologia') && region && !esSimple && (
        <select value={etiologia} onChange={(e) => onChangeEtiologia(e.target.value)}>
          <option value="">Seleccioná etiología</option>
          {etiologias.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      )}

      {camposList.includes('tejido') && region && etiologia && !esSimple && (
        <select value={tejido} onChange={(e) => onChangeTejido(e.target.value)}>
          <option value="">Seleccioná tejido</option>
          {tejidos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      )}

      {camposList.includes('diagnostico') && region && (
        <select value={diagnostico} onChange={(e) => onChangeDiagnostico(e.target.value)}>
          <option value="">Seleccioná diagnóstico</option>
          {diagnosticos.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      )}

      {/* Tratamiento solo en modo completo y con todo el contexto */}
      {camposList.includes('tratamiento') && region && etiologia && tejido && diagnostico && !esSimple && (
        <select value={tratamiento} onChange={(e) => setTratamiento(e.target.value)}>
          <option value="">Seleccioná tratamiento</option>
          {tratamientos.map((t, i) => <option key={i} value={t}>{t}</option>)}
        </select>
      )}

      {camposList.includes('fase') && (
        <select value={fase} onChange={(e) => setFase(e.target.value)}>
          <option value="">Seleccioná fase</option>
          <option value="pre">pre</option>
          <option value="intra">intra</option>
          <option value="post">post</option>
        </select>
      )}
    </div>
  );
};

export default FormularioJerarquico;
