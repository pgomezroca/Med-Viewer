import React, { useState, useEffect } from 'react';
import { estructuraJerarquica } from '../data/estructura-jerarquica';
import { extraerDiagnosticosPorRegion } from '../helpers/extraerDiagnosticosPorRegion';
import styles from '../styles/FormularioJerarquico.module.css';

const FormularioJerarquico = ({ campos = [], onChange, valores = {} }) => {
  const [dni, setDni] = useState(valores.dni ||'');
  const [region, setRegion] = useState(valores.region ||'');
  const [etiologia, setEtiologia] = useState(valores.etiologia ||'');
  const [tejido, setTejido] = useState(valores.tejido ||'');
  const [diagnostico, setDiagnostico] = useState(valores.diagnostico ||'');
  const [tratamiento, setTratamiento] = useState(valores.tratamiento||'');
  const [fase, setFase] = useState(valores.fase ||'');

  // ✅ Detectar automáticamente si estamos en modo "simple"
  const esSimple = campos.includes("region") && campos.includes("diagnostico") &&
                   !campos.includes("etiologia") && !campos.includes("tejido");

  useEffect(() => {
    const payload = {};
    if (campos.includes("dni")) payload.dni = dni;
    if (campos.includes("region")) payload.region = region;
    if (campos.includes("etiologia")) payload.etiologia = etiologia;
    if (campos.includes("tejido")) payload.tejido = tejido;
    if (campos.includes("diagnostico")) payload.diagnostico = diagnostico;
    if (campos.includes("tratamiento")) payload.tratamiento = tratamiento;
    if (campos.includes("fase")) payload.fase = fase;

    onChange(payload);
  }, [dni, region, etiologia, tejido, diagnostico, tratamiento, fase]);

  return (
    <div 
    className={styles.formContainer}>
      {campos.includes("dni") && (
        <input
          type="text"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          placeholder="DNI del paciente"
          maxLength={8}
          className={styles.dniInput}
        />
      )}

      {campos.includes("region") && (
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
      )}

      {campos.includes("etiologia") && region && !esSimple && (
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

      {campos.includes("tejido") && region && etiologia && !esSimple && (
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

      {campos.includes("diagnostico") && region && (
        <select value={diagnostico} onChange={e => {
          setDiagnostico(e.target.value);
          setTratamiento('');
        }}>
          <option value="">Seleccioná diagnóstico</option>
          {(esSimple
            ? extraerDiagnosticosPorRegion(estructuraJerarquica, region)
            : region && etiologia && tejido
              ? Object.keys(estructuraJerarquica[region][etiologia][tejido])
              : []
          ).map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      )}

      {campos.includes("tratamiento") && region && diagnostico && !esSimple && (
        <select value={tratamiento} onChange={e => setTratamiento(e.target.value)}>
          <option value="">Seleccioná tratamiento</option>
          {(estructuraJerarquica[region]?.[etiologia]?.[tejido]?.[diagnostico] || []).map((t, i) => (
            <option key={i} value={t}>{t}</option>
          ))}
        </select>
      )}

      {campos.includes("fase") && (
        <select value={fase} onChange={e => setFase(e.target.value)}>
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
