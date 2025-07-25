export const agruparPorJerarquia = (imagenes) => {
    const estructura = [];
  
    imagenes.forEach(img => {
      const {
        region = 'Sin definir',
        diagnostico = 'Sin definir',
        tratamiento = 'Sin definir',
        optionalDNI = 'Sin DNI',
        uploadedAt,
        url,
        ...resto
      } = img;
  
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
          ...resto,
          dni: optionalDNI,
          fecha: uploadedAt?.slice(0, 10),
          imagenes: [],
          diagnostico,
          tratamiento,
          region
        };
        nodoTrat.casos.push(nodoCaso);
      }
  
      nodoCaso.imagenes.push(url);
    });
  
    return estructura;
  };
  