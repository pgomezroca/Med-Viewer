
import React, { useState,useEffect } from "react";
import FormularioJerarquico from "../components/FormularioJerarquico";

const mockImages = [
  {
    id: "img001",
    url: "/images/imagen2.jpeg",
    dni: "12345678",
    region: "hombro",
    diagnostico: "Dislocacion",
  },
  {
    id: "img002",
    url: "imagen7.jpeg",
    dni: "87654321",
    region: "munieca",
    diagnostico: "fractura de carpo",
  },
];

const CompleteImageLabels = () => {
  const [images, setImages] = useState(mockImages);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [extraLabels, setExtraLabels] = useState({});
  
  const [formInitial, setFormInitial] = useState({});
 
  const currentImage = images[currentIndex];
  useEffect(() => {
    if (currentImage) {
      setFormInitial({
        region: currentImage.region,
        diagnostico: currentImage.diagnostico,
        dni: currentImage.dni,
      });
    }
  }, [currentImage]);

  const handleSaveLabels = async () => {
    const payload = {
      ...extraLabels,
      imageId: currentImage.id,
    };

    try {
      console.log("enviar a PATCH para editar:", payload);

      // Simular envio
      await fetch(`/api/images/${currentImage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      alert("✅ Labels saved successfully!");
      setExtraLabels({});
      setCurrentIndex((prev) => prev + 1);
    } catch (error) {
      console.error("❌ Failed to update image:", error);
      alert("Failed to save labels");
    }
  };

  if (!currentImage) {
    return <h3>All recent images have been labeled</h3>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2> Complete las etiquetas de las imagenes recientes</h2>

      <img
        src={currentImage.url}
        alt="Recent medical image"
        style={{ width: "300px", borderRadius: "8px", marginBottom: "10px" }}
      />

      <div style={{ marginBottom: 10 }}>
        <strong>DNI:</strong> {currentImage.dni}<br />
        <strong>Region:</strong> {currentImage.region}<br />
        <strong>Diagnostico:</strong> {currentImage.diagnostico}
      </div>

     {/* <FormularioJerarquico
     campos={["etiologia", "tejido", "tratamiento", "fase"]}
      onChange={(data) => {
       setExtraLabels({
        ...data,
        dni:currentImage.dni,
       region: currentImage.region,
       diagnostico: currentImage.diagnostico,
    });
  }}
/>*/}
  <FormularioJerarquico
  campos={["region", "diagnostico", "etiologia", "tejido", "tratamiento", "fase"]}
  onChange={(data) => {
    setExtraLabels({
      ...data,
      dni: currentImage.dni,
    });
  }}
/>


      <button onClick={handleSaveLabels} style={{ marginTop: 20 }}>
        Guarda las etiquetas
      </button>
    </div>
  );
};

export default CompleteImageLabels;
