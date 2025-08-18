import React, { useState,useEffect,useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Bienvenida.module.css';
import { Camera, FolderOpen, Tags, Upload, UserPlus } from 'lucide-react';
import FormularioJerarquico from "./FormularioJerarquico";
import SplitButton from "./SplitButton";
import { useSearchParams } from 'react-router-dom';
/* Helpers (asegurate de tenerlos definidos) */


const actions = [
  { label: 'Tomar foto', path: '/welcome/take-photo', icon: <Camera size={24} /> },
  { label: 'Clasificar fotos', path: '/welcome/import-photo', icon: <Upload size={24} /> },
  { label: 'Archivo por patologia', path: '/welcome/recover-photo', icon: <FolderOpen size={24} /> },
  { label: 'Completar etiquetas', path: '/welcome/complete-image-labels', icon: <Tags size={24} /> },
];

const Welcome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;
  const [dni, setDni] = useState('');
  const token  = localStorage.getItem('token');   
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [casos, setCasos] = useState([]); // [{fecha, diagnostico, items: [...]}, ...]
  const [queried, setQueried] = useState(false); 
  const [showNewForm, setShowNewForm] = useState(false);
  const [newDx, setNewDx] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newApellido, setNewApellido] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [showNewCaseForm, setShowNewCaseForm] = useState(false);
  const [ncRegion, setNcRegion] = useState('');
  const [ncDx, setNcDx] = useState('');
  const [searchParams] = useSearchParams();
  const autoStartedRef = useRef(false);
  
  const buscarCasosPorDNI = async () => {  
    if (!dni) {
      alert('Ingresá un DNI para buscar.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setQueried(true);

      console.log('[Welcome] consultando API');

      const res = await fetch(`${apiUrl}/api/images/search?dni=${dni}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al buscar casos');

      const data = await res.json(); // array de fotos del DNI

      const options = { day: '2-digit', month: 'short', year: 'numeric' };
      const gruposObj = data.reduce((acc, img) => {
        const raw = img.createdAt ?? img.uploadedAt ?? null;
        let d = null;

        if (typeof raw === 'string') d = new Date(raw.replace(' ', 'T'));
        else if (raw) d = new Date(raw);

        const fecha = d && !Number.isNaN(d.getTime())
          ? d.toLocaleDateString('es-AR', options)
          : 'Sin fecha';
        const dx = img.diagnostico || 'Sin diagnóstico';
        const clave = `${fecha}__${dx}`;

        if (!acc[clave]) acc[clave] = { fecha, diagnostico: dx, items: [], ts: d ? d.getTime() : 0 };
        acc[clave].items.push(img);
        if (d && d.getTime() > acc[clave].ts) acc[clave].ts = d.getTime();
        return acc;
      }, {});

      const grupos = Object.values(gruposObj).sort((a, b) => b.ts - a.ts);
        setCasos(grupos);
      console.log('[Welcome] grupos obtenidos', grupos.length);
      setCasos(grupos);
    } catch (err) {
      console.error('[Welcome] buscarCasosPorDNI error', err);
      setError('No se pudieron buscar los casos.');
      setCasos([]);
    } finally {
      setLoading(false);
    }
  };

   
  useEffect(() => {
    if (dni.length === 8) {
      buscarCasosPorDNI();
    } else {
      setCasos([]);
      setQueried(false);
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dni]);

  // abrir el form de “nuevo caso” (con DNI ya cargado)
const openNewCaseForm = () => {
  const v = (dni || '').replace(/\D/g, '').slice(0, 8);
  if (!v || (v.length !== 7 && v.length !== 8)) {
    alert('Completá un DNI válido (7 u 8 dígitos) antes de crear un caso.');
    return;
  }
  if (v !== dni) setDni(v);
  setShowNewCaseForm(true);
};

const cancelNewCase = () => {
  setShowNewCaseForm(false);
  setNcRegion('');
  setNcDx('');
};

// crea un caso “provisorio” en UI (hasta tener backend)
const createNewCase = (e) => {
  e.preventDefault();
  const v = (dni || '').replace(/\D/g, '');
  if (v.length !== 7 && v.length !== 8) {
    alert('DNI inválido'); return;
  }
  if (!ncRegion) { alert('Elegí una región'); return; }
  if (!ncDx) { alert('Elegí un diagnóstico'); return; }

  const now = new Date();
  const fecha = now.toLocaleDateString('es-AR', { day:'2-digit', month:'short', year:'numeric' });

  const nuevo = {
    fecha,
    region: ncRegion,
    diagnostico: ncDx,
    items: [],
    ts: now.getTime(),
    local: true, // ← provisorio (no persistido)
  };

  setCasos(prev => [nuevo, ...prev]);
  setShowNewCaseForm(false);
  setNcRegion(''); setNcDx('');
};
//nuevo paciente
  const handleNuevoPaciente = () => {
    const v = (dni || '').replace(/\D/g, '');
    if (v !== dni) setDni(v);
    setShowNewForm(true);
  };
  
  // Guardar “provisorio” en UI (sin backend aún)
  const handleCreateCase = (e) => {
    e.preventDefault();
    const v = (dni || '').replace(/\D/g, '');
    if (v.length !== 7 && v.length !== 8) {
      alert('DNI inválido');
      return;
    }
    if (!newDx.trim()) {
      alert('Ingresá un diagnóstico');
      return;
    }
    const now = new Date();
    const fecha = now.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    const nuevo = {
      fecha,
      diagnostico: newDx.trim(),
      region: newRegion || undefined,    // ← opcional
      items: [],
      ts: now.getTime(),
      // guardo también nombre/apellido para futuro uso en UI
      nombre: newNombre.trim() || undefined,
      apellido: newApellido.trim() || undefined,
    };
    setCasos(prev => [nuevo, ...prev]); // aparece arriba en la lista
    setShowNewForm(false);
    setNewDx('');
    setNewNombre('');
   setNewApellido('');
  };
  
  // Cerrar sin guardar
  const handleCancelNew = () => {
    setShowNewForm(false);
    setNewDx('');
  };
  //acciones de los botones
  useEffect(() => {
    // 1) Leer query params
    const qMode   = searchParams.get('mode');        // 'foto' | 'video'
    const qAuto   = searchParams.get('autostart') === '1';
    const qDni    = searchParams.get('dni') || '';
    const qRegion = searchParams.get('region') || '';
    const qDx     = searchParams.get('dx') || '';
  
    // 2) Pre-cargar estados si vienen
    if (qDni)    setDni(qDni);
    if (qRegion) setRegion(qRegion);
    if (qDx)     setDiagnostico(qDx);
    if (qMode === 'foto' || qMode === 'video') setModo(qMode);
  
    // 3) Autostart a cámara SI y solo SI hay datos mínimos
    const ready = (qDni || dni) && (qRegion || region) && (qDx || diagnostico);
    if (qAuto && ready && !autoStartedRef.current) {
      autoStartedRef.current = true;
      (async () => {
        try {
          // si tu startCamera valida campos, ya estamos cubiertos
          await startCamera();
          // forzar cámara (saltar selectMode)
          setScreen('camera');
        } catch (e) {
          console.error('autostart camera error:', e);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const showHeroCTA = !showNewForm && !(queried && !loading);
  return (
    <div className={styles.container}>
      {/* Saludo */}
      <div className={styles.greeting}>
        <p>Hola, {user?.nombre || 'usuario'}</p>
        <h2>¿Qué hacemos hoy?</h2>
      </div>
  
      {/* DNI + Nuevo paciente */}
      <div className={styles.patientRow}>
        <input  type="text" className={styles.input}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="DNI del paciente"
                value={dni}
                onChange={(e) =>
                  setDni((e.target.value || '').replace(/\D/g, '').slice(0, 8))  }
                aria-label="DNI del paciente"
                maxLength={8}
            />
           <button className={styles.newPatientBtn} onClick={handleNuevoPaciente}>
              <UserPlus size={18} /> Nuevo paciente
           </button>
        </div>
  
      {/* Formulario inline: Nuevo paciente */}
      {showNewForm && (
        <div className={styles.newCaseBox}>
          <h4>Nuevo paciente</h4>
          <form onSubmit={handleCreateCase}>
            {/* Un solo FormularioJerarquico (dni + región + diagnóstico) */}
            <div className={styles.formRow}>
              <label className={styles.label}>DNI, Región y Diagnóstico</label>
              <div style={{ width: '100%' }}>
                <FormularioJerarquico
                  campos={['dni', 'region', 'diagnostico']}
                  valores={{ dni, region: newRegion, diagnostico: newDx }}
                  onChange={(data) => {
                    setDni(data?.dni || '');
                    setNewRegion(data?.region || '');
                    setNewDx(data?.diagnostico || '');
                  }}
                />
              </div>
            </div>
  
            {/* Nombre (opcional) */}
            <div className={styles.formRow}>
              <label className={styles.label}>Nombre</label>
              <input
                className={styles.field}
                type="text"
                value={newNombre}
                onChange={(e) => setNewNombre(e.target.value)}
                placeholder="(opcional)"
                aria-label="Nombre"
              />
            </div>
  
            {/* Apellido (opcional) */}
            <div className={styles.formRow}>
              <label className={styles.label}>Apellido</label>
              <input
                className={styles.field}
                type="text"
                value={newApellido}
                onChange={(e) => setNewApellido(e.target.value)}
                placeholder="(opcional)"
                aria-label="Apellido"
              />
            </div>
  
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handleCancelNew}
              >
                Cancelar
              </button>
              <button type="submit" className={styles.primaryBtn}>
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
  
      {/* Resultados de búsqueda */}
      {loading && <div className={styles.casosBox}>Buscando casos…</div>}
  
      {!loading && error && (
        <div className={styles.casosBoxError} role="alert">
          {error}
        </div>
      )}
  
      {!loading && !error && queried && (
        <div className={styles.casosBox}>
          {casos.length === 0 ? (
            <div className={styles.emptyNote}>
              No hay casos para este DNI. Podés crear uno con <strong>“Nuevo paciente”</strong>.
            </div>
          ) : (
            <>
             <div className={styles.casosHeader}>
               <h4>Casos previos para DNI {dni}:</h4>
                <button type="button" className={styles.secondaryBtn} onClick={openNewCaseForm}>
                 + Nuevo caso
                </button>
             </div>
             {showNewCaseForm && (
             <div className={styles.newCaseBox}>
             <form onSubmit={createNewCase}>
               <div className={styles.formRow}>
               <label className={styles.label}>DNI</label>
               <input  className={styles.field}
                type="text"
                value={dni}
                disabled
                aria-label="DNI (bloqueado)"
                />
              </div>

             <div className={styles.formRow}>
              <label className={styles.label}>Región y diagnóstico</label>
              <div style={{ width: '100%' }}>
              <FormularioJerarquico
                campos={['region','diagnostico']}
                valores={{ region: ncRegion, diagnostico: ncDx }}
                onChange={(data) => {
                setNcRegion(data?.region || '');
                setNcDx(data?.diagnostico || '');
                }}
              />
            </div>
           </div>

           <div className={styles.formActions}>
             <button type="button" className={styles.secondaryBtn} onClick={cancelNewCase}>
               Cancelar
            </button>
            <button type="submit" className={styles.primaryBtn}>
               Crear
            </button>
           </div>
         </form>
        </div>
       )}


              <div>
                {casos.map((c, i) => {
                   const regionParam =
                   c.region ||
                   (c.items?.length ? c.items[c.items.length - 1]?.region : '') ||
                   '';
                  // calcular estado (6 meses)
                  const six = new Date();
                  six.setMonth(six.getMonth() - 6);
                  const estado =
                    typeof c.ts === 'number' && c.ts >= six.getTime()
                      ? 'abierto'
                      : 'cerrado';
  
                  return (
                    <div
                      key={`${c.fecha}-${c.diagnostico}-${i}`}
                      className={styles.caseRow}
                    >
                      <div className={styles.caseInfo}>
                        <strong>{c.fecha}</strong> — Dx: {c.diagnostico} (
                        {c.items.length})
                        <span
                          className={`${styles.badge} ${
                            estado === 'abierto'
                              ? styles.badgeOpen
                              : styles.badgeClosed
                          }`}
                        >
                          {estado}
                        </span>
                      </div>
                      <div className={styles.caseActions}>
  <SplitButton
    label="Continuar caso"
    classNameBtn={styles.smallBtn}
    items={[
      {
        label: 'Tomar Foto',
        onClick: () => {
          const qs = new URLSearchParams({
            dni,
            dx: c.diagnostico,
            fecha: c.fecha,
            mode: 'foto',
            autostart: '1',
            ...(regionParam ? { region: regionParam } : {}),
          }).toString();
          navigate(`/welcome/take-photo?${qs}`);
        },
      },
      {
        label: 'Grabar',
        onClick: () =>
          navigate(
            `/welcome/take-photo?dni=${encodeURIComponent(dni)}&dx=${encodeURIComponent(c.diagnostico)}&fecha=${encodeURIComponent(c.fecha)}&mode=video`
          ),
      },
      {
        label: 'Importar',
        onClick: () =>
          navigate(
            `/welcome/import-photo?dni=${encodeURIComponent(dni)}&dx=${encodeURIComponent(c.diagnostico)}&fecha=${encodeURIComponent(c.fecha)}`
          ),
      },
      {
        label: 'Ver',
        onClick: () =>
          navigate(
            `/welcome/recover-photo?dni=${encodeURIComponent(dni)}&fecha=${encodeURIComponent(c.fecha)}&dx=${encodeURIComponent(c.diagnostico)}`
          ),
      },
    ]}
  />
</div>
                     
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
  
      {/* Tarjetas de acción */}
      <div
       className={`${styles.actionsGrid} ${showHeroCTA ? styles.actionsHero : styles.actionsCompact}`}
        role="navigation"
        >
        {actions.map((a) => (
          <button
            key={a.path}
            className={styles.actionCard}
            onClick={() => navigate(a.path)}
            aria-label={a.label}
          >
            <span className={styles.icon}>{a.icon}</span>
            <span className={styles.actionLabel}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
  
 
  
  
};

export default Welcome;
