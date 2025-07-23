import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import piexif from "piexifjs";
import { ArrowLeft } from "lucide-react";
import FormularioJerarquico from "./FormularioJerarquico";
import styles from '../styles/TakePhoto.module.css';

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
  const [videoBlobURL, setVideoBlobURL] = useState(null);
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!res.ok) throw new Error("Error al buscar casos");
      const data = await res.json();
      setCasosDelDni(data); 
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
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoBlobURL(url);
      setScreen('videoPreview');
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveVideo = async () => {
    if (!videoBlobURL) return;
  
    try {
      const res = await fetch(videoBlobURL);
      const blob = await res.blob();
  
      const formData = new FormData();
      formData.append("image", blob, "video.webm");
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
        console.error("❌ Error al subir video:", error);
        alert("Error al subir el video");
        return;
      }
  
      const videoData = await uploadRes.json();
      console.log("✅ Video subido:", videoData);
      alert("Video subido con éxito");
  
      setVideoBlobURL(null);
      setScreen("camera");
    } catch (error) {
      console.error("Error en saveVideo:", error);
      alert("No se pudo subir el video: " + error.message);
    }
  };

  const guardarFotosAcumuladas = async () => {
    for (let foto of fotosAcumuladas) {
      setIsSaving(true);
      try {
        const exifObj = {
          "0th": {
            [piexif.ImageIFD.Make]: "MedPhotoReact",
            [piexif.ImageIFD.ImageDescription]: `${region} - ${diagnostico} - ${fase}`,
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
        const newDataURL = piexif.insert(exifBytes, foto);
  
        const res = await fetch(newDataURL);
        const blob = await res.blob();
  
        const formData = new FormData();
        formData.append("image", blob, "photo.jpg");
        formData.append("region", region);
        formData.append("diagnostico", diagnostico);
        formData.append("fase", fase);
        formData.append("optionalDNI", dni);
        formData.append("uploadedBy", "60f71889c9d1f814c8a3b123");
  
        const uploadRes = await fetch(`${apiUrl}/api/images/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
  
        if (!uploadRes.ok) {
          const error = await uploadRes.json();
          console.error("❌ Error al subir:", error);
          alert("Error al subir una imagen");
          setIsSaving(false);
          return;
        }
  
        const imageData = await uploadRes.json();
        console.log("✅ Imagen subida:", imageData);
      } catch (err) {
        console.error("Error al subir imagen:", err);
        setIsSaving(false);
        alert("No se pudo subir una imagen");
      }
    }
  
    alert("✅ Todas las fotos fueron subidas correctamente");
    setFotosAcumuladas([]);
    setPhotoData(null);
    setIsSaving(false);
    setScreen("form");
  };
  
  return (
    <>
      {/* FORMULARIO PRINCIPAL */}
      {screen === "form" && (
        <div id="formulario" ref={formularioRef}>
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
  
          {dni && (
            <div style={{ marginTop: 20 }}>
              {casosDelDni.length > 0 ? (
                <>
                  <h4>Casos previos para DNI {dni}:</h4>
                  {casosDelDni.map((caso, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setRegion(caso.region || "");
                        setDiagnostico(caso.diagnostico || "");
                        setFase("");
                        formularioRef.current?.scrollIntoView({ behavior: "smooth" });
                      }}
                      style={{
                        display: "block",
                        margin: "5px 0",
                        padding: "8px",
                        background: "#eee",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      📁 {caso.uploadedAt
                        ? new Date(caso.uploadedAt).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Caso sin fecha"}
                    </button>
                  ))}
                </>
              ) : (
                <p style={{ color: "#666", marginTop: 10 }}>
                  No hay datos del paciente con DNI {dni}
                </p>
              )}
            </div>
          )}
  
          <div className={styles.botonesCentrados}>
            <button className={styles.ContinuarButton} onClick={startCamera}>
              Continuar
            </button>
            <button className={styles.camerabackbutton} onClick={() => navigate(-1)}>
              <ArrowLeft size={20} /> Volver
            </button>
          </div>
        </div>
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
              <>
                {!isRecording && (
                  <button onClick={startRecording}>🎥 Empezar</button>
                )}
                {isRecording && (
                  <button onClick={stopRecording}>⏹️ Detener</button>
                )}
                {videoBlobURL && (
                  <button onClick={saveVideo}> Guardar</button>
                )}
              </>
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
              onClick={guardarFotosAcumuladas}
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
      {screen === "videoPreview" && videoBlobURL && (
        <div className={styles.previewWrapper}>
          <h3 className={styles.previewTitle}>Previsualización del Video</h3>
          <div className={styles.videoPreviewContainer}>
            <div className={styles.videoPreviewWrapper}>
              <video src={videoBlobURL} controls className={styles.previewVideo} />
              <button
                className={styles.iconButton}
                onClick={() => {
                  setVideoBlobURL(null);
                  setScreen("camera");
                }}
                title="Eliminar este video y grabar otro"
              >
                ❌
              </button>
            </div>
          </div>
  
          <div className={styles.postPreviewControls}>
            <button className={styles.controlButton} onClick={saveVideo}>
              Guardar video
            </button>
            <button
              className={styles.controlButton}
              onClick={() => {
                setVideoBlobURL(null);
                setScreen("camera");
              }}
            >
              Grabar otro
            </button>
            <button
              className={styles.controlButton}
              onClick={() => {
                setVideoBlobURL(null);
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
