import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "../styles/Bienvenida.module.css";
import { Camera, FolderOpen, Tags, Upload, UserPlus } from "lucide-react";
import FormularioJerarquico from "./FormularioJerarquico";
import SplitButton from "./SplitButton";
import { useSearchParams } from "react-router-dom";
import "sweetalert2/dist/sweetalert2.min.css";
import CaseGallery from "./CaseGallery"
/* Helpers (asegurate de tenerlos definidos) */

const actions = [
  {
    label: "Tomar foto",
    path: "/welcome/take-photo",
    icon: <Camera size={24} />,
  },
  {
    label: "Clasificar fotos",
    path: "/welcome/import-photo",
    icon: <Upload size={24} />,
  },
  {
    label: "Archivo por patologia",
    path: "/welcome/recover-photo",
    icon: <FolderOpen size={24} />,
  },
  {
    label: "Completar etiquetas",
    path: "/welcome/complete-image-labels",
    icon: <Tags size={24} />,
  },
];

const Welcome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;
  const [dni, setDni] = useState("");
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [casos, setCasos] = useState([]); // [{fecha, diagnostico, items: [...]}, ...]
  const [queried, setQueried] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newDx, setNewDx] = useState("");
  const [newNombre, setNewNombre] = useState("");
  const [newApellido, setNewApellido] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [showNewCaseForm, setShowNewCaseForm] = useState(false);
  const [ncRegion, setNcRegion] = useState("");
  const [ncDx, setNcDx] = useState("");
  const [searchParams] = useSearchParams();
  const autoStartedRef = useRef(false);
  const [creating, setCreating] = useState(false);
  const [latestCreatedCaseId, setLatestCreatedCaseId] = useState(null);
  const[galleryOpen,setGalleryOpen]=useState(false);
  const[galleryCaseId,setGalleryCaseId]=useState(null);
  const[galleryTitle,setGalleryTitle]=useState('');
  const [showCasesList, setShowCasesList] = useState(true);

  const buscarCasosPorDNI = async () => {
    if (!dni) {
      alert("Ingresá un DNI para buscar.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setQueried(true);
  
      console.log("[Welcome] consultando API");
  
      const res = await fetch(`${apiUrl}/api/images/search?dni=${dni}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al buscar casos");
  
      const data = await res.json(); // 
  
      const options = { day: "2-digit", month: "short", year: "numeric" };
  
      // transformamos cada "Case" en la estructura que vos ya usabas
      const grupos = data.map((caso) => {
        const d = caso.createdAt ? new Date(caso.createdAt) : null;
  
        return {
          id: caso.id,  // 👈 id REAL del caso
          fecha: d
            ? d.toLocaleDateString("es-AR", options)
            : "Sin fecha",
          diagnostico: caso.diagnostico || "Sin diagnóstico",
          region: caso.region || null,
          items: caso.images || [],   // 👈 las imágenes vienen incluidas
          ts: d ? d.getTime() : 0,
        };
      });
  
      // ordenamos por fecha descendente (como antes)
      grupos.sort((a, b) => b.ts - a.ts);
  
      setCasos(grupos);
      console.log("[Welcome] grupos obtenidos", grupos.length, grupos);
    } catch (err) {
      console.error("[Welcome] buscarCasosPorDNI error", err);
      setError("No se pudieron buscar los casos.");
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
      setError("");
    }
  }, [dni]);

  // abrir el form de “nuevo caso” (con DNI ya cargado)
  const openNewCaseForm = () => {
    const v = (dni || "").replace(/\D/g, "").slice(0, 8);
    if (!v || (v.length !== 7 && v.length !== 8)) {
      alert("Completá un DNI válido (7 u 8 dígitos) antes de crear un caso.");
      return;
    }
    if (v !== dni) setDni(v);
    setShowNewCaseForm(true);
  };

  const cancelNewCase = () => {
    setShowNewCaseForm(false);
    setNcRegion("");
    setNcDx("");
  };

  // crea un caso “provisorio” en UI (hasta tener backend)
  const createNewCase = async (e) => {
    e.preventDefault();
    if (creating) return;
  
    const v = (dni || "").replace(/\D/g, "");
    if (v.length !== 7 && v.length !== 8) {
      alert("DNI inválido");
      return;
    }
    if (!ncRegion) { alert("Elegí una región"); return; }
    if (!ncDx) { alert("Elegí un diagnóstico"); return; }
  
    try {
      console.log("🚀 Entrando a createNewCase");
      setCreating(true);
  
      const res = await fetch(`${apiUrl}/api/images/cases/create-empty`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          dni: v,
          region: ncRegion,
          diagnostico: ncDx
        })
      });
  
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "No se pudo crear el caso");
      }
  
      const data = await res.json();
      const c = data.case;
  
      const fecha = new Date(c.createdAt).toLocaleDateString("es-AR", {
        day: "2-digit", month: "short", year: "numeric",
      });
  
      const nuevo = {
        id: c.id,
        fecha,
        region: c.region,
        diagnostico: c.diagnostico,
        items: [],
        ts: new Date(c.createdAt).getTime(),
        local: false
      };
  
      setCasos((prev) => [nuevo, ...prev]);
      setShowNewCaseForm(false);
      setNcRegion("");
      setNcDx("");
      setLatestCreatedCaseId(String(c.id));
      setTimeout(() => setLatestCreatedCaseId(null), 5000);
      
       const { default: Swal } = await import("sweetalert2");
       await Swal.fire({
       icon: "success",
       title: "¡Caso creado con éxito!",
        html: `<div style="text-align:left">
           <b>DNI:</b> ${v}<br/>
           <b>Región:</b> ${ncRegion}<br/>
           <b>Diagnóstico:</b> ${ncDx}
         </div>`,
      confirmButtonText: "Continuar caso",
      background: "#ffffff",        
      color: "#114c5f",             
      iconColor: "#00d6c6",         
      confirmButtonColor: "#00d6c6",
     });
     
     console.log("✅ latestCreatedCaseId seteado en:", c.id);
// (opcional) scrolleo a la fila recién creada
     requestAnimationFrame(() => {
       document.getElementById(`case-row-${c.id}`)?.scrollIntoView({
        behavior: "smooth",
       block: "center",
     });
  // (foco lo vemos en el siguiente paso)
   });
 
    } catch (err) {
      console.error("createNewCase error:", err);
      alert(String(err.message || err));
    } finally {
      setCreating(false);
    }
  };
  const openGalleryByCase = (caseId, diagnostico, fecha) => {
    setGalleryCaseId(caseId);
    setGalleryTitle(`Caso ${caseId} — ${fecha} — ${diagnostico}`);
    setGalleryOpen(true);
  };
  
  const handleCreateCase = async (e) => {
    e.preventDefault();
  
    // Validación del DNI
    const v = (dni || "").replace(/\D/g, "");
    if (v.length !== 7 && v.length !== 8) {
      alert("DNI inválido");
      return;
    }
    
    // Validación del diagnóstico
    if (!newDx.trim()) {
      alert("Ingresá un diagnóstico");
      return;
    }
  
    // Validación de nombre y apellido (requeridos para nuevo paciente)
    if (!newNombre.trim() || !newApellido.trim()) {
      alert("Para crear un nuevo caso, se requieren nombre y apellido del paciente");
      return;
    }
  
    try {
      // Crear FormData para enviar tanto datos como imágenes
      const formData = new FormData();
      
      // Agregar campos al FormData
      formData.append('dni', v);
      formData.append('diagnostico', newDx.trim());
      formData.append('nombre', newNombre.trim());
      formData.append('apellido', newApellido.trim());
      
      // Campos opcionales
      if (newRegion) formData.append('region', newRegion);
  
      // Enviar datos al backend
      const response = await fetch(`${apiUrl}/api/images/cases`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el caso');
      }
  
      const caseData = await response.json();
      
      // Actualizar el estado local con el nuevo caso
      const now = new Date();
      const fecha = now.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      
      const nuevo = {
        id: caseData.id, // ID generado por el backend
        fecha,
        diagnostico: caseData.diagnostico,
        region: caseData.region || undefined,
        items: caseData.images || [],
        ts: now.getTime(),
        nombre: caseData.patient?.nombre || newNombre.trim(),
        apellido: caseData.patient?.apellido || newApellido.trim(),
        patientCreated: caseData.patientCreated // Para saber si se creó un nuevo paciente
      };
  
      setCasos((prev) => [nuevo, ...prev]);
      setShowNewForm(false);
      setNewDx("");
      setNewNombre("");
      setNewApellido("");
  
      // Mostrar mensaje de éxito
      alert("Caso creado exitosamente");
  
    } catch (err) {
      console.error('Error al crear caso:', err);
      alert(err.message || 'Error al crear el caso');
    }
  };

  // Cerrar sin guardar
  const handleCancelNew = () => {
    setShowNewForm(false);
    setNewDx("");
  };
  //acciones de los botones
  useEffect(() => {
    // 1) Leer query params
    const qMode = searchParams.get("mode"); // 'foto' | 'video'
    const qAuto = searchParams.get("autostart") === "1";
    const qDni = searchParams.get("dni") || "";
    const qRegion = searchParams.get("region") || "";
    const qDx = searchParams.get("dx") || "";

    // 2) Pre-cargar estados si vienen
    if (qDni) setDni(qDni);
    if (qRegion) setNcRegion(qRegion);
    if (qDx) setNcDx(qDx);
    if (qMode === "foto" || qMode === "video") setModo(qMode);

    // 3) Autostart a cámara SI y solo SI hay datos mínimos
    const ready = (qDni || dni) && (qRegion || region) && (qDx || diagnostico);
    if (qAuto && ready && !autoStartedRef.current) {
      autoStartedRef.current = true;
      (async () => {
        try {
          // si tu startCamera valida campos, ya estamos cubiertos
          await startCamera();
          // forzar cámara (saltar selectMode)
          setScreen("camera");
        } catch (e) {
          console.error("autostart camera error:", e);
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
        <p>Hola, {user?.nombre || "usuario"}</p>
        <h2>¿Qué hacemos hoy?</h2>
        <hr/>
        <h6>Busca tu caso por DNI</h6>
      </div>

      {/* DNI + Nuevo paciente */}
      <div className={styles.patientRow}>
        <input
          type="text"
          className={styles.input}
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="DNI del paciente"
          value={dni}
          onChange={(e) =>
            setDni((e.target.value || "").replace(/\D/g, "").slice(0, 8))
          }
          aria-label="DNI del paciente"
          maxLength={8}
        />
        {dni && (
       <button type="button"
          className={styles.clearBtn}
          onClick={() => {
           setDni("");
           setCasos([]);
           setQueried(false);
          }}
       >
        ✕
       </button>
        )}
      </div>

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
            <>
            <div className={styles.emptyNote}>
              No hay casos para este DNI. Podés crear uno con desde este formulario
            </div>
            <div className={styles.newCaseBox}>
          <h4>Nuevo paciente</h4>
          <form onSubmit={handleCreateCase}>
            {/* Un solo FormularioJerarquico (dni + región + diagnóstico) */}
            <div className={styles.formRow}>
              <label className={styles.label}>DNI, Región y Diagnóstico</label>
               <div style={{ width: "100%" }}>
                 <FormularioJerarquico
                  campos={["dni", "region", "diagnostico"]}
                  valores={{ dni, region: newRegion, diagnostico: newDx }}
                  onChange={(data) => {
                    setDni(data?.dni || "");
                    setNewRegion(data?.region || "");
                    setNewDx(data?.diagnostico || "");
                   }}
                 />
               </div>
            </div>
             {/* Nombre */}
             <div className={styles.formRow}>
              <label className={styles.label}>Nombre</label>
              <input
                className={styles.field}
                type="text"
                value={newNombre}
                onChange={(e) => setNewNombre(e.target.value)}
                aria-label="Nombre"
              />
            </div>
            {/* Apellido */}
            <div className={styles.formRow}>
              <label className={styles.label}>Apellido</label>
              <input
                className={styles.field}
                type="text"
                value={newApellido}
                onChange={(e) => setNewApellido(e.target.value)}
                aria-label="Apellido"
              />
            </div>

            <div className={styles.formActions}>
              {/* Si querés, podés ocultar 'Cancelar' acá para que siempre quede el form visible */}
              <button
                type="submit"
                className={styles.primaryBtn}
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      </>
          ) : (
            <>
              <div className={styles.casosHeader}>
                <h4>Casos previos para DNI {dni}:</h4>
                
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={openNewCaseForm}
                >
                Crear un nuevo caso para este paciente
                </button>
                <button
                 type="button"
                 className={styles.toggleBtn}
                 onClick={() => setShowCasesList(!showCasesList)}
                 >
                {showCasesList ? "▲" : "▼"}
               </button>
              </div>
              {showNewCaseForm && (
                <div className={styles.newCaseBox}>
                  <form onSubmit={createNewCase}>
                    <div className={styles.formRow}>
                      <label className={styles.label}>DNI</label>
                      <input
                        className={styles.field}
                        type="text"
                        value={dni}
                        disabled
                        aria-label="DNI (bloqueado)"
                      />
                    </div>

                    <div className={styles.formRow}>
                      <label className={styles.label}>
                        Región y diagnóstico
                      </label>
                      <div style={{ width: "100%" }}>
                        <FormularioJerarquico
                          campos={["region", "diagnostico"]}
                          valores={{ region: ncRegion, diagnostico: ncDx }}
                          onChange={(data) => {
                            setNcRegion(data?.region || "");
                            setNcDx(data?.diagnostico || "");
                          }}
                        />
                      </div>
                    </div>

                    <div className={styles.formActions}>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={cancelNewCase}
                      >
                        Cancelar
                      </button>
                      <button type="submit" className={styles.primaryBtn}>
                        Crear
                      </button>
                    </div>
                  </form>
                </div>
              )}
              {showCasesList && (
              <div>
                {casos.map((c, i) => {
                  const regionParam =
                    c.region ||
                    (c.items?.length
                      ? c.items[c.items.length - 1]?.region
                      : "") ||
                    "";
                  // calcular estado (6 meses)
                  const six = new Date();
                  six.setMonth(six.getMonth() - 6);
                  const estado =
                    typeof c.ts === "number" && c.ts >= six.getTime()
                      ? "abierto"
                      : "cerrado";
                      console.log("🔎 caso en map:", c);
                  return (
                    <div
                      key={c.id}
                      className={styles.caseRow}
                    >
                      
                      <div className={styles.caseInfo}>
                        <strong>{c.fecha}</strong> — Dx: {c.diagnostico} (
                        {c.items.length})
                        <span
                          className={`${styles.badge} ${
                            estado === "abierto"
                              ? styles.badgeOpen
                              : styles.badgeClosed
                          }`}
                        >
                          {estado}
                        </span>
                      </div>
                      <div className={styles.caseActions}>
                        <SplitButton
                          id={`continuar-${c.id}`}
                          label="Continuar caso"
                          classNameBtn={`${styles.smallBtn} ${
                            String(latestCreatedCaseId) === String(c.id)
                              ? styles.continuarBtnHighlight
                              : ""
                          }`}

                          items={[
                            {
                              label: "Capturar foto o video",
                              onClick: () => {
                                const qs = new URLSearchParams({
                                  dni,
                                  dx: c.diagnostico,
                                  fecha: c.fecha,
                                  mode: "foto",
                                  autostart: "1",
                                  ...(regionParam
                                    ? { region: regionParam }
                                    : {}),
                                }).toString();
                                navigate(`/welcome/take-photo?${qs}`);
                              },
                            },
                            
                            {
                              label: "Importar",
                              onClick: () => navigate(`/welcome/import/${c.id}`),
                            },
                            {
                              label: "Ver",
                              onClick: () => openGalleryByCase(c.id, c.diagnostico, c.fecha),
                              
                            },
                          ]}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tarjetas de acción */}
      <div
        className={`${styles.actionsGrid} ${
          showHeroCTA ? styles.actionsHero : styles.actionsCompact
        }`}
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
      <CaseGallery
  open={galleryOpen}
  caseId={galleryCaseId}
  title={galleryTitle}
  onClose={() => setGalleryOpen(false)}
/>
    </div>
  );
};

export default Welcome;
