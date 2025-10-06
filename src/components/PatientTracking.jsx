// src/components/PatientTracking.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/PatientTracking.module.css";
import SplitButton from "./SplitButton";
import CaseGallery from "./CaseGallery";

const PatientTracking = () => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [dni, setDni] = useState("");
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [queried, setQueried] = useState(false);
  const [showCasesList, setShowCasesList] = useState(true);

  // 🎞️ Estado para la galería (igual que en Welcome)
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryCaseId, setGalleryCaseId] = useState(null);
  const [galleryTitle, setGalleryTitle] = useState("");

  const openGalleryByCase = (caseId, diagnostico, fecha) => {
    setGalleryCaseId(caseId);
    setGalleryTitle(`Caso ${caseId} — ${fecha} — ${diagnostico}`);
    setGalleryOpen(true);
  };

  const buscarCasosPorDNI = async () => {
    if (!dni) return;
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${apiUrl}/api/images/search?dni=${dni}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al buscar casos");
      const data = await res.json();

      // Normalización mínima: fecha legible + sort desc
      const options = { day: "2-digit", month: "short", year: "numeric" };
      const normalized = (Array.isArray(data) ? data : [])
        .map((raw) => {
          const dRaw = raw.createdAt || raw.updatedAt || raw.fecha || null;
          let d = null;
          if (typeof dRaw === "string") d = new Date(dRaw.replace(" ", "T"));
          else if (dRaw) d = new Date(dRaw);

          const images = Array.isArray(raw.images) ? raw.images : [];
          const items = Array.isArray(raw.items) ? raw.items : images;

          return {
            id: raw.id,
            diagnostico: raw.diagnostico || "Sin diagnóstico",
            region: raw.region || items[items.length - 1]?.region || "",
            images,
            items,
            fecha: d ? d.toLocaleDateString("es-AR", options) : "Sin fecha",
            ts: d ? d.getTime() : 0,
          };
        })
        .sort((a, b) => b.ts - a.ts);

      setCasos(normalized);
      setQueried(true);
    } catch (err) {
      console.error("[PatientTracking] buscarCasosPorDNI", err);
      setError(err.message || "No se pudieron buscar los casos.");
      setCasos([]);
      setQueried(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const digits = (dni || "").replace(/\D/g, "");
    if (digits.length >= 7) {
      buscarCasosPorDNI();
    } else {
      setCasos([]);
      setQueried(false);
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dni]);

  const hasResults = queried && !loading && !error && casos.length > 0;

  return (
    <div className={styles.container}>
      <h2>Seguimiento por paciente</h2>

      {/* Entrada DNI */}
      <div className={styles.searchRow}>
        <input
          type="text"
          placeholder="Ingresá DNI del paciente"
          value={dni}
          onChange={(e) =>
            setDni((e.target.value || "").replace(/\D/g, "").slice(0, 8))
          }
          className={styles.input}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          aria-label="DNI del paciente"
        />
        {!!dni && (
          <button className={styles.clearBtn} onClick={() => setDni("")}>
            ✕
          </button>
        )}
      </div>

      {/* Estados */}
      {loading && <p>Buscando casos...</p>}
      {!loading && error && <p className={styles.error}>{error}</p>}

      {/* Resultados */}
      {queried && (
        <div className={styles.casosList}>
          {!hasResults ? (
            <div className={styles.emptyNote}>
              No se encontraron casos para este paciente.
            </div>
          ) : (
            <>
              <div className={styles.casosHeader}>
                <h4>Casos previos para DNI {dni}</h4>
                <button
                  className={styles.toggleBtn}
                  onClick={() => setShowCasesList((v) => !v)}
                  aria-expanded={showCasesList}
                >
                  {showCasesList ? "▲" : "▼"}
                </button>
              </div>

              {showCasesList && (
                <div className={styles.casosContainer}>
                  {casos.map((c) => {
                    const count =
                      (Array.isArray(c.images) && c.images.length) ||
                      (Array.isArray(c.items) && c.items.length) ||
                      0;

                    // ✅ regionParam robusto (evita ReferenceError)
                    const regionParam =
                      c.region ||
                      (c.images?.length
                        ? c.images[c.images.length - 1]?.region
                        : "") ||
                      (c.items?.length
                        ? c.items[c.items.length - 1]?.region
                        : "") ||
                      "";

                    return (
                      <div
                        key={c.id}
                        className={styles.caseRow}
                        id={`case-row-${c.id}`}
                      >
                        <div className={styles.caseInfo}>
                          <strong>{c.fecha}</strong> {c.diagnostico} ({count})
                        </div>

                        <div className={styles.caseActions}>
                          <SplitButton
                            id={`continuar-${c.id}`}
                            label="Continuar caso"
                            items={[
                              {
                                label: "Capturar foto o video",
                                onClick: () => {
                                  const qs = new URLSearchParams({
                                    dni,
                                    dx: c.diagnostico || "",
                                    region: regionParam, // necesario para autostart
                                    mode: "foto",
                                    autostart: "1",
                                    caseId: String(c.id), // útil si luego querés reabrir menú
                                    from: "patient-tracking",
                                  }).toString();
                                  navigate(`/welcome/take-photo?${qs}`);
                                },
                              },
                              {
                                label: "Importar",
                                onClick: () => {
                                  const qs = new URLSearchParams({
                                    dni, // igual que en Welcome
                                    region: regionParam || "",
                                    dx: c.diagnostico || "",
                                  }).toString();
                                  navigate(`/welcome/import/${c.id}?${qs}`);
                                },
                              },
                              {
                                label: "Ver",
                                onClick: () =>
                                  openGalleryByCase(
                                    c.id,
                                    c.diagnostico,
                                    c.fecha
                                  ),
                              },
                            ]}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 🎞️ Galería igual que en Welcome */}
      <CaseGallery
        open={galleryOpen}
        caseId={galleryCaseId}
        title={galleryTitle}
        onClose={() => setGalleryOpen(false)}
      />
    </div>
  );
};

export default PatientTracking;
