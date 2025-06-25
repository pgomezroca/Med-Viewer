// src/components/RecoverPhoto.jsx
import React,{useState} from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/RecoverPhoto.module.css';
import FormularioJerarquico from './FormularioJerarquico';

const RecoverPhoto = () => {
  const navigate = useNavigate();
  const [dni, setDni] = useState('');
  const [region, setRegion] = useState('');
  const [etiologia, setEtiologia] = useState('');
  const [tejido, setTejido] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [tratamiento, setTratamiento] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [mostrarResultados, setMostrarResultados] = useState(false);
  
  // Por ahora datos simulados
  const mockData = [
    {
      region: 'Brazo',
      diagnosticos: [
        {
          nombre: 'Fractura distal',
          tratamientos: [
            {
              nombre: 'Yeso',
              casos: [
                {
                  dni: '12345678',
                  fecha: '2024-01-01',
                  imagenes: [
                    '/images/imagen2.jpeg', '/images/imagen3.jpeg']
                },
                {
                  dni: '1987654',
                  fecha: '2024-01-01',
                  imagenes: ['/images/imagen2.jpeg', '/images/imagen3.jpeg']
                },
                {
                  dni: '12987654',
                  fecha: '2024-01-01',
                  imagenes: ['/images/imagen8.jpeg', '/images/imagen2.jpeg']
                },    

              ]
            },
            {
              nombre: 'DET',
              casos: [
                {
                  dni: '87654321',
                  fecha: '2024-01-15',
                  imagenes: [ '/images/imagen3.jpeg']
                 
                },
                {
                  dni: '87654321',
                  fecha: '2024-01-15',
                  imagenes: [ '/images/imagen3.jpeg']
                 
                },
                {
                  dni: '87654321',
                  fecha: '2024-01-15',
                  imagenes: [ '/images/imagen3.jpeg']
                 
                }
              ]
            }
          ]
        }
      ]
    },
    {
      region: 'Codo',
      diagnosticos: [
        {
          nombre: 'Luxación',
          tratamientos: [
            {
              nombre: 'Reducción',
              casos: [
                {
                  dni: '11112222',
                  fecha: '2024-02-10',
                  imagenes: [
                    '/images/imagen7.jpeg',
                    '/images/imagen8.jpeg'
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ];
  const dataFiltrada= mockData.find(item => item.region === region);
  //funciones
  const handleBuscar = () => {
    console.log("Buscar presionado");
    console.log({ dni, region, diagnostico });
    setMostrarResultados(true);
  };
  const toggleFolder = (key) => {
    setExpanded(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  const handleCaseClick = (caso) => {
    console.log("Caso seleccionado:", caso);
    setSelectedCase(caso);
  };

  const closeModal = () => {
    setSelectedCase(null);
  };
  const marcarFavorito = (selectedCase) => {
    console.log("Marcado como favorito:", selectedCase);
    // Aquí podrías guardar en localStorage, enviar al backend, o marcar en el estado
  };
  
  const agregarACarpeta = (caso) => {
    console.log("Agregado a carpeta temporal:", caso);
    // Podrías usar un array en estado tipo `carpetaTemporal` para acumular
  };
  
  const exportarExcel = (caso) => {
    console.log("Exportando caso:", caso);
    // Más adelante podés usar SheetJS o generar un JSON descargable
  };
  

  return (
    <div className={styles.container}>
      <h2>Recuperar imágenes médicas</h2>
      <div className={styles.form}>
        <input
          type="text"
          className={styles.input}
          placeholder="DNI del paciente"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
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
        <button onClick={handleBuscar}>Buscar</button>
      </div>

      {mostrarResultados && dataFiltrada &&(
        
        <div className={styles.folderStructure}>
        <div className={styles.folder} onClick={() => toggleFolder(region)}>
          {expanded[region] ? '📂' : '📁'} {region}
        </div>
    
        {expanded[region] &&
          dataFiltrada.diagnosticos.map((diag, dIndex) => {
            const diagKey = `${region}-diag-${dIndex}`;
            return (
              <div key={diagKey} style={{ marginLeft: 20 }}>
                <div
                  className={styles.subfolder}
                  onClick={() => toggleFolder(diagKey)}
                >
                  {expanded[diagKey] ? '📂' : '📁'} {diag.nombre}
                </div>
    
                {expanded[diagKey] &&
                  diag.tratamientos.map((trat, tIndex) => {
                    const tratKey = `${diagKey}-trat-${tIndex}`;
                    return (
                      <div key={tratKey} style={{ marginLeft: 20 }}>
                        <div
                          className={styles.subfolder}
                          onClick={() => toggleFolder(tratKey)}
                        >
                          {expanded[tratKey] ? '📂' : '📁'} {trat.nombre}
                        </div>
    
                        {expanded[tratKey] &&
                          trat.casos.map((caso, cIndex) => (
                            <div
                              key={cIndex}
                              className={styles.case}
                              onClick={() => handleCaseClick(caso)
                                
                              }
                              style={{ marginLeft: 20 }}
                            >
                              🗂 {caso.dni} - {caso.fecha}
                            </div>
                          ))}
                      </div>
                    );
                  })}
              </div>
            );
          })}
      </div>
    )}
      

      {selectedCase && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Caso: {selectedCase.dni} - {selectedCase.tratamiento}</h3>
            <p>Imágenes:</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {selectedCase.imagenes.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Imagen ${idx}`}
                  style={{ width: '100px', borderRadius: '8px' }}
                />
                
              ))}
            </div>
             {/* BOTONES DE ACCIÓN */}
      <div style={{ marginTop: '30px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
        <button onClick={() => marcarFavorito(selectedCase)}>⭐ Favorito</button>
        <button onClick={() => agregarACarpeta(selectedCase)}>📁 Guardar en carpeta</button>
        <button onClick={() => console.log("Click directo") }>📤 Exportar</button>
      </div>

            <button onClick={closeModal}>Cerrar</button>
            
          </div>
        </div>
      )}
    </div>
  );
  
};

export default RecoverPhoto;
