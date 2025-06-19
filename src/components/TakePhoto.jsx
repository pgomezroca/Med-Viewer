import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect,useState ,useRef} from 'react';
import piexif from 'piexifjs';


const regionsMap = {
  cuello: ['plexo-braquial', 'fractura-clavicula'],
  hombro: ['manguito-rotador', 'acromio-clavicular'],
  brazo: ['fracturas', 'ruptura-biceps'],
  codo: ['fracturas-codo', 'luxaciones-codo'],
  antebrazo:['fracturas-antebrazo','luxaciones-antebrazo','heridas-graves','otros-antebrazo'],
  muñeca:['fracturas-muñeca','luxaciones-muñeca','heridas-graves-munieca'],
  mano:['fracturas-mano','inestabilidades','seccion-tendones-nervios','amputaciones','tumores-mano',
    'otros-mano'
  ],
  microcirugia:['reimplantes','colgajos'],
  det:['hombro','muñeca','det-otro']

};
const phaseOptions = ['Pre', 'Intra', 'Post'];

const SubregionSelect = ({ region, diagnostic, setDiagnostic }) => {
  if (!region) return null;
  return (
    <select value={diagnostic} onChange={e => setDiagnostic(e.target.value)}>
      <option value="" disabled>Seleccioná diagnóstico</option>
      {regionsMap[region].map(diag => (
        <option key={diag} value={diag}>{diag}</option>
      ))}
    </select>
  );
};
const PhaseSelect = ({ diagnostic, phase, setPhase }) => {
  if (!diagnostic) return null;
  return (
    <select value={phase} onChange={e => setPhase(e.target.value)}>
      <option value="" disabled>Seleccioná fase</option>
      {phaseOptions.map(f => (
        <option key={f} value={f}>{f}</option>
      ))}
    </select>
  );
};

const TakePhoto = () => {
  const navigate = useNavigate();
  const [screen, setScreen] = useState('form');
  const [videoReady, setVideoReady] = useState(false);
  const [dni, setDni] = useState('');
  const [region, setRegion] = useState('');
  const [diagnostic, setDiagnostic] = useState('');
  const [phase, setPhase] = useState('');
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
    if (!dni || !region || !diagnostic || !phase) {
      alert('Completa DNI, región, diagnóstico y fase.');
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
  // const savePhoto = () => {
  //   if (!photoData) return;
  //   try {
  //     const exifObj = {
  //       '0th': {
  //         [piexif.ImageIFD.Make]: 'MedPhotoReact',
  //         [piexif.ImageIFD.ImageDescription]: `${diagnostic} - ${phase}`
  //       },
  //       Exif: {
  //         [piexif.ExifIFD.DateTimeOriginal]: new Date().toISOString().slice(0,19).replace(/-/g, ':').replace('T', ' ')
  //       }
  //     };
  //     const exifBytes = piexif.dump(exifObj);
  //     const newDataURL = piexif.insert(exifBytes, photoData);
  //     const fecha = new Date().toISOString().replace(/[:.]/g, '-');
  //     const nombreArchivo = `${dni}_${region}_${diagnostic}_${phase}_${fecha}.jpg`;
  //     const link = document.createElement('a');
  //     link.href = newDataURL;
  //     link.download = nombreArchivo;
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //     // Aquí podrías enviar datos al backend (e.g., fetch POST con dni, region, diagnostic, phase)
  //   } catch (error) {
  //     alert('No se pudo insertar EXIF: ' + error.message);
  //   }
  // };

  const savePhoto = async () => {
    if (!photoData) return;
    try {
      const exifObj = {
        '0th': {
          [piexif.ImageIFD.Make]: 'MedPhotoReact',
          [piexif.ImageIFD.ImageDescription]: `${diagnostic} - ${phase}`
        },
        Exif: {
          [piexif.ExifIFD.DateTimeOriginal]: new Date().toISOString().slice(0, 19).replace(/-/g, ':').replace('T', ' ')
        }
      };
      const exifBytes = piexif.dump(exifObj);
      const newDataURL = piexif.insert(exifBytes, photoData);
  
      // Convertir dataURL a blob
      const res = await fetch(newDataURL);
      const blob = await res.blob();
  
      const formData = new FormData();
      formData.append('image', blob, 'photo.jpg');
      formData.append('region', region);
      formData.append('diagnosis', diagnostic);
      formData.append('phase', phase);
      formData.append('optionalDNI', dni);
      //Este user es de prueba
      formData.append('uploadedBy', '60f71889c9d1f814c8a3b123');
  
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
  
      // Volver a pantalla anterior
      navigate('/Despedida');
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
          <select
            value={region}
            onChange={e => { setRegion(e.target.value); setDiagnostic(''); setPhase(''); }}
          >
            <option value="" disabled>Seleccioná región anatómica</option>
            {Object.keys(regionsMap).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <SubregionSelect
            region={region}
            diagnostic={diagnostic}
            setDiagnostic={(d) => { setDiagnostic(d); setPhase(''); }}
          />
          <PhaseSelect
            diagnostic={diagnostic}
            phase={phase}
            setPhase={setPhase}
          />
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
          <button
            onClick={takePhoto}
            disabled={!videoReady}
            id="botonFoto"
          >
            {videoReady ? 'Tomar foto' : 'Cargando cámara…'}
          </button>
        </div>
      )}
  
      {screen === 'photo' && (
        <>
          <div><img src={photoData} alt="captura" style={{ width: '100%' }} /></div>
          <div id="buttons">
            <button onClick={savePhoto}>Guardar</button>
            <button onClick={() => setScreen('camera')}>Tomar otra</button>
            <button onClick={() => navigate('/Despedida')}>Finalizar</button>
            <button onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>
               Volver
            </button>
          </div>
        </>
      )}
  
      
  
      <canvas ref={canvasRef} style={{ display: 'none' }} />
     
    </div>
  );
  
};

export default TakePhoto;
