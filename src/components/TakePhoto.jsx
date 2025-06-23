import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import piexif from 'piexifjs';
import { ArrowLeft } from 'lucide-react';
import FormularioJerarquico from './FormularioJerarquico';


const TakePhoto = () => {
  const navigate = useNavigate();
  const [screen, setScreen] = useState('form');
  const [videoReady, setVideoReady] = useState(false);
  const [dni, setDni] = useState('');
  const [region, setRegion] = useState('');
  const [etiologia, setEtiologia] = useState('');
  const [tejido, setTejido] = useState('');
 const [diagnostico, setDiagnostico] = useState('');
 const [tratamiento, setTratamiento] = useState('');

  const [photoData, setPhotoData] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, []);

  useEffect(() => {
    if (screen === 'camera' && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.onloadedmetadata = () => setVideoReady(true);
    }
  }, [screen]);

  const startCamera = async () => {
    if (!dni || !region || !etiologia || !diagnostico || !tratamiento) {
      alert('Completa DNI, región y etiología.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setScreen('camera');
    } catch (error) {
      alert('Error al acceder a la cámara: ' + error.message);
    }
  };

  const takePhoto = () => {
    if (!videoReady) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataURL = canvas.toDataURL('image/jpeg', 0.92);
    setPhotoData(dataURL);
    setScreen('photo');
  };

  const savePhoto = async () => {
    if (!photoData) return;
    try {
      const exifObj = {
        '0th': {
          [piexif.ImageIFD.Make]: 'MedPhotoReact',
          [piexif.ImageIFD.ImageDescription]:  `${region} - ${etiologia} - ${tejido} - ${diagnostico} - ${tratamiento}`
        },
        Exif: {
          [piexif.ExifIFD.DateTimeOriginal]: new Date().toISOString().slice(0, 19).replace(/-/g, ':').replace('T', ' ')
        }
      };
      const exifBytes = piexif.dump(exifObj);
      const newDataURL = piexif.insert(exifBytes, photoData);

      const res = await fetch(newDataURL);
      const blob = await res.blob();

      const formData = new FormData();
      formData.append('image', blob, 'photo.jpg');
      formData.append('region', region);
      formData.append('etiologia', etiologia);
      formData.append('tejido', tejido);
      formData.append('diagnostico', diagnostico);
      formData.append('tratamiento', tratamiento);
      formData.append('optionalDNI', dni);
      formData.append('uploadedBy', '60f71889c9d1f814c8a3b123'); // usuario de prueba

      const uploadRes = await fetch('http://localhost:3000/api/images/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        const error = await uploadRes.json();
        console.error('❌ Error al subir:', error);
        alert('Error al subir la imagen');
        return;
      }

      const imageData = await uploadRes.json();
      console.log('✅ Imagen subida:', imageData);
      alert('Imagen subida con éxito');

      setScreen('photo');
    } catch (error) {
      console.error(error);
      alert('No se pudo subir la imagen: ' + error.message);
    }
  };

  return (
    <div>
      {screen === 'form' && (
        <div id="formulario">
          <input
            type="text"
            value={dni}
            onChange={e => setDni(e.target.value)}
            placeholder="DNI del paciente"
          />
          <FormularioJerarquico
            onChange={({ region, etiologia, tejido, diagnostico, tratamiento }) => {
              setRegion(region);
              setEtiologia(etiologia);
              setTejido(tejido);
              setDiagnostico(diagnostico);
              setTratamiento(tratamiento);
            }}
          />
         
          <button id="camera-back-button" onClick={() => navigate(-1)}><ArrowLeft size={32} /></button>
          <button onClick={startCamera}>Continuar</button>
        </div>
      )}

      {screen === 'camera' && (
        <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#000' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <button onClick={takePhoto} disabled={!videoReady} id="botonFoto">
            {videoReady ? 'Tomar foto' : 'Cargando cámara…'}
          </button>
          <button id="camera-back-button" onClick={() => setScreen('form')}><ArrowLeft size={32} /></button>
        </div>
      )}

      {screen === 'photo' && (
        <>
          <div><img src={photoData} alt="captura" style={{ width: '100%' }} /></div>
          <div id="buttons">
            <button onClick={savePhoto}>Guardar</button>
            <button onClick={() => setScreen('camera')}>Tomar otra</button>
            <button onClick={() => navigate('/despedida')}>Finalizar</button>
            <button id="camera-back-button" onClick={() => setScreen('camera')}><ArrowLeft size={32} /></button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default TakePhoto;
