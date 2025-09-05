// src/components/FormularioJerarquicoMUI.jsx
import React, { useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import { estructuraJerarquica } from "../data/estructura-jerarquica.js";
import { extraerDiagnosticosPorRegion } from "../helpers/extraerDiagnosticosPorRegion";

const FormularioJerarquicoMUI = ({ onChange }) => {
  const [region, setRegion] = useState(null);
  const [diagnostico, setDiagnostico] = useState(null);

  // Todas las regiones disponibles
  const regiones = Object.keys(estructuraJerarquica);

  // Diagnósticos sugeridos a partir de la región (usando tu helper ✅)
  const diagnosticos = region
    ? extraerDiagnosticosPorRegion(estructuraJerarquica, region)
    : [];

  const handleChange = (campo, valor) => {
    if (campo === "region") {
      setRegion(valor);
      setDiagnostico(null); // reset diagnóstico al cambiar región
    } else if (campo === "diagnostico") {
      setDiagnostico(valor);
    }

    // Avisar al padre (RecoverPhoto)
    onChange?.({
      region: campo === "region" ? valor : region,
      diagnostico: campo === "diagnostico" ? valor : diagnostico,
    });
  };

  return (
    <Box
      sx={{
        backgroundColor: "#e0f2fe",
        padding: 3,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        maxWidth: 500,
        margin: "0 auto",
      }}
    >
      {/* REGION */}
      <Autocomplete
        options={regiones}
        value={region}
        onChange={(e, value) => handleChange("region", value)}
        renderInput={(params) => (
          <TextField {...params} label="Región anatómica" variant="outlined" />
        )}
      />

      {/* DIAGNOSTICO */}
      <Autocomplete
        options={diagnosticos}
        value={diagnostico}
        onChange={(e, value) => handleChange("diagnostico", value)}
        renderInput={(params) => (
          <TextField {...params} label="Diagnóstico" variant="outlined" />
        )}
        disabled={!region}
      />
    </Box>
  );
};

export default FormularioJerarquicoMUI;
