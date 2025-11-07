import React, { useEffect, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import { estructuraJerarquica as estructuraDefault } from "../data/estructura-jerarquica";
import { extraerDiagnosticosPorRegion } from "../helpers/extraerDiagnosticosPorRegion";

const FormularioJerarquicoMUI = ({ onChange }) => {
  const [estructura, setEstructura] = useState(estructuraDefault);
  const [region, setRegion] = useState(null);
  const [diagnostico, setDiagnostico] = useState(null);

  useEffect(() => {
    const fetchEstructura = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/formulario-jerarquico`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        if (data?.structure?.length) {
          const estructuraFinal = {};
          data.structure.forEach((region) => {
            estructuraFinal[region.nombre] = {};
            region.etiologias?.forEach((eti) => {
              estructuraFinal[region.nombre][eti.nombre] = {};
              eti.tejidos?.forEach((tej) => {
                estructuraFinal[region.nombre][eti.nombre][tej.nombre] = {};
                tej.diagnosticos?.forEach((dx) => {
                  estructuraFinal[region.nombre][eti.nombre][tej.nombre][dx.nombre] =
                    dx.tratamientos?.map((t) => t.nombre) || [];
                });
              });
            });
          });
          setEstructura(estructuraFinal);
        }
      } catch {
        setEstructura(estructuraDefault);
      }
    };
    fetchEstructura();
  }, []);

  const regiones = Object.keys(estructura || {});
  const diagnosticos = region ? extraerDiagnosticosPorRegion(estructura, region) : [];

  const handleChange = (campo, valor) => {
    if (campo === "region") {
      setRegion(valor);
      setDiagnostico(null);
    } else if (campo === "diagnostico") {
      setDiagnostico(valor);
    }

    onChange?.({
      region: campo === "region" ? valor : region,
      diagnostico: campo === "diagnostico" ? valor : diagnostico,
    });
  };

  return (
    <Box
      sx={{
        backgroundColor: "#FDFDFD",
        padding: 3,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        maxWidth: 500,
        margin: "0 auto",
      }}
    >
      <Autocomplete
        options={regiones}
        value={region}
        onChange={(e, value) => handleChange("region", value)}
        renderInput={(params) => (
          <TextField {...params} label="Región anatómica" variant="outlined" />
        )}
      />

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
