import React, { useState, useEffect } from "react";
import FormularioJerarquico from "../components/FormularioJerarquico";

const CompleteImageLabels = () => {
  const [imagenesFiltradas, setImagenesFiltradas] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [extraLabels, setExtraLabels] = useState({});
  const [formInitial, setFormInitial] = useState({});
  const [busqueda, setBusqueda] = useState({ region: "", diagnostico: "" });
  const [buscando, setBuscando] = useState(false);

  const currentImage = imagenesFiltradas[currentIndex];

  useEffect(() => {
    if (currentImage) {
      setFormInitial({
        region: currentImage.region,
        diagnostico: currentImage.diagnostico,
        dni: currentImage.optionalDNI,
      });
    }
  }, [currentImage]);

  const handleSaveLabels = async () => {
    if (!currentImage) return;

    const payload = {
      ...extraLabels,
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/images/${currentImage._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("No se pudo guardar");

      alert("✅ Etiquetas guardadas correctamente");
      setExtraLabels({});
      setCurrentIndex((prev) => prev + 1);
    } catch (error) {
      console.error("❌ Error al actualizar la imagen:", error);
      alert("Error al guardar etiquetas");
    }
  };

  const handleDelete = async () => {
    if (!currentImage) return;

    const confirm = window.confirm("¿Seguro que querés eliminar este caso?");
    if (!confirm) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/images/${currentImage._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("No se pudo eliminar");

      alert("✅ Caso eliminado correctamente");
      setExtraLabels({});
      setCurrentIndex((prev) => prev + 1);
    } catch (error) {
      console.error("❌ Error al eliminar:", error);
      alert("Error al eliminar el caso");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🔍 Buscar imágenes por región y diagnóstico</h2>

      <FormularioJerarquico
        campos={["region", "diagnostico"]}
        onChange={(data) => {
          setBusqueda(data);
        }}
      />

      <button
        onClick={async () => {
          if (!busqueda.diagnostico) {
            alert("Seleccioná un diagnóstico");
            return;
          }

          setBuscando(true);

          try {
            const query = new URLSearchParams();
            query.append("diagnostico", busqueda.diagnostico);
            if (busqueda.region) query.append("region", busqueda.region);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/images/search-incomplete?${query}`);
            if (!res.ok) {
              const text = await res.text(); // 👈 capturamos lo que devolvió el servidor
              throw new Error(`(${res.status}) ${text}`);
            }
            const data = await res.json();

            setImagenesFiltradas(data);
            setCurrentIndex(0);
          } catch (err) {
            console.error("❌ Error al buscar imágenes:", err);
            alert("Error al buscar imágenes");
          } finally {
            setBuscando(false);
          }
        }}
        style={{ marginTop: "10px" }}
      >
         Buscar imágenes
      </button>

      <hr/>

      {!currentImage ? (
        <h3>✅ No hay imágenes para completar</h3>
      ) : (
        <>
          <h2>🩺 Completar etiquetas de casos recientes</h2>

          <img
            src={currentImage.url}
            alt="Imagen médica"
            style={{ width: "300px", borderRadius: "8px", marginBottom: "10px" }}
          />

          <div style={{ marginBottom: 10 }}>
            <strong>DNI:</strong> {currentImage.optionalDNI || "N/A"} <br />
            <strong>Región:</strong> {currentImage.region || "Sin región"} <br />
            <strong>Diagnóstico:</strong> {currentImage.diagnostico || "Sin diagnóstico"}
          </div>

          <FormularioJerarquico
            campos={["region", "diagnostico", "etiologia", "tejido", "tratamiento", "fase"]}
            onChange={(data) => {
              setExtraLabels({
                ...data,
                optionalDNI: currentImage.optionalDNI,
              });
            }}
            valoresIniciales={formInitial}
          />

          <div style={{ marginTop: 20, display: "flex", gap: "10px" }}>
            <button onClick={handleSaveLabels}>💾 Guardar etiquetas</button>
            <button onClick={handleDelete} style={{ color: "red" }}>
              🗑️ Eliminar caso
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CompleteImageLabels;
