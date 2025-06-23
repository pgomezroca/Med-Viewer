// src/components/FormularioJerarquico.jsx
import React, { useState, useEffect } from 'react';
import { estructuraJerarquica } from '../data/estructura-jerarquica';
import styles from '../styles/FormularioJerarquico.module.css'
const FormularioJerarquico = ({ onChange }) => {
  const [region, setRegion] = useState('');
  const [etiologia, setEtiologia] = useState('');
  const [tejido, setTejido] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [tratamiento, setTratamiento] = useState('');

  // Enviar cambios al componente padre
  useEffect(() => {
    onChange({ region, etiologia, tejido, diagnostico, tratamiento });
  }, [region, etiologia, tejido, diagnostico, tratamiento]);

  return (
    <div className={styles.selectRow}>
      {/* REGIÓN */}
      <select value={region} onChange={e => {
        setRegion(e.target.value);
        setEtiologia('');
        setTejido('');
        setDiagnostico('');
        setTratamiento('');
      }}>
        <option value="">Seleccioná región</option>
        {Object.keys(estructuraJerarquica).map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      {/* ETIOLOGÍA */}
      {region && (
        <select value={etiologia} onChange={e => {
          setEtiologia(e.target.value);
          setTejido('');
          setDiagnostico('');
          setTratamiento('');
        }}>
          <option value="">Seleccioná etiología</option>
          {Object.keys(estructuraJerarquica[region]).map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      )}

      {/* TEJIDO */}
      {region && etiologia && (
        <select value={tejido} onChange={e => {
          setTejido(e.target.value);
          setDiagnostico('');
          setTratamiento('');
        }}>
          <option value="">Seleccioná tejido</option>
          {Object.keys(estructuraJerarquica[region][etiologia]).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      )}

      {/* DIAGNÓSTICO */}
      {region && etiologia && tejido && (
        <select value={diagnostico} onChange={e => {
          setDiagnostico(e.target.value);
          setTratamiento('');
        }}>
          <option value="">Seleccioná diagnóstico</option>
          {Object.keys(estructuraJerarquica[region][etiologia][tejido]).map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      )}

      {/* TRATAMIENTO */}
      {region && etiologia && tejido && diagnostico && (
        <select value={tratamiento} onChange={e => setTratamiento(e.target.value)}>
          <option value="">Seleccioná tratamiento</option>
          {(estructuraJerarquica[region][etiologia][tejido][diagnostico] || []).map((t, i) => (
            <option key={i} value={t}>{t}</option>
          ))}
        </select>
      )}
    </div>
  );
};

export default FormularioJerarquico;
