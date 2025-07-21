// hooks/useCamera.js
import { useRef, useState, useEffect, useCallback } from "react";
import piexif from "piexifjs";

export const useCamera = ({ initialMode = "foto", onSave }) => {
  const [modo, setModo] = useState(initialMode);
  const [videoReady, setVideoReady] = useState(false);
  const [photoData, setPhotoData] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlobURL, setVideoBlobURL] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (videoBlobURL) {
        URL.revokeObjectURL(videoBlobURL);
      }
    };
  }, [videoBlobURL]);

  const initCamera = useCallback(async () => {
    try {
      setIsInitializing(true);
      setCameraError(null);
      setVideoReady(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      
      streamRef.current = stream;
      const video = videoRef.current;
      
      if (video) {
        video.srcObject = stream;
        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            video.play().then(resolve).catch(err => {
              console.error("Error al reproducir video:", err);
              setCameraError("Error al iniciar cámara");
              resolve();
            });
          };
        });
        setVideoReady(true);
      }
    } catch (err) {
      console.error("Error al iniciar cámara:", err);
      setCameraError(err.message);
      setVideoReady(false);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setVideoReady(false);
  }, []);

  const takePhoto = useCallback(() => {
    if (!videoReady || !videoRef.current || !canvasRef.current) {
      console.log("Cámara no está lista");
      return;
    }
  
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      const dataURL = canvas.toDataURL("image/jpeg", 0.92);
      console.log("Foto capturada", dataURL.substring(0, 50) + "...");
      setPhotoData(dataURL);
    } catch (err) {
      console.error("Error al convertir imagen:", err);
      setCameraError("Error al capturar foto");
    }
  }, [videoReady]);

  const startRecording = useCallback(() => {
    if (!videoReady || !streamRef.current) {
      console.error("La cámara no está lista o no hay stream");
      return;
    }
  
    recordedChunksRef.current = [];
    
    // Prueba con diferentes formatos compatibles
    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm;codecs=h264',
      'video/webm',
      'video/mp4'
    ];
  
    let mediaRecorder;
    let supportedType = '';
  
    // Encontrar el primer formato soportado
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        supportedType = type;
        break;
      }
    }
  
    if (!supportedType) {
      setCameraError("No se encontró un formato de video soportado");
      return;
    }
  
    try {
      const options = { 
        mimeType: supportedType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      };
      
      mediaRecorder = new MediaRecorder(streamRef.current, options);
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
  
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { 
          type: supportedType 
        });
        setVideoBlobURL(URL.createObjectURL(blob));
      };
  
      mediaRecorder.onerror = (e) => {
        console.error("Error en MediaRecorder:", e.error);
        setCameraError(`Error al grabar: ${e.error.name}`);
      };
  
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Capturar datos cada 100ms
      setIsRecording(true);
      
    } catch (err) {
      console.error("Error al iniciar grabación:", err);
      setCameraError(`Error técnico: ${err.message}`);
    }
  }, [videoReady]);
  
  // Función mejorada para reiniciar
  const resetCamera = useCallback(async () => {
    // 1. Detener grabación si está activa
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    
    // 2. Limpiar estados
    setPhotoData(null);
    setVideoBlobURL(null);
    setIsRecording(false);
    setCameraError(null);
    
    // 3. Detener stream anterior
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // 4. Reiniciar cámara
    await initCamera();
  }, [initCamera]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const savePhoto = useCallback(async (metaData) => {
    if (!photoData || !metaData) return;

    try {
      const exifObj = {
        "0th": {
          [piexif.ImageIFD.Make]: "MedPhotoReact",
          [piexif.ImageIFD.ImageDescription]: JSON.stringify(metaData),
        },
        Exif: {
          [piexif.ExifIFD.DateTimeOriginal]: new Date()
            .toISOString()
            .replace(/-/g, ":")
            .replace("T", " ")
            .slice(0, 19),
        },
      };

      const exifBytes = piexif.dump(exifObj);
      const newDataURL = piexif.insert(exifBytes, photoData);
      const res = await fetch(newDataURL);
      const blob = await res.blob();

      await onSave(blob, `photo_${Date.now()}.jpg`);
      setPhotoData(null);
      return true;
    } catch (err) {
      console.error("Error al guardar foto:", err);
      setCameraError("Error al guardar la foto");
      return false;
    }
  }, [photoData, onSave]);

  const saveVideo = useCallback(async () => {
    if (!videoBlobURL) return;

    try {
      const res = await fetch(videoBlobURL);
      const blob = await res.blob();
      
      await onSave(blob, `video_${Date.now()}.webm`);
      URL.revokeObjectURL(videoBlobURL);
      setVideoBlobURL(null);
      return true;
    } catch (err) {
      console.error("Error al guardar video:", err);
      setCameraError("Error al guardar el video");
      return false;
    }
  }, [videoBlobURL, onSave]);

  return {
    // Refs
    videoRef,
    canvasRef,
    
    // Estados
    videoReady,
    photoData,
    setPhotoData,
    videoBlobURL,
    setVideoBlobURL,
    isRecording,
    modo,
    cameraError,
    isInitializing,
    
    // Setters
    setModo,
    resetCamera,
    // Métodos
    takePhoto,
    startRecording,
    stopRecording,
    savePhoto,
    saveVideo,
    initCamera,
    stopCamera,
  };
};