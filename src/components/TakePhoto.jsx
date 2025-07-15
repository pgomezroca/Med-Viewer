import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import piexif from "piexifjs";
import { ArrowLeft } from "lucide-react";
import FormularioJerarquico from "./FormularioJerarquico";
import styles from '../styles/TakePhoto.module.css';

const TakePhoto = () => {
  const navigate = useNavigate();
  const [screen, setScreen] = useState("form");
  const [videoReady, setVideoReady] = useState(false);
  const [dni, setDni] = useState("");
  const [region, setRegion] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [photoData, setPhotoData] = useState(null);
  const [modo, setModo] = useState("foto"); // 'foto' o 'video'
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL;
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlobURL, setVideoBlobURL] = useState(null);
  const [fotosAcumuladas, setFotosAcumuladas] = useState([]);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(
    () => () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    },
    []
  );

  useEffect(() => {
    if (screen === "camera" && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;

      video
        .play()
        .then(() => {
          setVideoReady(true);
        })
        .catch((err) => {
          console.error("No se pudo iniciar el video:", err);
          alert("Error al iniciar cámara");
        });
    }
  }, [screen, videoRef.current, streamRef.current]);

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

  return (
    <div>
      {screen === "form" && (
        <div id="formulario">
          
          <FormularioJerarquico
            campos={["dni", "region", "diagnostico"]}
            onChange={(data) => {
              setDni(data.dni || "");
              setRegion(data.region || "");
              setDiagnostico(data.diagnostico || "");
            }}
          />
           <div className={styles.botonesCentrados}>
             <button className={styles.ContinuarButton} onClick={startCamera}>Continuar</button>
             <button className={styles.VolverButton} onClick={() => navigate(-1)}>
             <ArrowLeft size={20} /> Volver
          </button>
          </div>
         
         
        </div>
      )}
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
      {screen === "camera" && (
        <div className={styles.cameraContainer}>
        <video
            ref={videoRef}
            autoPlay
            playsInline
            
          />

          <div>
          
          
            {modo === "foto" && (
              <button id="botonFoto"
              className={styles.takePhotoButton}
              onClick={takePhoto} disabled={!videoReady}>
                {videoReady ? "Tomar foto" : "Cargando cámara…"}
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

{screen === 'photo' && (
  <div style={{ padding: 20 }}>
    <h3 style={{ textAlign: 'center' }}>Pre-visualizacion</h3>

    {/* Carrusel horizontal de fotos acumuladas */}
    <div
      style={{
        display: 'flex',
        overflowX: 'auto',
        gap: '10px',
        padding: '10px',
      }}
    >
      {fotosAcumuladas.map((foto, index) => (
        <div key={index} style={{ position: 'relative' }}>
          <img
            src={foto}
            alt={`foto ${index}`}
            style={{
              width: '150px',
              borderRadius: '8px',
              boxShadow: '0 0 5px #aaa',
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
              position: 'absolute',
              top: '5px',
              right: '5px',
              background: 'rgba(255, 0, 0, 0.7)',
              border: 'none',
              borderRadius: '50%',
              color: '#fff',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>

    {/* Acciones */}
    <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 20 }}>
      <button onClick={() => setScreen("camera")}>➕ Agregar más</button>
      <button
  onClick={async () => {
    for (let foto of fotosAcumuladas) {
      setIsSaving(true); 
      try {
        const exifObj = {
          "0th": {
            [piexif.ImageIFD.Make]: "MedPhotoReact",
            [piexif.ImageIFD.ImageDescription]: `${region} -  - ${diagnostico} - `,
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
        
        formData.append("optionalDNI", dni);
        formData.append("uploadedBy", "60f71889c9d1f814c8a3b123");

        const uploadRes = await fetch(`${apiUrl}/api/images/upload`, {
          method: "POST",
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
  }}
  disabled={isSaving}
>
   
   {isSaving ? "Guardando..." : "Guardar todas"}
</button>

      <button
        onClick={() => {
          streamRef.current?.getTracks().forEach(track => track.stop());
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

 {screen === 'videoPreview' && videoBlobURL && (
 <div className={styles.previewWrapper}>
   <h3 className={styles.previewTitle}>Previsualización del Video</h3>
    <div className={styles.videoPreviewContainer}>
    <div className={styles.videoPreviewWrapper}>
  <video
    src={videoBlobURL}
    controls
    className={styles.previewVideo}
  />
  <button
    className={styles.iconButton}
    onClick={() => {
      setVideoBlobURL(null);
      setScreen('camera');
    }}
    title="Eliminar este video y grabar otro"
  >
    ❌
  </button>
</div>
</div>
          <div className={styles.postPreviewControls}>
            <button 
            className={styles.controlButton} 
            onClick={saveVideo}> Guardar video</button>
            <button
            className={styles.controlButton}  
            onClick={() => {
              setVideoBlobURL(null);
              setScreen('camera');
            }}> Grabar otro</button>
            <button
            className={styles.controlButton}  
             onClick={() => {
              setVideoBlobURL(null);
              setScreen('form');
            }}> Finalizar caso</button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default TakePhoto;
