import React, { useEffect, useRef,useLayoutEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import piexif from "piexifjs";
import { ArrowLeft, Columns } from "lucide-react";
import FormularioJerarquico from "./FormularioJerarquico";
import styles from '../styles/TakePhoto.module.css';
import "sweetalert2/dist/sweetalert2.min.css";
import { useSearchParams } from 'react-router-dom';

const TakePhoto = () => {
  const navigate = useNavigate();
 
  const [dni, setDni] = useState("");
  const [region, setRegion] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [photoData, setPhotoData] = useState(null);
  const [modo, setModo] = useState("foto");  
  const [fase, setFase] = useState("");
  const [casosDelDni, setCasosDelDni] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL;
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videosAcumulados, setVideosAcumulados] = useState([]);
  const [grabacionFinalizada, setGrabacionFinalizada] = useState(false);
  const [fotosAcumuladas, setFotosAcumuladas] = useState([]);
  const token = localStorage.getItem("token");
   const mediaRecorderRef = useRef(null);
   const recordedChunksRef = useRef([]);
   const formularioRef = useRef(null);
   const [searchParams] = useSearchParams();
   const autoStartedRef = useRef(false);
   const skipPrefetchRef = useRef(false);
   const [screen, setScreen] = useState(() => {
      try {
        return new URLSearchParams(window.location.search).get('autostart') === '1'
          ? 'loading' : 'form';
       } catch {
        return 'form';
       }
     });
     
   useEffect(() => {
     if (searchParams.get('autostart') === '1') {
      skipPrefetchRef.current = true;
     }
  }, [searchParams]);
  
 const previewItems = React.useMemo(
  () => [
    ...fotosAcumuladas.map((src) => ({ type: "photo", src })),
    ...videosAcumulados.map((src) => ({ type: "video", src })),
  ],
  [fotosAcumuladas, videosAcumulados]
 );
 const removePreviewItem = (idx) => {
  const total = fotosAcumuladas.length + videosAcumulados.length;

  if (idx < fotosAcumuladas.length) {
    // eliminar foto
    setFotosAcumuladas((prev) => prev.filter((_, i) => i !== idx));
  } else {
    // eliminar video
    const vIdx = idx - fotosAcumuladas.length;
    setVideosAcumulados((prev) => prev.filter((_, i) => i !== vIdx));
  }

  // si no queda nada, volvemos a la cámara
  if (total - 1 === 0) {
    setPhotoData(null);
    setScreen("camera");
  }
};
 
useEffect(() => {
  
  const qMode   = searchParams.get('mode');            // 'foto' | 'video'
  const qAuto   = searchParams.get('autostart') === '1';
  const qDni    = searchParams.get('dni')    || '';
  const qRegion = searchParams.get('region') || '';
  const qDx     = searchParams.get('dx')     || '';

  // precargar estados visibles en el
  if (qDni)    setDni(qDni);
  if (qRegion) setRegion(qRegion);
  if (qDx)     setDiagnostico(qDx);
  if (qMode === 'foto' || qMode === 'video') setModo(qMode);

  // si vienen los 3 y se pidió autostart, abrir cámara directo (una sola vez)
  const ready = qDni && qRegion && qDx;
  if (qAuto && ready && !autoStartedRef.current) {
    autoStartedRef.current = true;
    setScreen('loading');
    startCamera({
      dniVal: qDni,
      regionVal: qRegion,
      diagnosticoVal: qDx,
      modeVal: qMode,
    });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [searchParams]);

    useEffect(
      () => () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
     }, [] );

    useEffect(() => {
      if (screen === "camera") {
        const video = videoRef.current;
        const stream = streamRef.current;
  
        if (video && stream) {
          video.srcObject = stream;
          video.play().catch((err) => {
            console.error("No se pudo iniciar el video:", err);
            alert("Error al iniciar cámara");
          });
        }
      }
    }, [screen]);  

    useEffect(() => {
      // ⬇️ NUEVO: si venís de autostart, no dispares la búsqueda ahora
      if (skipPrefetchRef.current) {
        skipPrefetchRef.current = false;
        return;
      }
    
      if (dni.length === 8) {
        buscarCasosPorDNI();
      } else {
        setCasosDelDni([]);
      }
    }, [dni]); // ← tus deps originales
    
     const startCamera = async ({ dniVal, regionVal, diagnosticoVal, modeVal } = {}) => {
      const d  = dniVal ?? dni;
      const r  = regionVal ?? region;
      const dx = diagnosticoVal ?? diagnostico;
    
      if (!d || !r || !dx) {
        alert("Completa el formulario por favor.");
        return;
      }
    
      try {
        // setear modo si viene por URL
        if (modeVal === 'foto' || modeVal === 'video') setModo(modeVal);
    
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
    
        // ir DIRECTO a cámara (no pasar por selectMode)
        setScreen("camera");
      } catch (error) {
        console.error("Error al acceder a la cámara:", error);
        alert("Error al acceder a la cámara: " + error.message);
      }
    };
    

   const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
  
    if (!video || !canvas || !video.videoWidth) {
      alert("La cámara aún no está lista");
      return;
    }
  
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL("image/jpeg", 0.92);
  
    setPhotoData(dataURL);
    setFotosAcumuladas(prev => [...prev, dataURL]);      // Solo previsualiza
    setScreen("photo");
  };
  
  const buscarCasosPorDNI = async () => {
    if (!dni) {
      alert("Ingresá un DNI para buscar.");
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/api/images/search?dni=${dni}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (!res.ok) throw new Error("Error al buscar casos");
      const data = await res.json(); // array de fotos del DNI
  
      const options = { day: "2-digit", month: "short", year: "numeric" };
  
      // Agrupar por fecha (crea un timestamp 'ts' para ordenar)
      const gruposObj = data.reduce((acc, img) => {
        const raw = img.createdAt ?? img.uploadedAt ?? null;
        let d = null;
  
        if (typeof raw === "string") {
          // MySQL: "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
          d = new Date(raw.replace(" ", "T"));
        } else if (raw) {
          d = new Date(raw);
        }
  
        const fecha=  d && !Number.isNaN(d.getTime())
            ? d.toLocaleDateString("es-AR", options)
            : "Sin fecha";
       const dx = img.diagnostico || "Sin diagnóstico";
       const clave = `${fecha}__${dx}`;
  
       if (!acc[clave]) acc[clave] = { fecha, diagnostico: dx, items: [], ts: d ? d.getTime() : 0 };
        acc[clave].items.push(img);
  
        // si varias fotos comparten la misma 'clave', dejamos el ts más reciente
        if (d && d.getTime() > acc[clave].ts) acc[clave].ts = d.getTime();
  
        return acc;
      }, {});
  
      // A array y ORDEN DESC por ts, luego quitamos ts
      const grupos = Object.values(gruposObj)
      .sort((a, b) => b.ts - a.ts)
      .map(({ fecha, diagnostico, items }) => ({ fecha, diagnostico, items }));
 
      setCasosDelDni(grupos);
    } catch (err) {
      console.error(err);
      alert("No se pudieron buscar los casos.");
    }
  };
  
  const startRecording = () => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm;codecs=vp9",
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      console.log("🎬 chunks:", recordedChunksRef.current.length, "url:", url);
      setVideosAcumulados((prev) => [...prev, url]);
      setGrabacionFinalizada(true);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    console.log("🟥 stopRecording fue llamado");
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  useEffect(() => {
    if (grabacionFinalizada) {
      setScreen("photo");
      setGrabacionFinalizada(false); 
    }
  }, [grabacionFinalizada]);
   
  const guardarCaso = async () => {
    const nFotos = fotosAcumuladas.length;
    const nVideos = videosAcumulados.length;
    if (nFotos + nVideos === 0) {
      alert("No hay nada para guardar");
      return;
    }
    if (!dni || !region || !diagnostico) {
      alert("Completá DNI, región y diagnóstico antes de guardar.");
      return;
    }
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("dni", dni);
      formData.append("region", region);
      formData.append("diagnostico", diagnostico);
      formData.append("fase", fase);
      await Promise.all([
        ...fotosAcumuladas.map(async (foto, i) => {
          const blob = await fetch(foto).then(r => r.blob());
          formData.append("images", blob, `photo${i}.jpg`);
        }),
        ...videosAcumulados.map(async (url, j) => {
          const blob = await fetch(url).then(r => r.blob());
          formData.append("images", blob, `video${j}.webm`);
        }),
      ]);
     
      const res = await fetch(`${apiUrl}/api/images/cases/take-photo-or-import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Error al guardar el caso");
      }
  
      const { default: Swal } = await import("sweetalert2");
      const n = fotosAcumuladas.length;
  
      const { isDenied } = await Swal.fire({
        icon: "success",
        title: n === 1 ? "¡Imagen guardada!" : "¡Imágenes guardadas!",
        text:
          n === 1
            ? "¿Querés cerrar el caso o seguir trabajando?"
            : `Se guardaron ${n} imágenes. ¿Querés cerrar el caso o seguir trabajando?`,
        confirmButtonText: "Seguir en este caso",
        showDenyButton: true,
        denyButtonText: "Cerrar caso",
        allowOutsideClick: false,
      });
  
      // opcional: limpiar previsualización para no re-subir lo mismo
      setFotosAcumuladas([]);
      setVideosAcumulados([]);
      setPhotoData(null);
  
      if (isDenied) {
        // cerrar caso → limpiar campos
        setDni("");
        setRegion("");
        setDiagnostico("");
        setFase("");
        setCasosDelDni([]);
      }
  
      setScreen("form");
      return;
    } catch (err) {
      const { default: Swal } = await import("sweetalert2");
      await Swal.fire({
        icon: "error",
        title: "No se pudo guardar el caso",
        text: String(err.message || err),
      });
    } finally {
      setIsSaving(false);
    }
  };
  
    return (
      <>
        {screen === "loading" && (
        <div className={styles.cameraContainer} style={{display:'grid',placeItems:'center',minHeight:'60vh'}}>
         <p>Iniciando cámara…</p>
       </div>
        )}

        
        {/* FORMULARIO PRINCIPAL */}
        {screen === "form" && (
          <>
            <div id="formulario" ref={formularioRef} className={styles.formularioContainer}>
              <FormularioJerarquico
                campos={["dni", "region", "diagnostico", "fase"]}
                valores={{ dni, region, diagnostico, fase }}
                onChange={(data) => {
                  setDni(data.dni || "");
                  setRegion(data.region || "");
                  setDiagnostico(data.diagnostico || "");
                  setFase(data.fase || "");
                }}
              />
    
              <div className={styles.botonesCentrados}>
                <button className={styles.ContinuarButton} onClick={startCamera}>
                  Continuar
                </button>
                <button className={styles.camerabackbutton} onClick={() => navigate(-1)}>
                  <ArrowLeft size={20} /> Volver
                </button>
              </div>
            </div>
    
            {/* LISTA DE CASOS */}
            {dni && (
              <div className={styles.casosContainer}>
                {casosDelDni.length > 0 ? (
                  <>
                    <h4>Casos previos para DNI {dni}:</h4>
                    <div className={styles.listaCasos}>
                      {casosDelDni.map((grupo, idx) => (
                        <button
                          key={idx}
                          className={styles.casoButton}
                          onClick={() => {
                            const ultimo = grupo.items[grupo.items.length - 1];
                            setRegion(ultimo.region || "");
                            setDiagnostico(ultimo.diagnostico || "");
                            setFase(ultimo.fase || "");
                            formularioRef.current?.scrollIntoView({ behavior: "smooth" });
                          }}
                        >
                          📁 {grupo.fecha} — Dx: {grupo.diagnostico} ({grupo.items.length})
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className={styles.sinCasos}>No hay datos del paciente con DNI {dni}</p>
                )}
              </div>
            )}
          </>
        )}
    
        {/* CÁMARA */}
        {screen === "camera" && (
          <div className={styles.cameraContainer}>
            <div className={styles.modeToggle}>
              <button
                className={`${styles.modeBtn} ${modo === "foto" ? styles.active : ""}`}
                onClick={() => {
                  if (isRecording) stopRecording();
                  setModo("foto");
                }}
              >
                Foto
              </button>
              <button
                className={`${styles.modeBtn} ${modo === "video" ? styles.active : ""}`}
                onClick={() => setModo("video")}
              >
                Video
              </button>
            </div>
    
            <video className={styles.video} ref={videoRef} autoPlay playsInline muted />
    
            <div className={styles.cameraOverlay}>
              {modo === "foto" && (
                <button className={styles.takePhotoButton} onClick={takePhoto}>
                  Tomar foto
                </button>
              )}
    
              {modo === "video" && (
                <div
                  className={`${styles.recordButtonWrapper} ${
                    isRecording ? styles.recording : ""
                  }`}
                  onClick={() => (isRecording ? stopRecording() : startRecording())}
                  title={isRecording ? "Detener grabación" : "Iniciar grabación"}
                >
                  <div className={styles.recordButtonInner}></div>
                </div>
              )}
            </div>
    
            <button
              id="camera-back-button"
              className={styles.cameraBackBtn}
              onClick={() => setScreen("form")}
            >
              <ArrowLeft size={30} />
            </button>
          </div>
        )}
    
        {/* PREVISUALIZACIÓN */}
        {screen === "photo" && (
          <div className={styles.previewWrapper}>
            <h3 className={styles.previewTitle}>Pre-visualización</h3>
    
            <div className={styles.previewStrip}>
              {previewItems.map((item, index) => (
                <div key={index} className={styles.previewItem}>
                  {item.type === "photo" ? (
                    <img src={item.src} alt={`media ${index}`} className={styles.previewImg} />
                  ) : (
                    <video src={item.src} controls className={styles.previewVideo}
                    onLoadedData={(e) => {
                      e.currentTarget.currentTime = 0;
                    }} />
                  )}
    
                  <button
                    onClick={() => removePreviewItem(index)}
                    title="Eliminar este elemento"
                    className={styles.deleteBtn}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
    
            <div className={styles.previewControls}>
              <button onClick={() => setScreen("camera")}>➕ Agregar más</button>
              <button onClick={guardarCaso} disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar todas"}
              </button>
              <button
                onClick={() => {
                  streamRef.current?.getTracks().forEach((t) => t.stop());
                  setFotosAcumuladas([]);
                  setPhotoData(null);
                  setScreen("form");
                }}
              >
                Finalizar caso
              </button>
            </div>
          </div>
        )}
    
        {/* CANVAS OCULTO */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </>
    );
    
  
};

export default TakePhoto;
