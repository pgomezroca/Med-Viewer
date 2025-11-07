import React, { useState, useEffect, useMemo } from 'react';
import { estructuraJerarquica as estructuraDefault } from '../data/estructura-jerarquica';
import { extraerDiagnosticosPorRegion } from '../helpers/extraerDiagnosticosPorRegion';
import styles from '../styles/FormularioJerarquico.module.css';

const FormularioJerarquico = ({ campos = [], onChange, valores = {} }) => {
  const camposList = Array.isArray(campos) ? campos : [];

  // Estados de valores del form
  const [dni, setDni] = useState(valores.dni || '');
  const [region, setRegion] = useState(valores.region || '');
  const [etiologia, setEtiologia] = useState(valores.etiologia || '');
  const [tejido, setTejido] = useState(valores.tejido || '');
  const [diagnostico, setDiagnostico] = useState(valores.diagnostico || '');
  const [tratamiento, setTratamiento] = useState(valores.tratamiento || '');
  const [fase, setFase] = useState(valores.fase || '');

  // 🔹 Estructura dinámica
  const [estructura, setEstructura] = useState(estructuraDefault);
  const [source, setSource] = useState("default");

  useEffect(() => {
    if ('dni' in valores) setDni(valores.dni || '');
    if ('region' in valores) setRegion(valores.region || '');
    if ('etiologia' in valores) setEtiologia(valores.etiologia || '');
    if ('tejido' in valores) setTejido(valores.tejido || '');
    if ('diagnostico' in valores) setDiagnostico(valores.diagnostico || '');
    if ('tratamiento' in valores) setTratamiento(valores.tratamiento || '');
    if ('fase' in valores) setFase(valores.fase || '');
  }, [valores]);

  useEffect(() => {
    const fetchEstructura = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/formulario-jerarquico`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!res.ok) throw new Error("Error al obtener formulario personalizado");

        const data = await res.json();
        if (data?.structure?.length) {
          const estructuraFinal = {};
          data.structure.forEach((region) => {
            estructuraFinal[region.nombre] = {};
            region.etiologias?.forEach((eti) => {
              estructuraFinal[region.nombre][eti.nombre] = {};
              eti.tejidos?.forEach((tej) => {
                estructuraFinal[region.nombre][eti.nombre][tej.nombre] = {};
                tej.diagnosticos?.forEach((dx) => {
                  estructuraFinal[region.nombre][eti.nombre][tej.nombre][dx.nombre] =
                    dx.tratamientos?.map((t) => t.nombre) || [];
                });
              });
            });
          });

          setEstructura(estructuraFinal);
          setSource("user");
        } else {
          setEstructura(estructuraDefault);
          setSource("default");
        }
      } catch (err) {
        console.error("Error cargando estructura jerárquica personalizada:", err);
        setEstructura(estructuraDefault);
      }
    };

    fetchEstructura();
  }, []);

  // Sincronización
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
  }, [dni, region, etiologia, tejido, diagnostico, tratamiento, fase]);

  // Detección de modo simple
  const esSimple = useMemo(() => {
    return (
      camposList.includes('region') &&
      camposList.includes('diagnostico') &&
      !camposList.includes('etiologia') &&
      !camposList.includes('tejido') &&
      !camposList.includes('tratamiento')
    );
  }, [camposList]);

  // Derivaciones
  const regiones = useMemo(() => Object.keys(estructura || {}), [estructura]);
  const etiologias = useMemo(() => (region ? Object.keys(estructura?.[region] || {}) : []), [region, estructura]);
  const tejidos = useMemo(() => (region && etiologia ? Object.keys(estructura?.[region]?.[etiologia] || {}) : []), [region, etiologia, estructura]);
  const diagnosticos = useMemo(() => {
    if (!camposList.includes('diagnostico')) return [];
    if (esSimple) return region ? extraerDiagnosticosPorRegion(estructura, region) : [];
    if (!region || !etiologia || !tejido) return [];
    return Object.keys(estructura?.[region]?.[etiologia]?.[tejido] || {});
  }, [camposList, esSimple, region, etiologia, tejido, estructura]);
  const tratamientos = useMemo(() => {
    if (!camposList.includes('tratamiento') || esSimple) return [];
    if (!region || !etiologia || !tejido || !diagnostico) return [];
    const nodo = estructura?.[region]?.[etiologia]?.[tejido]?.[diagnostico];
    return Array.isArray(nodo) ? nodo : [];
  }, [camposList, esSimple, region, etiologia, tejido, diagnostico, estructura]);

  // Handlers cascada
  const onChangeRegion = (v) => { setRegion(v); setEtiologia(''); setTejido(''); setDiagnostico(''); setTratamiento(''); };
  const onChangeEtiologia = (v) => { setEtiologia(v); setTejido(''); setDiagnostico(''); setTratamiento(''); };
  const onChangeTejido = (v) => { setTejido(v); setDiagnostico(''); setTratamiento(''); };
  const onChangeDiagnostico = (v) => { setDiagnostico(v); setTratamiento(''); };

  return (
    <div className={styles.formContainer}>
       {camposList.includes('dni') && (
        <div className={styles.inputGroup}>
          
          <input
            type="text"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            placeholder="DNI del paciente"
            maxLength={8}
          />
        </div>
      )}

      

    {camposList.includes('region') && (
        <div className={styles.inputGroup}>
          
          <select value={region} onChange={(e) => onChangeRegion(e.target.value)}>
            <option value="">Seleccioná región</option>
            {regiones.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      )}   

    {camposList.includes('etiologia') && region && !esSimple && (
        <div className={styles.inputGroup}>
          
          <select value={etiologia} onChange={(e) => onChangeEtiologia(e.target.value)}>
            <option value="">Seleccioná etiología</option>
            {etiologias.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      )}

   {camposList.includes('tejido') && region && etiologia && !esSimple && (
        <div className={styles.inputGroup}>
          
          <select value={tejido} onChange={(e) => onChangeTejido(e.target.value)}>
            <option value="">Seleccioná tejido</option>
            {tejidos.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}


    {camposList.includes('diagnostico') && region && (
        <div className={styles.inputGroup}>
          
          <select value={diagnostico} onChange={(e) => onChangeDiagnostico(e.target.value)}>
            <option value="">Seleccioná diagnóstico</option>
            {diagnosticos.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      )}

     {camposList.includes('tratamiento') && region && etiologia && tejido && diagnostico && !esSimple && (
        <div className={styles.inputGroup}>
          <label>Tratamiento</label>
          <select value={tratamiento} onChange={(e) => setTratamiento(e.target.value)}>
            <option value="">Seleccioná tratamiento</option>
            {tratamientos.map((t, i) => <option key={i} value={t}>{t}</option>)}
          </select>
        </div>
      )}
       {camposList.includes('fase') && (
        <div className={styles.inputGroup}>
          <label>Fase</label>
          <select value={fase} onChange={(e) => setFase(e.target.value)}>
            <option value="">Seleccioná fase</option>
            <option value="pre">Pre-quirúrgica</option>
            <option value="intra">Intra-quirúrgica</option>
            <option value="post">Post-quirúrgica</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default FormularioJerarquico;
