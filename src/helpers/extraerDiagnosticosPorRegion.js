// src/helpers/extraerDiagnosticosPorRegion.js

export const extraerDiagnosticosPorRegion = (estructuraJerarquica, region) => {
  const diagnosticos = new Set();

  if (!estructuraJerarquica[region]) return [];

  for (const etiologia of Object.values(estructuraJerarquica[region])) {
    for (const tejido of Object.values(etiologia)) {
      for (const diagnostico of Object.keys(tejido)) {
        diagnosticos.add(diagnostico);
      }
    }
  }

  return Array.from(diagnosticos);
};
