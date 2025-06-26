// src/components/RecoverPhoto.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/RecoverPhoto.module.css";
import FormularioJerarquico from "./FormularioJerarquico";

const RecoverPhoto = () => {
  const navigate = useNavigate();
  const [dni, setDni] = useState("");
  const [region, setRegion] = useState("");
  const [etiologia, setEtiologia] = useState("");
  const [tejido, setTejido] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [tratamiento, setTratamiento] = useState("");
  const [fase, setFase] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [resultados, setResultados] = useState([]);

  const agruparPorJerarquia = (imagenes) => {
    const estructura = [];

    for (const img of imagenes) {
      const { region, diagnostico, tratamiento, optionalDNI, uploadedAt, url } =
        img;

      let nodoRegion = estructura.find((r) => r.region === region);
      if (!nodoRegion) {
        nodoRegion = { region, diagnosticos: [] };
        estructura.push(nodoRegion);
      }

      let nodoDiag = nodoRegion.diagnosticos.find(
        (d) => d.nombre === diagnostico
      );
      if (!nodoDiag) {
        nodoDiag = { nombre: diagnostico, tratamientos: [] };
        nodoRegion.diagnosticos.push(nodoDiag);
      }

      let nodoTrat = nodoDiag.tratamientos.find(
        (t) => t.nombre === tratamiento
      );
      if (!nodoTrat) {
        nodoTrat = { nombre: tratamiento, casos: [] };
        nodoDiag.tratamientos.push(nodoTrat);
      }

      let nodoCaso = nodoTrat.casos.find((c) => c.dni === optionalDNI);
      if (!nodoCaso) {
        nodoCaso = {
          dni: optionalDNI,
          fecha: uploadedAt?.slice(0, 10),
          imagenes: [],
          diagnostico,
          tratamiento,
          region,
        };
        nodoTrat.casos.push(nodoCaso);
      }

      nodoCaso.imagenes.push(url);
    }

    return estructura;
  };

  const dataFiltrada = resultados.find((item) => item.region === region);
  const handleBuscar = async () => {
    try {
      const params = new URLSearchParams();
      if (dni) params.append("optionalDNI", dni);
      if (region) params.append("region", region);
      if (etiologia) params.append("etiologia", etiologia);
      if (tejido) params.append("tejido", tejido);
      if (diagnostico) params.append("diagnostico", diagnostico);
      if (tratamiento) params.append("tratamiento", tratamiento);
      if (fase) params.append("phase", fase);

      const res = await fetch(
        `http://localhost:3000/api/images/search?${params.toString()}`
      );
      const images = await res.json();

      const agrupados = agruparPorJerarquia(images);
      setResultados(agrupados);
      setMostrarResultados(true);
    } catch (err) {
      console.error("Error al buscar imágenes:", err);
      alert("Error al buscar imágenes");
    }
  };

  const toggleFolder = (key) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
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
          onChange={({
            region,
            etiologia,
            tejido,
            diagnostico,
            tratamiento,
            fase,
          }) => {
            setRegion(region);
            setEtiologia(etiologia);
            setTejido(tejido);
            setDiagnostico(diagnostico);
            setTratamiento(tratamiento);
            setFase(fase);
          }}
        />
        <button onClick={handleBuscar}>Buscar</button>
      </div>

      {mostrarResultados && dataFiltrada && (
        <div className={styles.folderStructure}>
          <div className={styles.folder} onClick={() => toggleFolder(region)}>
            {expanded[region] ? "📂" : "📁"} {region}
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
                    {expanded[diagKey] ? "📂" : "📁"} {diag.nombre}
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
                            {expanded[tratKey] ? "📂" : "📁"} {trat.nombre}
                          </div>

                          {expanded[tratKey] &&
                            trat.casos.map((caso, cIndex) => (
                              <div
                                key={cIndex}
                                className={styles.case}
                                onClick={() => handleCaseClick(caso)}
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
            <h3>
              Caso: {selectedCase.dni} - {selectedCase.tratamiento}
            </h3>
            <p>Imágenes:</p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {selectedCase.imagenes.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Imagen ${idx}`}
                  style={{ width: "100px", borderRadius: "8px" }}
                />
              ))}
            </div>
            {/* BOTONES DE ACCIÓN */}
            <div
              style={{
                marginTop: "30px",
                display: "flex",
                gap: "20px",
                justifyContent: "center",
              }}
            >
              <button onClick={() => marcarFavorito(selectedCase)}>
                ⭐ Favorito
              </button>
              <button onClick={() => agregarACarpeta(selectedCase)}>
                📁 Guardar en carpeta
              </button>
              <button onClick={() => console.log("Click directo")}>
                📤 Exportar
              </button>
            </div>

            <button onClick={closeModal}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecoverPhoto;
