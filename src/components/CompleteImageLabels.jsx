import React, { useState, useEffect } from "react";
import FormularioJerarquico from "../components/FormularioJerarquico";
import { agruparPorJerarquia } from "../utils/agruparCasos";
import styles from "../styles/completeImageLabels.module.css";

const CompleteImageLabels = () => {
  const [casosAgrupados, setCasosAgrupados] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [camposFaltantes, setCamposFaltantes] = useState([]);
  const [busqueda, setBusqueda] = useState({ region: "", diagnostico: "" });
  const [buscando, setBuscando] = useState(false);
  const token = localStorage.getItem("token");
  const [camposCompletados, setCamposCompletados] = useState({});

  const toggleFolder = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const determinarCamposFaltantes = (caso) => {
    const camposRequeridos = [
      "region",
      "diagnostico",
      "etiologia",
      "tejido",
      "tratamiento",
      "phase",
    ];
    return camposRequeridos.filter((campo) => {
      return (
        caso[campo] === null
      );
    });
  };

  const handleBuscar = async () => {
    if (!busqueda.diagnostico) {
      alert("Seleccioná un diagnóstico");
      return;
    }

    setBuscando(true);

    try {
      const query = new URLSearchParams();
      query.append("diagnostico", busqueda.diagnostico);
      if (busqueda.region) query.append("region", busqueda.region);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/images/incomplete?${query}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      const estructura = agruparPorJerarquia(data);
      setCasosAgrupados(estructura);
    } catch (err) {
      console.error("Error al buscar imágenes:", err);
      alert("Error al buscar imágenes");
    } finally {
      setBuscando(false);
    }
  };

  const handleSaveLabels = async () => {
    if (!selectedCase) return;

    try {
      const payload = camposFaltantes.reduce((acc, campo) => {
        if (camposCompletados[campo] !== undefined) {
          acc[campo] = camposCompletados[campo];
        }
        return acc;
      }, { _id: selectedCase._id });

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/images/${selectedCase._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("No se pudo guardar");

      alert("✅ Etiquetas guardadas correctamente");
      await handleBuscar();
      setSelectedCase(null);
      setCamposCompletados({});
    } catch (error) {
      console.error("Error al actualizar la imagen:", error);
      alert("Error al guardar etiquetas");
    }
  };

  const handleDelete = async () => {
    if (!selectedCase) return;

    const confirm = window.confirm("¿Seguro que querés eliminar este caso?");
    if (!confirm) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/images/${selectedCase._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("No se pudo eliminar");

      alert("✅ Caso eliminado correctamente");
      await handleBuscar();
      setSelectedCase(null);
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Error al eliminar el caso");
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>🔍 Buscar imágenes incompletas</h2>

      <FormularioJerarquico
        campos={["region", "diagnostico"]}
        onChange={setBusqueda}
      />

      <button
        onClick={handleBuscar}
        disabled={buscando}
        className={styles.searchButton}
      >
        {buscando ? "Buscando..." : "Buscar imágenes"}
      </button>

      <hr className={styles.divider} />

      {casosAgrupados.length > 0 && (
        <div className={styles.resultsContainer}>
          <h3>
            Resultados (
            {casosAgrupados.reduce(
              (acc, region) =>
                acc +
                region.diagnosticos.reduce(
                  (a, diag) =>
                    a +
                    diag.tratamientos.reduce(
                      (b, trat) => b + trat.casos.length,
                      0
                    ),
                  0
                ),
              0
            )}{" "}
            casos)
          </h3>

          {casosAgrupados.map((regionData, rIndex) => {
            const regionKey = `region-${rIndex}`;
            return (
              <div key={regionKey} className={styles.folder}>
                <div
                  onClick={() => toggleFolder(regionKey)}
                  className={styles.folderHeader}
                >
                  {expanded[regionKey] ? "📂" : "📁"}{" "}
                  {regionData.region || "Sin región"}
                </div>

                {expanded[regionKey] &&
                  regionData.diagnosticos.map((diag, dIndex) => {
                    const diagKey = `${regionKey}-diag-${dIndex}`;
                    return (
                      <div key={diagKey} className={styles.subfolder}>
                        <div
                          onClick={() => toggleFolder(diagKey)}
                          className={styles.subfolderHeader}
                        >
                          {expanded[diagKey] ? "📂" : "📁"}{" "}
                          {diag.nombre || "Sin diagnóstico"}
                        </div>

                        {expanded[diagKey] &&
                          diag.tratamientos.map((trat, tIndex) => {
                            const tratKey = `${diagKey}-trat-${tIndex}`;
                            return (
                              <div
                                key={tratKey}
                                className={styles.subsubfolder}
                              >
                                <div
                                  onClick={() => toggleFolder(tratKey)}
                                  className={styles.subsubfolderHeader}
                                >
                                  {expanded[tratKey] ? "📂" : "📁"}{" "}
                                  {trat.nombre || "Sin tratamiento"}
                                </div>

                                {expanded[tratKey] &&
                                  trat.casos.map((caso, cIndex) => (
                                    <div
                                      key={`${tratKey}-caso-${cIndex}`}
                                      onClick={() => {
                                        setSelectedCase(caso);
                                        setCamposFaltantes(
                                          determinarCamposFaltantes(caso)
                                        );
                                      }}
                                      className={styles.caseItem}
                                    >
                                      🗂 Caso {caso.dni || "Sin DNI"} -{" "}
                                      {caso.fecha || "Sin fecha"}
                                      <div className={styles.missingFields}>
                                        Faltan:{" "}
                                        {determinarCamposFaltantes(caso)
                                          .map((campo) => {
                                            const nombresLegibles = {
                                              region: "Región",
                                              diagnostico: "Diagnóstico",
                                              etiologia: "Etiología",
                                              tejido: "Tejido",
                                              tratamiento: "Tratamiento",
                                              phase: "Fase",
                                            };
                                            return (
                                              nombresLegibles[campo] || campo
                                            );
                                          })
                                          .join(", ") || "Ninguno"}
                                      </div>
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
          })}
        </div>
      )}

      {selectedCase && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Completar caso: {selectedCase.dni || "Sin DNI"}</h2>
              <button
                onClick={() => setSelectedCase(null)}
                className={styles.modalCloseButton}
              >
                ×
              </button>
            </div>

            <div>
              <h3>Archivos del caso</h3>
              <div className={styles.mediaGrid}>
                {selectedCase.imagenes.map((media, idx) => (
                  <div key={idx} className={styles.mediaItem}>
                    {media.endsWith(".webm") || media.endsWith(".mp4") ? (
                      <video src={media} controls className={styles.media} />
                    ) : (
                      <img
                        src={media}
                        alt={`Imagen ${idx}`}
                        className={styles.media}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3>Completar información faltante</h3>
              <FormularioJerarquico
                campos={camposFaltantes}
                onChange={(data) => {
                  const nuevosCampos = {};
                  camposFaltantes.forEach(campo => {
                    if (data[campo] !== undefined) {
                      nuevosCampos[campo] = data[campo];
                    }
                  });
                  setCamposCompletados(prev => ({ ...prev, ...nuevosCampos }));
                  setSelectedCase(prev => ({ ...prev, ...nuevosCampos }));
                }}
                valores={{
                  ...selectedCase,
                  ...Object.fromEntries(
                    Object.entries(selectedCase)
                      .filter(([_, value]) => value !== null)
                  )
                }}
              />
            </div>

            <div className={styles.actionButtons}>
              <button
                onClick={() => handleSaveLabels(selectedCase)}
                className={styles.saveButton}
              >
                💾 Guardar cambios
              </button>
              <button onClick={handleDelete} className={styles.deleteButton}>
                🗑️ Eliminar caso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompleteImageLabels;
