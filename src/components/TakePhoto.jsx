import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import piexif from "piexifjs";
import { ArrowLeft, Columns } from "lucide-react";
import FormularioJerarquico from "./FormularioJerarquico";
import styles from '../styles/TakePhoto.module.css';
import "sweetalert2/dist/sweetalert2.min.css";

const TakePhoto = () => {
  const navigate = useNavigate();
  const [screen, setScreen] = useState("form");
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
      if (dni.length === 8) {
        buscarCasosPorDNI();
      } else {
        setCasosDelDni([]);
      }
     }, [dni]);
    
   const startCamera = async () => {
     if (!dni ||!region|| !diagnostico ) {
      alert("Completa el formulario por favor.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setScreen("selectMode");
    } catch (error) {
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
  
  const savePhoto = async () => {
    if (!photoData) return;
    try {
      const exifObj = {
        "0th": {
          [piexif.ImageIFD.Make]: "MedPhotoReact",
          [piexif.ImageIFD.ImageDescription]: `DNI: ${dni} - Región: ${region} - Dx: ${diagnostico}`,
        },
        Exif: {
          [piexif.ExifIFD.DateTimeOriginal]: new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/-/g, ":")
            .replace("T", " "),
        },
      };
      const exifBytes = piexif.dump(exifObj);
      const newDataURL = piexif.insert(exifBytes, photoData);
  
      const res = await fetch(newDataURL);
      const blob = await res.blob();
  
      const formData = new FormData();
      formData.append("image", blob, "photo.jpg");
      formData.append("region", region);
      formData.append("diagnostico", diagnostico);
      formData.append("optionalDNI", dni);
      formData.append("uploadedBy", "60f71889c9d1f814c8a3b123");
  
      const uploadRes = await fetch(`${apiUrl}/api/images/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });
  
      if (!uploadRes.ok) {
        const error = await uploadRes.json();
        console.error("❌ Error al subir:", error);
        alert("Error al subir la imagen");
        return;
      }
  
      const imageData = await uploadRes.json();
      console.log("✅ Imagen subida:", imageData);
      alert("Foto guardada con éxito");
  
      setPhotoData(null);
      setScreen("camera");  
    } catch (error) {
      console.error(error);
      alert("No se pudo subir la imagen: " + error.message);
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
      console.log("🎬 onstop ejecutado");
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
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
      setScreen("videoPreview");
      setGrabacionFinalizada(false); // reseteamos para la próxima
    }
  }, [grabacionFinalizada]);
   
  const saveVideo = async () => {
    if (videosAcumulados.length === 0) {
      alert("No hay videos para guardar");
      return;}

      setIsSaving(true);
    try {
      for (const url of videosAcumulados) {
        // descargamos el blob del video
        const res = await fetch(url);
        const blob = await res.blob();
      const formData = new FormData();
      formData.append("images", blob, "video.webm");
      formData.append("region", region);
      
      formData.append("diagnostico", diagnostico);
      
      formData.append("optionalDNI", dni);
      // formData.append("uploadedBy", "60f71889c9d1f814c8a3b123");
  
      const uploadRes = await fetch(`${apiUrl}/api/images/cases/take-photo-or-import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });
  
      if (!uploadRes.ok) {
        const error = await uploadRes.json();
        console.error("❌ Error al subir video:", error);
        alert("Error al subir el video");
        }
      }
      alert("✅ Todos los videos fueron subidos con éxito");
      setVideosAcumulados([]);    // limpiamos el carrusel
      setScreen("form");    
      
    } catch (error) {
      console.error("Error en saveVideo:", error);
      alert("No se pudo subir el video: " + error.message);
    }finally {
      setIsSaving(false);}
  };

  const guardarCaso = async () => {
    if (fotosAcumuladas.length === 0) return;
  
    // 1) Construís un FormData único
    const formData = new FormData();
    formData.append("dni", dni);
    formData.append("region", region);
    formData.append("diagnostico", diagnostico);
    formData.append("fase", fase);
  
    // 2) Agregás cada blob con el mismo campo 'images'
    await Promise.all(
      fotosAcumuladas.map(async (foto, idx) => {
        const blob = await fetch(foto).then((r) => r.blob());
        formData.append("images", blob, `photo${idx}.jpg`);
      })
    );
  
    // 3) Enviás TODO en un solo POST a un endpoint 'casos'
    const res = await fetch(`${apiUrl}/api/images/cases/take-photo-or-import`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    
    await (await import("sweetalert2")).default.fire({
      icon: "success",
      title: fotosAcumuladas.length === 1 ? "¡Imagen guardada!" : "¡Imágenes guardadas!",
  text: fotosAcumuladas.length === 1
    ? "La imagen se guardó con éxito."
    : `Se guardaron ${fotosAcumuladas.length} imágenes con éxito.`,
      
      confirmButtonText: "Seguir en este caso",
     showDenyButton: true,
     denyButtonText: "Cerrar caso",
    allowOutsideClick: false,
    });
    
  
    // 4) Limpiás estado y volvés al formulario
    setFotosAcumuladas([]);
    setPhotoData("null");
    if (isDenied) {
      // CERRAR CASO: limpiar para iniciar uno nuevo
      setDni("");
      setRegion("");
      setDiagnostico("");
      setFase("");
      setCasosDelDni([]);
      setScreen("form");
    } else if (isConfirmed) {
      // SEGUIR EN ESTE CASO: volver al form con los datos cargados
      setScreen("form");
    }
  };
  
  
  return (
    <>
      {/* FORMULARIO PRINCIPAL */}
      {screen === "form" && (
  <>
    {/* FORMULARIO PRINCIPAL */}
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

        {/* LISTA DE CASOS (SCROLLABLE) */}
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
          <p className={styles.sinCasos}>
            No hay datos del paciente con DNI {dni}
          </p>
        )}
      </div>
    )}
  </>
)}

  
      {/* SELECCIÓN DE MODO */}
      {screen === "selectMode" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#000",
            color: "#fff",
            gap: "20px",
          }}
        >
          <h2>¿Qué querés hacer?</h2>
          <button
            onClick={() => {
              setModo("foto");
              setScreen("camera");
            }}
          >
            Sacar Foto
          </button>
          <button
            onClick={() => {
              setModo("video");
              setScreen("camera");
            }}
          >
            Grabar Video
          </button>
          <button
            onClick={() => setScreen("form")}
            style={{ marginTop: "20px" }}
          >
            <ArrowLeft size={20} />
          </button>
        </div>
      )}
  
      {/* CÁMARA */}
      {screen === "camera" && (
        <div className={styles.cameraContainer}>
          <video
            ref={videoRef}
            className={styles.video}
            autoPlay
            playsInline
            muted
          />
  
          <div className={styles.cameraOverlay}>
            {modo === "foto" && (
              <button className={styles.takePhotoButton} onClick={takePhoto}>
                Tomar foto
              </button>
            )}
            
            {modo === "video" && (
               <div
               className={`${styles.recordButtonWrapper} ${isRecording ? styles.recording : ""}`}
               onClick={() => {
                console.log(isRecording ? "🟥 Deteniendo..." : "🔴 Grabando...");
                isRecording ? stopRecording() : startRecording();
              }}
               title={isRecording ? "Detener grabación" : "Iniciar grabación"}
             >
               <div className={styles.recordButtonInner}></div>
             </div>
            )}
            
          </div>
  
          <button
            id="camera-back-button"
            onClick={() => setScreen("form")}
            style={{ position: "absolute", top: 40, left: 10 }}
          >
            <ArrowLeft size={30} />
          </button>
        </div>
      )}
  
      {/* PREVISUALIZACIÓN DE FOTOS */}
      {screen === "photo" && (
        <div style={{ padding: 20 }}>
          <h3 style={{ textAlign: "center" }}>Pre-visualizacion</h3>
  
          <div
            style={{
              display: "flex",
              overflowX: "auto",
              gap: "10px",
              padding: "10px",
            }}
          >
            {fotosAcumuladas.map((foto, index) => (
              <div key={index} style={{ position: "relative" }}>
                <img
                  src={foto}
                  alt={`foto ${index}`}
                  style={{
                    width: "150px",
                    borderRadius: "8px",
                    boxShadow: "0 0 5px #aaa",
                  }}
                />
                <button
                  title="Eliminar esta foto"
                  onClick={() => {
                    const nuevasFotos = fotosAcumuladas.filter((_, i) => i !== index);
                    setFotosAcumuladas(nuevasFotos);
                    if (nuevasFotos.length === 0) {
                      setPhotoData(null);
                      setScreen("camera");
                    }
                  }}
                  style={{
                    position: "absolute",
                    top: "5px",
                    right: "5px",
                    background: "rgba(255, 0, 0, 0.7)",
                    border: "none",
                    borderRadius: "50%",
                    color: "#fff",
                    width: "24px",
                    height: "24px",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
  
          <div
            style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 20 }}
          >
            <button onClick={() => setScreen("camera")}>➕ Agregar más</button>
            <button
              onClick={guardarCaso}
              disabled={isSaving}
            >
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
  
      {/* PREVISUALIZACIÓN DE VIDEO */}
      {screen === "videoPreview" && videosAcumulados.length > 0 && (
      <div className={styles.previewWrapper}>
        <h3 className={styles.previewTitle}>Previsualización de Videos</h3>

       <div className={styles.videoCarrusel}>
        {videosAcumulados.map((videoURL, index) => (
         <div key={index} className={styles.videoPreviewWrapper}>
          <video src={videoURL} controls className={styles.previewVideo}/>
          <button
            className={styles.iconButton}
            title="Eliminar este video"
            onClick={() => {
              const nuevosVideos = videosAcumulados.filter((_, i) => i !== index);
              setVideosAcumulados(nuevosVideos);
              if (nuevosVideos.length === 0) {
                setScreen("camera");
              }
            }}
           >
            ✕
           </button>
          </div>
        ))}
      </div>

      <div className={styles.postPreviewControls}>
       <button className={styles.controlButton} onClick={saveVideo}>
        Guardar videos
       </button>
       <button className={styles.controlButton} onClick={() => setScreen("camera")}>
         Grabar otro
       </button>
       <button className={styles.controlButton}
               onClick={() => {
                setVideosAcumulados([]);
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
