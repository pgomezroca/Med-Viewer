import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FormularioJerarquico from "./FormularioJerarquico";
import { ArrowLeft } from "lucide-react";
import { useCamera } from "../hooks/useCamera";

const RecoverPhoto = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    dni: "",
    region: "",
    etiologia: "",
    tejido: "",
    diagnostico: "",
    tratamiento: "",
    fase: ""
  });
  const [selectedCase, setSelectedCase] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [filesToAdd, setFilesToAdd] = useState([]);
  const [modoCamara, setModoCamara] = useState("foto");
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const importInputRef = useRef();

  const handleFormChange = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleFileSelection = (newFiles) => {
    const validTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/webm'];
    const filteredFiles = Array.from(newFiles).filter(file => validTypes.includes(file.type));
    setFilesToAdd(prev => [...prev, ...filteredFiles]);
  };

  const handleRemoveFile = (index) => {
    URL.revokeObjectURL(URL.createObjectURL(filesToAdd[index]));
    setFilesToAdd(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadToExistingCase = async () => {
    if (!selectedCase || filesToAdd.length === 0) return;

    setIsUploading(true);
    const formDataUpload = new FormData();
    filesToAdd.forEach(file => formDataUpload.append("image", file));
    Object.entries(selectedCase).forEach(([key, value]) => {
      if (value) formDataUpload.append(key, value);
    });

    try {
      const res = await fetch(`${apiUrl}/api/images/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formDataUpload,
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Archivos subidos exitosamente");
      setFilesToAdd([]);
      handleBuscar();
      setSelectedCase(null);
    } catch (err) {
      console.error("Error al subir:", err);
      alert("Error al subir archivos");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleFolder = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleBuscar = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await fetch(`${apiUrl}/api/images/search?${params.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const images = await res.json();
      setResultados(agruparPorJerarquia(images));
      setMostrarResultados(true);
    } catch (err) {
      console.error("Error al buscar:", err);
      alert("Error al buscar imágenes");
    }
  };

  const agruparPorJerarquia = (imagenes) => {
    const estructura = [];
    imagenes.forEach(img => {
      const { region, diagnostico, tratamiento, optionalDNI, uploadedAt, url } = img;
      let nodoRegion = estructura.find(r => r.region === region);
      if (!nodoRegion) {
        nodoRegion = { region, diagnosticos: [] };
        estructura.push(nodoRegion);
      }
      let nodoDiag = nodoRegion.diagnosticos.find(d => d.nombre === diagnostico);
      if (!nodoDiag) {
        nodoDiag = { nombre: diagnostico, tratamientos: [] };
        nodoRegion.diagnosticos.push(nodoDiag);
      }
      let nodoTrat = nodoDiag.tratamientos.find(t => t.nombre === tratamiento);
      if (!nodoTrat) {
        nodoTrat = { nombre: tratamiento, casos: [] };
        nodoDiag.tratamientos.push(nodoTrat);
      }
      let nodoCaso = nodoTrat.casos.find(c => c.dni === optionalDNI);
      if (!nodoCaso) {
        nodoCaso = {
          dni: optionalDNI,
          fecha: uploadedAt?.slice(0, 10),
          imagenes: [],
          diagnostico,
          tratamiento,
          region,
          ...img
        };
        nodoTrat.casos.push(nodoCaso);
      }
      nodoCaso.imagenes.push(url);
    });
    return estructura;
  };

  const actualizarSelectedCase = (dni) => {
    for (const region of resultados) {
      for (const diag of region.diagnosticos) {
        for (const trat of diag.tratamientos) {
          const match = trat.casos.find(c => c.dni === dni);
          if (match) {
            setSelectedCase(match);
            return;
          }
        }
      }
    }
  };

  const {
    videoRef,
    canvasRef,
    videoReady,
    cameraError,
    photoData,
    setPhotoData,
    videoBlobURL,
    setVideoBlobURL,
    isRecording,
    resetCamera,
    takePhoto,
    savePhoto,
    startRecording,
    stopRecording,
    saveVideo,
    initCamera,
    stopCamera
  } = useCamera({
    initialMode: modoCamara,
    onSave: async (blob, filename) => {
      const formData = new FormData();
      formData.append("image", blob, filename);
      Object.entries(selectedCase).forEach(([key, val]) => {
        if (val) formData.append(key, val);
      });
    
      try {
        const res = await fetch(`${apiUrl}/api/images/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData,
        });
    
        if (!res.ok) throw new Error("Error al subir");
    
        await handleBuscar();
        actualizarSelectedCase(selectedCase.dni);
    
      } catch (err) {
        console.error("Error al guardar:", err);
        return false;
      }
    }
  });

  useEffect(() => {
    if (mostrarCamara) initCamera();
    else stopCamera();
  }, [mostrarCamara]);

  if (mostrarCamara) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'black', 
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <canvas 
          ref={canvasRef} 
          style={{ display: 'none' }} 
          width={1280}  // Dimensiones por defecto
          height={720}
        />
        {/* Vista de la cámara o foto capturada */}
        {!photoData ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            style={{ 
              flex: 1,
              objectFit: 'cover',
              transform: 'scaleX(-1)'
            }} 
          />
        ) : (
          <img 
            src={photoData} 
            alt="Preview" 
            style={{
              flex: 1,
              objectFit: 'contain',
              backgroundColor: 'black'
            }}
          />
        )}
  
        {/* Controles */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 20,
          padding: '10px'
        }}>
          {modoCamara === 'foto' ? (
            <>
              {!photoData ? (
                <button
                  onClick={takePhoto}
                  disabled={!videoReady}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: 'white',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  📸
                </button>
              ) : (
                <>
                  <button
                    onClick={async () => {
                      await resetCamera();
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: 20,
                      cursor: 'pointer'
                    }}
                  >
                    Reintentar
                  </button>
                  <button
                    onClick={async () => {
                      const success = await savePhoto(selectedCase);
                      if (success) setMostrarCamara(false);
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: 20,
                      cursor: 'pointer'
                    }}
                  >
                    Guardar Foto
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {!isRecording && !videoBlobURL && (
                <button
                  onClick={startRecording}
                  disabled={!videoReady}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: 'red',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  ●
                </button>
              )}
              
              {isRecording && (
                <button
                  onClick={stopRecording}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: 'red',
                    color: 'white',
                    border: '4px solid white',
                    cursor: 'pointer'
                  }}
                >
                  ■
                </button>
              )}
              
              {videoBlobURL && (
                <>
                  <video 
                    src={videoBlobURL} 
                    controls 
                    style={{
                      position: 'absolute',
                      top: 20,
                      left: 20,
                      width: '150px',
                      borderRadius: 8
                    }}
                  />
                  <button
                    onClick={async () => {
                      await resetCamera();
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: 20,
                      cursor: 'pointer'
                    }}
                  >
                    Reintentar
                  </button>
                  <button
                    onClick={async () => {
                      const success = await saveVideo();
                      if (success) setMostrarCamara(false);
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: 20,
                      cursor: 'pointer'
                    }}
                  >
                    Guardar Video
                  </button>
                </>
              )}
            </>
          )}
        </div>
  
        {/* Botón de volver */}
        <button 
          onClick={() => {
            stopCamera();
            setMostrarCamara(false);
            setPhotoData(null);
            setVideoBlobURL(null);
          }}
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            background: 'rgba(0,0,0,0.5)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={24} />
        </button>
  
        {/* Mensaje de estado */}
        {cameraError && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255,0,0,0.7)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: 20
          }}>
            {cameraError}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px',
        gap: '10px'
      }}>
        <button 
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ margin: 0 }}>Recuperar Casos Médicos</h1>
      </div>

      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <FormularioJerarquico
          campos={["dni", "region", "etiologia", "tejido", "diagnostico", "tratamiento", "fase"]}
          onChange={handleFormChange}
        />
        <button
          onClick={handleBuscar}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Buscar Casos
        </button>
      </div>

      {mostrarResultados && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0 }}>Resultados</h2>
          {resultados.length === 0 ? (
            <p>No se encontraron resultados</p>
          ) : (
            resultados.map((regionData, rIndex) => {
              const regionKey = `region-${rIndex}`;
              return (
                <div key={regionKey} style={{ marginBottom: '15px' }}>
                  <div 
                    onClick={() => toggleFolder(regionKey)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: '#e9e9e9',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {expanded[regionKey] ? '📂' : '📁'} {regionData.region || 'Sin región'}
                  </div>
                  
                  {expanded[regionKey] && regionData.diagnosticos.map((diag, dIndex) => {
                    const diagKey = `${regionKey}-diag-${dIndex}`;
                    return (
                      <div key={diagKey} style={{ marginLeft: '20px', marginTop: '10px' }}>
                        <div 
                          onClick={() => toggleFolder(diagKey)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 12px',
                            backgroundColor: '#f0f0f0',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          {expanded[diagKey] ? '📂' : '📁'} {diag.nombre || 'Sin diagnóstico'}
                        </div>
                        
                        {expanded[diagKey] && diag.tratamientos.map((trat, tIndex) => {
                          const tratKey = `${diagKey}-trat-${tIndex}`;
                          return (
                            <div key={tratKey} style={{ marginLeft: '20px', marginTop: '10px' }}>
                              <div 
                                onClick={() => toggleFolder(tratKey)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '8px 12px',
                                  backgroundColor: '#f5f5f5',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                {expanded[tratKey] ? '📂' : '📁'} {trat.nombre || 'Sin tratamiento'}
                              </div>
                              
                              {expanded[tratKey] && trat.casos.map((caso, cIndex) => (
                                <div
                                  key={`${tratKey}-caso-${cIndex}`}
                                  onClick={() => setSelectedCase(caso)}
                                  style={{
                                    marginLeft: '20px',
                                    marginTop: '10px',
                                    padding: '8px 12px',
                                    backgroundColor: '#fafafa',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    border: '1px solid #eee'
                                  }}
                                >
                                  🗂 Caso {caso.dni || 'Sin DNI'} - {caso.fecha || 'Sin fecha'} ({caso.imagenes.length} archivos)
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}

      {selectedCase && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            width: '800px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0 }}>
                Caso: {selectedCase.dni || 'Sin DNI'} - {selectedCase.diagnostico || 'Sin diagnóstico'}
              </h2>
              <button 
                onClick={() => setSelectedCase(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0 }}>Archivos existentes</h3>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '20px'
              }}>
                {selectedCase.imagenes.map((media, idx) => (
                  media.endsWith('.webm') || media.endsWith('.mp4') ? (
                    <div key={idx} style={{
                      width: '150px',
                      height: '150px',
                      position: 'relative'
                    }}>
                      <video 
                        src={media} 
                        controls 
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  ) : (
                    <div key={idx} style={{
                      width: '150px',
                      height: '150px',
                      position: 'relative'
                    }}>
                      <img 
                        src={media} 
                        alt={`Imagen ${idx}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  )
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3>Agregar nuevos archivos</h3>
              <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '15px'
              }}>
                <button
                  onClick={() => importInputRef.current.click()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  📁 Importar
                </button>
                <button
                  onClick={() => {
                    setModoCamara('foto');
                    setMostrarCamara(true);
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  📷 Sacar Foto
                </button>
                <button
                  onClick={() => {
                    setModoCamara('video');
                    setMostrarCamara(true);
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#F44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  🎥 Grabar Video
                </button>
                
                <input 
                  type="file" 
                  ref={importInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/*,video/*" 
                  multiple 
                  onChange={(e) => handleFileSelection(e.target.files)} 
                />
              </div>

              {filesToAdd.length > 0 && (
                <div>
                  <h4>Archivos a agregar ({filesToAdd.length})</h4>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginBottom: '20px'
                  }}>
                    {filesToAdd.map((file, idx) => {
                      const url = URL.createObjectURL(file);
                      return (
                        <div key={idx} style={{
                          width: '120px',
                          height: '120px',
                          position: 'relative'
                        }}>
                          {file.type.startsWith('video') ? (
                            <video
                              src={url}
                              controls
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '4px'
                              }}
                            />
                          ) : (
                            <img
                              src={url}
                              alt={`Preview ${idx}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '4px'
                              }}
                            />
                          )}
                          <button
                            onClick={() => handleRemoveFile(idx)}
                            style={{
                              position: 'absolute',
                              top: '5px',
                              right: '5px',
                              background: 'rgba(255,0,0,0.7)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={handleUploadToExistingCase}
                    disabled={isUploading}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {isUploading ? '⏳ Subiendo...' : '📤 Subir Archivos'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecoverPhoto;